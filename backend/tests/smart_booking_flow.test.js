import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDateFromText,
  parseTimeFromText,
  pickProposedSlot,
  evaluateBookingRequest,
} from '../src/services/smartBookingDecisionService.js';
import { processIncomingEmail, identifyPractitioner } from '../src/services/centralEmailRouter.js';
import { stripQuotedReply, extractBody } from '../src/services/gmailPollingService.js';
import { buildMimeMessage, buildReplySubject } from '../src/services/gmailSenderService.js';

process.env.EMAIL_SENDING_DISABLED = 'true';

// Lundi 23 novembre 2026, 11h00 à Tunis
const NOW = new Date('2026-11-23T10:00:00Z');

describe('Extraction date / heure', () => {
  test('dates explicites et relatives', () => {
    assert.equal(parseDateFromText('le 26/11/2026', NOW), '2026-11-26');
    assert.equal(parseDateFromText('le 26 novembre', NOW), '2026-11-26');
    assert.equal(parseDateFromText('le 1er décembre', NOW), '2026-12-01');
    assert.equal(parseDateFromText('demain', NOW), '2026-11-24');
    assert.equal(parseDateFromText('après-demain', NOW), '2026-11-25');
    assert.equal(parseDateFromText('jeudi prochain', NOW), '2026-11-26');
    // date passée sans année → année suivante
    assert.equal(parseDateFromText('le 3 janvier', NOW), '2027-01-03');
  });

  test('heures plausibles uniquement', () => {
    assert.equal(parseTimeFromText('à 15h30'), '15:30');
    assert.equal(parseTimeFromText('vers 9h'), '09:00');
    assert.equal(parseTimeFromText('10:15 svp'), '10:15');
    assert.equal(parseTimeFromText('le 26/11 à 14 h'), '14:00');
    assert.equal(parseTimeFromText('réponse sous 24h'), null);
    assert.equal(parseTimeFromText('le 26/11'), null);
  });

  test('choix parmi les créneaux proposés', () => {
    const slots = [{ date: '2026-11-26', time: '09:00' }, { date: '2026-11-26', time: '10:30' }];
    assert.deepEqual(pickProposedSlot('Je prends le deuxième créneau', slots), slots[1]);
    assert.deepEqual(pickProposedSlot('10h30 me va', slots), slots[1]);
    assert.equal(pickProposedSlot('merci beaucoup', slots), null);
  });
});

describe('Décision de réservation (calendrier interne réel)', () => {
  const practitioner = { _id: 'doc-test', name: 'Dr. Test', appointmentDuration: 30 };

  test('dimanche (fermé) → alternatives sur jours ouverts', async () => {
    const r = await evaluateBookingRequest({ messageText: 'rdv le 29/11/2026 à 10h', practitioner, now: NOW });
    assert.equal(r.decision, 'PROPOSE_ALTERNATIVES');
    assert.ok(r.proposedSlotObjects.length > 0);
    assert.ok(r.proposedSlotObjects.every(s => s.date !== '2026-11-29'));
  });

  test('pas de date → demande la date en proposant de vrais créneaux', async () => {
    const r = await evaluateBookingRequest({ messageText: 'je voudrais un rdv', practitioner, now: NOW });
    assert.equal(r.decision, 'NEED_DATE');
    assert.ok(r.proposedSlotObjects.length > 0);
    // aujourd'hui 11h + 1h de prévenance : rien avant 12h00
    assert.ok(r.proposedSlotObjects.every(s => s.date > '2026-11-23' || s.time >= '12:00'));
  });

  test('créneau choisi dans le contexte de conversation → confirmation', async () => {
    const context = { proposedSlots: [{ date: '2026-11-24', time: '09:00' }, { date: '2026-11-24', time: '09:30' }] };
    const r = await evaluateBookingRequest({ messageText: 'Le premier me convient', practitioner, context, now: NOW });
    assert.equal(r.decision, 'DIRECT_CONFIRMATION');
    assert.equal(r.date, '2026-11-24');
    assert.equal(r.time, '09:00');
  });
});

describe('Routage praticien : boîte centrale', () => {
  test("écrire à la boîte centrale n'identifie PAS de praticien", async () => {
    // rayen.9b7@gmail.com est à la fois la boîte connectée et l'email du praticien de démo
    process.env.CENTRAL_INBOX_EMAIL = 'rayen.9b7@gmail.com';
    const m = await identifyPractitioner({ recipient: 'rayen.9b7@gmail.com', subject: 'RDV', body: 'Bonjour, je veux un rendez-vous.' });
    assert.equal(m.matched, false);
    delete process.env.CENTRAL_INBOX_EMAIL;
  });

  test('« Ben » seul dans un mot ne déclenche pas de faux positif', async () => {
    const m = await identifyPractitioner({ recipient: 'contact@medilawai.com', subject: '', body: 'Je souhaite bénéficier d’une consultation' });
    assert.equal(m.method, 'NONE_UNASSIGNED');
  });

  test('« comme rendez-vous » ne crée pas un faux praticien « rendez »', async () => {
    const m = await identifyPractitioner({ recipient: 'contact@medilawai.com', subject: '', body: 'Je voudrais un créneau comme rendez-vous' });
    assert.equal(m.unregisteredPractitionerMentioned, false);
  });
});

