import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  processIncomingEmail,
  identifyContact,
  identifyPractitioner,
  CLARIFICATION_TEMPLATE
} from '../src/services/centralEmailRouter.js';

describe('MediLawAI — Architecture Centralisée & 4 Scénarios d’E-mails', () => {

  test('Étape 2 & 3 : identifyContact crée un contact externe sans exiger d’inscription', async () => {
    const contact = await identifyContact('visiteur.nouveau@gmail.com', 'Nouvel Utilisateur');
    assert.equal(contact.email, 'visiteur.nouveau@gmail.com');
    assert.equal(contact.type, 'EXTERNAL_CONTACT');
    assert.equal(contact.isRegistered, false);
  });

  test('Étape 3 : identifyPractitioner détecte le médecin par son nom dans le corps', async () => {
    const match = await identifyPractitioner({
      recipient: 'contact@medilawai.com',
      subject: 'Demande urgente de RDV',
      body: 'Bonjour, je souhaite un rendez-vous avec le Dr. Rayen B. s’il vous plaît.'
    });
    assert.equal(match.matched, true);
    assert.equal(match.method, 'NAME_IN_BODY');
    assert.ok(match.practitioner);
  });

  test('Étape 3 : identifyPractitioner détecte le médecin par sa spécialité cardiologie', async () => {
    const match = await identifyPractitioner({
      recipient: 'contact@medilawai.com',
      subject: 'Consultation cardiologie',
      body: 'Bonjour, je ressens de légères douleurs thoraciques et je cherche un cardiologue.'
    });
    assert.equal(match.matched, true);
    assert.equal(match.method, 'SPECIALTY_MATCH');
    assert.equal(match.practitioner.specialty, 'Cardiologie');
  });

  test('Scénario 1 : Patient inscrit + Médecin identifié', async () => {
    // Simuler contact inscrit
    const res = await processIncomingEmail({
      senderEmail: 'ahmed.inscrit@medilawai.com',
      senderName: 'Ahmed Ben Ali',
      recipient: 'contact@medilawai.com',
      subject: 'RDV de contrôle – Dr. Rayen',
      body: 'Bonjour Dr. Rayen, pour mon suivi cardiaque annuel.',
    });

    assert.equal(res.success, true);
    assert.ok(res.practitioner);
    assert.equal(res.needsClarification, false);
    assert.equal(res.email.status, 'PENDING_VALIDATION');
  });

  test('Scénario 2 : Patient non inscrit (externe) + Médecin identifié', async () => {
    const res = await processIncomingEmail({
      senderEmail: 'inconnu.externe@yahoo.fr',
      senderName: 'Salma Mansour',
      recipient: 'contact@medilawai.com',
      subject: 'Consultation pour Dr. Rayen B.',
      body: 'Bonjour, on m’a recommandé le Dr. Rayen pour une consultation.',
    });

    assert.equal(res.success, true);
    assert.equal(res.scenario, 2);
    assert.equal(res.contact.isRegistered, false);
    assert.equal(res.contact.type, 'EXTERNAL_CONTACT');
    assert.ok(res.practitioner);
    assert.equal(res.email.status, 'PENDING_VALIDATION');
  });

  test('Scénario 3 & 4 : Praticien inconnu -> Demande de clarification avec message exact', async () => {
    const res = await processIncomingEmail({
      senderEmail: 'patient.sans.medecin@gmail.com',
      recipient: 'contact@medilawai.com',
      subject: 'Je veux un rendez-vous',
      body: 'Bonjour, je voudrais prendre un rendez-vous pour une consultation.',
    });

    assert.equal(res.success, true);
    assert.equal(res.needsClarification, true);
    assert.equal(res.email.status, 'WAITING_FOR_REPLY');
    assert.equal(res.email.clarificationSent, true);

    // Vérifier le texte exact de clarification
    assert.ok(res.email.clarificationMessage.includes('Afin de transmettre votre demande au bon professionnel'));
    assert.ok(res.email.clarificationMessage.includes('Vous n\'avez pas besoin de créer un compte MediLawAI pour répondre à ce message.'));
  });

  test('Règle fondamentale : Template de clarification MediLawAI conforme', () => {
    assert.ok(CLARIFICATION_TEMPLATE.includes('contact@medilawai.com') || CLARIFICATION_TEMPLATE.includes('L\'équipe MediLawAI'));
    assert.ok(CLARIFICATION_TEMPLATE.includes('Vous n\'avez pas besoin de créer un compte MediLawAI'));
  });

  test('Multilingue : Détection automatique des langues (Français, Arabe, Anglais)', async () => {
    const { detectLanguage } = await import('../src/services/centralEmailRouter.js');
    assert.equal(detectLanguage('Bonjour, je souhaite un rendez-vous médical'), 'FR');
    assert.equal(detectLanguage('مرحبا، أريد حجز موعد مع الطبيب من فضلك'), 'AR');
    assert.equal(detectLanguage('Hello, I would like to schedule an urgent appointment please'), 'EN');
  });

  test('Cas 4 Spécifique : Praticien inexistant sur MediLawAI -> Message explicatif poli', async () => {
    const res = await processIncomingEmail({
      senderEmail: 'chercheur.docteur@gmail.com',
      recipient: 'contact@medilawai.com',
      subject: 'Consultation avec Dr. Dupont',
      body: 'Bonjour, je cherche le Dr. Dupont pour une consultation.',
    });

    assert.equal(res.success, true);
    assert.equal(res.needsClarification, true);
    assert.ok(res.email.clarificationMessage.includes('ne figure pas actuellement dans l\'annuaire'));
    assert.ok(res.email.clarificationMessage.includes('contact@medilawai.com'));
  });

  test('Phase 3 : Reprise de conversation après demande de clarification', async () => {
    const threadId = 'thread-clarif-test-' + Date.now();

    // 1. Premier e-mail sans médecin (Scénario 4)
    const firstMsg = await processIncomingEmail({
      senderEmail: 'patient.hesitant@gmail.com',
      senderName: 'Patient Hésitant',
      recipient: 'contact@medilawai.com',
      subject: 'Demande de RDV',
      body: 'Bonjour, je voudrais une consultation s’il vous plaît.',
      threadId,
    });
    assert.equal(firstMsg.needsClarification, true);
    assert.equal(firstMsg.email.status, 'WAITING_FOR_REPLY');

    // 2. Le patient répond en précisant le Dr. Rayen (même threadId)
    const replyMsg = await processIncomingEmail({
      senderEmail: 'patient.hesitant@gmail.com',
      senderName: 'Patient Hésitant',
      recipient: 'contact@medilawai.com',
      subject: 'Re: Demande de RDV',
      body: 'Pardon, c’est pour le Dr. Rayen B. en cardiologie.',
      threadId,
    });

    // Le fil a repris et orienté vers le Dr. Rayen
    assert.equal(replyMsg.needsClarification, false);
    assert.ok(replyMsg.practitioner);
    assert.equal(replyMsg.practitioner.name, 'Dr. Rayen B.');
    assert.equal(replyMsg.email.status, 'PENDING_VALIDATION');
  });

  test('Calendrier Interne Intelligent : Toutes les infos au 1er e-mail -> Confirmation en 1 message direct (sans Google Calendar)', async () => {
    const { evaluateBookingRequest } = await import('../src/services/smartBookingDecisionService.js');

    const result = await evaluateBookingRequest({
      messageText: 'Bonjour, je souhaite prendre un rendez-vous avec le Dr Rayen jeudi 26 novembre à 15h00 pour une consultation. Merci.',
      patientInfo: { name: 'Sami Chaabane', email: 'sami@gmail.com', phone: '+216 98 111 222' },
      practitioner: { _id: 'doc-rayen', name: 'Dr. Rayen B.', appointmentDuration: 30 }
    });

    assert.equal(result.decision, 'DIRECT_CONFIRMATION');
    assert.equal(result.confirmed, true);
    assert.equal(result.allInfoProvidedInitially, true);
    assert.equal(result.time, '15:00');
    assert.equal(result.date, '2026-11-26');
    assert.ok(result.message.includes('Nous vous confirmons avec plaisir votre rendez-vous'));
    assert.ok(result.message.includes('15:00 - 15:30'));
  });

  test('Calendrier Interne Intelligent : Créneau pendant la pause déjeuner (12:30-14:00) -> Propose des alternatives', async () => {
    const { evaluateBookingRequest } = await import('../src/services/smartBookingDecisionService.js');

    const result = await evaluateBookingRequest({
      messageText: 'Bonjour, je souhaite un rendez-vous avec le Dr Rayen le 2026-11-26 à 13h00 pour une consultation.',
      patientInfo: { name: 'Amine Jaziri' },
      practitioner: { _id: 'doc-rayen', name: 'Dr. Rayen B.', appointmentDuration: 30 }
    });

    assert.equal(result.decision, 'PROPOSE_ALTERNATIVES');
    assert.equal(result.confirmed, false);
    assert.ok(result.proposedSlots.length > 0);
    assert.ok(result.message.includes('créneaux alternatifs'));
  });

  test('Calendrier Interne Intelligent : Date présente mais Heure manquante -> Propose les créneaux sans redemander la date', async () => {
    const { evaluateBookingRequest } = await import('../src/services/smartBookingDecisionService.js');

    const result = await evaluateBookingRequest({
      messageText: 'Bonjour, je souhaite un rendez-vous avec le Dr Rayen le 26 novembre s’il vous plaît.',
      patientInfo: { name: 'Salma Mansour' },
      practitioner: { _id: 'doc-rayen', name: 'Dr. Rayen B.', appointmentDuration: 30 }
    });

    assert.equal(result.decision, 'NEED_TIME_PROPOSE_SLOTS');
    assert.equal(result.date, '2026-11-26');
    assert.ok(result.proposedSlots.length > 0);
    assert.ok(result.message.includes('voici les créneaux disponibles dans notre planning'));
  });

  test('Espace Patient Chat : Support du choix Avocat vs Médecin', async () => {
    const { evaluateBookingRequest } = await import('../src/services/smartBookingDecisionService.js');

    const resultAvocat = await evaluateBookingRequest({
      messageText: 'Je cherche un avocat pour une consultation juridique lundi à 10h00.',
      patientInfo: { name: 'Client Entreprise' },
    });

    assert.equal(resultAvocat.practitioner.profession, 'AVOCAT');
    assert.equal(resultAvocat.decision, 'DIRECT_CONFIRMATION');
    assert.ok(resultAvocat.message.includes('Me. Youssef Trabelsi') || resultAvocat.message.includes('avocat'));
  });

});