describe('Conversation complète par e-mail', () => {
  test('1er mail sans praticien (avec date+heure) → clarification ; réponse « Dr Rayen » → RDV confirmé avec la date initiale', async () => {
    const threadId = 'thread-flow-' + Date.now();
    const first = await processIncomingEmail({
      senderEmail: 'flow.patient@gmail.com',
      senderName: 'Patient Flow',
      subject: 'Demande de rendez-vous',
      body: 'Bonjour, je voudrais un rendez-vous le 26/11/2026 à 10h00 pour une consultation.',
      threadId,
      now: NOW,
    });
    assert.equal(first.decision, 'NEEDS_CLARIFICATION');
    assert.ok(first.email.clarificationMessage.includes('Dr. Rayen B.'), 'la clarification liste les praticiens');
    assert.ok(first.email.clarificationMessage.includes('jeudi 26 novembre 2026'), 'la demande initiale est rappelée');

    const reply = await processIncomingEmail({
      senderEmail: 'flow.patient@gmail.com',
      senderName: 'Patient Flow',
      subject: 'Re: Demande de rendez-vous',
      body: 'Avec le Dr Rayen svp',
      threadId,
      now: NOW,
    });
    assert.equal(reply.isFollowUp, true);
    assert.equal(reply.practitioner.name, 'Dr. Rayen B.');
    assert.equal(reply.decision, 'DIRECT_CONFIRMATION');
    assert.equal(reply.autoBooking.date, '2026-11-26');
    assert.equal(reply.autoBooking.time, '10:00');
  });

  test('praticien + date sans heure → créneaux proposés, puis « le deuxième » → confirmé', async () => {
    const threadId = 'thread-slots-' + Date.now();
    const first = await processIncomingEmail({
      senderEmail: 'slots.patient@gmail.com',
      subject: 'RDV Dr Rayen',
      body: 'Bonjour, un rendez-vous avec le Dr Rayen le 27/11/2026 svp.',
      threadId,
      now: NOW,
    });
    assert.equal(first.decision, 'NEED_TIME_PROPOSE_SLOTS');
    const second = first.autoBooking.proposedSlotObjects[1];

    const reply = await processIncomingEmail({
      senderEmail: 'slots.patient@gmail.com',
      subject: 'Re: RDV Dr Rayen',
      body: 'Je prends le deuxième créneau, merci',
      threadId,
      now: NOW,
    });
    assert.equal(reply.decision, 'DIRECT_CONFIRMATION');
    assert.equal(reply.autoBooking.time, second.time);
  });

  test('« RDV urgent » n’est pas une urgence vitale ; douleur thoracique oui', async () => {
    const a = await processIncomingEmail({ senderEmail: 'u1@gmail.com', subject: 'RDV urgent', body: 'Rendez-vous urgent avec le Dr Rayen demain à 10h', now: NOW });
    assert.equal(a.isEmergency, false);
    const b = await processIncomingEmail({ senderEmail: 'u2@gmail.com', subject: 'Aide', body: "J'ai une douleur thoracique très forte depuis ce matin", now: NOW });
    assert.equal(b.isEmergency, true);
    assert.equal(b.email.status, 'ESCALATED_EMERGENCY');
  });

  test('e-mails automatiques / de la boîte centrale ignorés (anti-boucle)', async () => {
    const r = await processIncomingEmail({ senderEmail: 'no-reply@service.com', subject: 'Notification', body: 'x' });
    assert.equal(r.ignored, true);
  });
});

describe('Gmail : parsing et construction MIME', () => {
  test('retire l’historique cité', () => {
    const txt = 'Avec le Dr Rayen svp\n\nLe lun. 23 nov. 2026 à 10:00, MediLawAI <c@x.com> a écrit :\n> Bonjour,\n> quel praticien ?';
    assert.equal(stripQuotedReply(txt), 'Avec le Dr Rayen svp');
  });

  test('extrait le text/plain d’un multipart', () => {
    const b64 = (s) => Buffer.from(s).toString('base64url');
    const body = extractBody({ mimeType: 'multipart/alternative', parts: [
      { mimeType: 'text/plain', body: { data: b64('Bonjour é') } },
      { mimeType: 'text/html', body: { data: b64('<p>Bonjour</p>') } },
    ] });
    assert.equal(body.text, 'Bonjour é');
  });

  test('réponse dans le fil : Re:, In-Reply-To, sujet UTF-8', () => {
    assert.equal(buildReplySubject('Demande'), 'Re: Demande');
    assert.equal(buildReplySubject('RE: Demande'), 'RE: Demande');
    const mime = buildMimeMessage({ from: 'c@x.com', to: 'p@y.com', subject: 'Re: Créneau', body: 'é', inReplyTo: '<abc@mail>' });
    assert.ok(mime.includes('In-Reply-To: <abc@mail>'));
    assert.ok(mime.includes('Subject: =?UTF-8?B?'));
    assert.ok(mime.includes('Auto-Submitted: auto-replied'));
  });
});
