import mongoose from 'mongoose';
import Contact from '../models/Contact.js';
import Email from '../models/Email.js';
import EmailThread from '../models/EmailThread.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import Appointment from '../models/Appointment.js';
import AuditLog from '../models/AuditLog.js';
import { queryAiService } from './aiClient.js';
import {
  evaluateBookingRequest,
  normalizeText,
  formatDateFr,
  parseDateDetailed,
  parseTimeFromText,
  parsePeriodPreference,
  parseReasonFromText,
} from './smartBookingDecisionService.js';
import { sendGmailMessage, buildReplySubject } from './gmailSenderService.js';
import { getCentralMailboxAddresses, readIntegrationsConfig } from './googleAuthService.js';
import { notifyN8n, N8N_EVENTS } from './n8nNotifier.js';

/**
 * MediLawAI — Moteur Centralisé de Routage et Traitement des E-mails
 *
 * Flux :
 *  1. Le patient écrit à la boîte centrale (aucun compte requis).
 *  2. Identification du contact (inscrit / externe).
 *  3. Identification du praticien (alias, lien, nom, spécialité).
 *     → inconnu : e-mail de clarification envoyé (« quel praticien ? »).
 *  4. Analyse IA de l'intention.
 *  5. Demande de RDV : décision automatique sur le calendrier interne réel
 *     → confirmation directe si tout est clair et libre, sinon proposition de créneaux.
 *  6. Le contexte de la conversation (praticien, date, créneaux proposés) est conservé
 *     dans le fil : la réponse du patient complète la demande initiale.
 *  7. Réponse envoyée automatiquement par Gmail (ou conservée en brouillon HITL).
 */

const DEFAULT_TENANT_ID = '66f1234567890abcdef12345';

export const UNREGISTERED_PRACTITIONER_TEMPLATE = (name) => `Bonjour,

Merci d'avoir contacté MediLawAI.

Le praticien ou professionnel que vous recherchez (${name || 'demandé'}) ne figure pas actuellement dans l'annuaire de notre cabinet / plateforme.

Si vous souhaitez être orienté(e) vers un autre praticien de notre équipe ou obtenir un accompagnement, vous pouvez répondre directement à cet e-mail ou joindre notre secrétariat d'accueil à contact@medilawai.com.

Vous n'avez pas besoin de créer un compte MediLawAI pour échanger avec nous.

Cordialement,
L'équipe MediLawAI`;

export const CLARIFICATION_TEMPLATE = `Bonjour,

Merci d'avoir contacté MediLawAI.

Afin de transmettre votre demande au bon professionnel, pourriez-vous nous préciser :
- Le nom du médecin, de l'avocat ou du praticien souhaité.
- Le nom de son cabinet, si vous le connaissez.
- Sa spécialité, si possible.

Si vous ne connaissez pas encore le nom du professionnel, indiquez-nous simplement le type de service que vous recherchez.

Vous n'avez pas besoin de créer un compte MediLawAI pour répondre à ce message.

Cordialement,
L'équipe MediLawAI`;

/**
 * Message de clarification enrichi : rappelle la demande comprise et liste les praticiens.
 */
export function buildClarificationMessage({ doctors = [], candidates = [], unregisteredName = null, bookingContext = {} } = {}) {
  if (unregisteredName) {
    const base = UNREGISTERED_PRACTITIONER_TEMPLATE(unregisteredName);
    if (!doctors.length) return base;
    const list = doctors.map(d => `• ${d.name}${d.specialty ? ' — ' + d.specialty : ''}`).join('\n');
    return base.replace('Vous n\'avez pas besoin', `Praticiens disponibles sur notre plateforme :\n${list}\n\nVous n'avez pas besoin`);
  }

  const shown = candidates.length > 1 ? candidates : doctors;
  let msg = CLARIFICATION_TEMPLATE;
  const extras = [];
  if (bookingContext.date) {
    extras.push(`Nous avons bien noté votre souhait de rendez-vous le ${formatDateFr(bookingContext.date)}${bookingContext.time ? ' à ' + bookingContext.time.replace(':', 'h') : ''} : il sera réservé dès votre réponse si le créneau est libre.`);
  }
  if (shown.length) {
    const title = candidates.length > 1 ? 'Plusieurs praticiens peuvent correspondre à votre demande :' : 'Nos praticiens disponibles :';
    extras.push(`${title}\n${shown.map(d => `• ${d.name}${d.specialty ? ' — ' + d.specialty : ''}`).join('\n')}`);
  }
  if (extras.length) {
    msg = msg.replace('Vous n\'avez pas besoin', `${extras.join('\n\n')}\n\nVous n'avez pas besoin`);
  }
  return msg;
}

export function detectLanguage(text = '') {
  if (!text) return 'FR';
  if (/[؀-ۿ]/.test(text)) return 'AR';
  const clean = text.toLowerCase();
  const englishWords = ['appointment', 'please', 'schedule', 'doctor', 'cancel', 'urgent', 'available', 'thank you', 'hello', 'pain', 'consultation'];
  const frenchWords = ['bonjour', 'rendez-vous', 'consultation', 'docteur', 'urgent', 'merci', 'souhaite', 'créneau', 'cabinet'];
  let enScore = 0;
  let frScore = 0;
  for (const w of englishWords) if (clean.includes(w)) enScore++;
  for (const w of frenchWords) if (clean.includes(w)) frScore++;
  if (enScore > frScore && enScore >= 2) return 'EN';
  return 'FR';
}

// Urgence vitale uniquement (un « RDV urgent » n'est PAS une urgence vitale)
const VITAL_EMERGENCY_RE = /douleur(s)? (thoracique|a la poitrine|dans la poitrine)|poitrine serree|infarctus|\bavc\b|paralysie|perte de connaissance|evanoui|ne respire|difficulte(s)? a respirer|detresse respiratoire|etouffe|hemorragie|saigne(ment)? abondant|convulsion|\bsamu\b|idees? suicidaires|suicide|chest pain|can'?t breathe|unconscious/;

const APPOINTMENT_RE = /rendez[- ]vous|\brdv\b|consultation|creneau|disponibilit|\bvoir le (dr|docteur|medecin)|appointment|prendre (un )?rdv|reserver|reservation|controle|visite/;
const CANCEL_RE = /\bannul|\bcancel|ne (pourrai|pourrais|peux) (pas|plus) venir|empechement|desister|supprimer (mon|le) (rdv|rendez)/;
const RESCHEDULE_RE = /\bdeplacer|\breporter|\bdecaler|changer (de|mon|le) (creneau|rdv|rendez|horaire)|reschedule/;

const fallbackStore = {
  contacts: new Map(),
  threads: new Map(),
  emails: new Map(),
  doctors: [
    {
      _id: 'doc-rayen',
      id: 'doc-rayen',
      name: 'Dr. Rayen B.',
      professionalEmail: 'rayen.9b7@gmail.com',
      specialty: 'Cardiologie',
      keywords: ['rayen', 'cardiologue', 'cardiologie', 'coeur', 'palpitation'],
    },
    {
      _id: 'doc-youssef',
      id: 'doc-youssef',
      name: 'Dr. Youssef Ben Salem',
      professionalEmail: 'youssef@medilawai.com',
      specialty: 'Médecine Générale',
      keywords: ['youssef', 'generaliste', 'medecine generale', 'docteur youssef'],
    },
  ],
};

const isDbConnected = () => mongoose.connection.readyState === 1;

async function resolveDefaultTenantId() {
  if (isDbConnected()) {
    try {
      const clinic = await Clinic.findOne().select('_id').lean();
      if (clinic) return clinic._id;
    } catch {}
  }
  return DEFAULT_TENANT_ID;
}

async function loadActiveDoctors() {
  if (isDbConnected()) {
    try {
      const docs = await Doctor.find({ status: 'ACTIVE' }).lean();
      if (docs.length) return docs;
    } catch {}
  }
  return fallbackStore.doctors;
}

// ─── Étape 2 : Identification du contact ─────────────────────────────────────
export async function identifyContact(senderEmail, senderName = '') {
  const cleanEmail = (senderEmail || '').toLowerCase().trim();

  if (isDbConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      const patient = await Patient.findOne({ email: cleanEmail });
      const isRegistered = Boolean(user || patient);

      let contact = await Contact.findOne({ email: cleanEmail });
      if (!contact) {
        contact = await Contact.create({
          email: cleanEmail,
          name: senderName || patient?.name || user?.name || cleanEmail.split('@')[0],
          phone: patient?.phone || '',
          type: isRegistered ? 'REGISTERED_PATIENT' : 'EXTERNAL_CONTACT',
          isRegistered,
          userId: user?._id,
          patientId: patient?._id,
          firstContactAt: new Date(),
          lastContactAt: new Date(),
        });
      } else {
        if (isRegistered && !contact.isRegistered) {
          contact.isRegistered = true;
          contact.type = 'REGISTERED_PATIENT';
        }
        if (senderName && (!contact.name || contact.name === cleanEmail.split('@')[0])) contact.name = senderName;
        contact.lastContactAt = new Date();
        await contact.save();
      }

      return {
        id: String(contact._id),
        email: contact.email,
        name: contact.name,
        phone: contact.phone || patient?.phone || '',
        type: contact.type,
        isRegistered: contact.isRegistered,
      };
    } catch (err) {
      console.warn('[CentralRouter] Erreur DB identifyContact, fallback en mémoire:', err.message);
    }
  }

  if (fallbackStore.contacts.has(cleanEmail)) {
    const existing = fallbackStore.contacts.get(cleanEmail);
    existing.lastContactAt = new Date();
    return existing;
  }
  const newContact = {
    id: null,
    email: cleanEmail,
    name: senderName || cleanEmail.split('@')[0],
    type: 'EXTERNAL_CONTACT',
    isRegistered: false,
    firstContactAt: new Date(),
    lastContactAt: new Date(),
  };
  fallbackStore.contacts.set(cleanEmail, newContact);
  return newContact;
}

// ─── Étape 3 : Identification du praticien ───────────────────────────────────
const NAME_STOPWORDS = new Set(['dr', 'docteur', 'doctor', 'me', 'maitre', 'pr', 'professeur', 'ben', 'bin', 'ibn', 'el', 'de', 'du', 'la', 'le', 'des', 'et']);
const SPECIALTY_STOPWORDS = new Set(['medecine', 'medical', 'medicale', 'cabinet', 'consultation', 'interventionnelle', 'interne', 'generale']);
const SPECIALTY_SYNONYMS = [
  [/cardio/, ['cardio', 'coeur', 'cardiaque', 'palpitation', 'tension arterielle', 'hypertension']],
  [/generale|generaliste/, ['generaliste', 'medecin traitant', 'medecin de famille', 'medecine generale']],
  [/echograph/, ['echograph']],
  [/dermato/, ['dermato', 'peau', 'acne', 'eczema']],
  [/pediatr/, ['pediatr', 'mon enfant', 'mon bebe', 'mon fils', 'ma fille']],
  [/gyneco/, ['gyneco', 'grossesse', 'enceinte']],
  [/ophtalmo/, ['ophtalmo', 'yeux', 'vue']],
  [/dentaire|dentiste/, ['dentiste', 'dent', 'dents']],
  [/droit|avocat|juridique/, ['avocat', 'juridique', 'litige', 'contrat', 'tribunal']],
];

const wordRe = (w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);

function specialtyTerms(doc) {
  const spec = normalizeText(doc.specialty || '');
  const terms = new Set((doc.keywords || []).map(k => normalizeText(k)));
  for (const token of spec.split(/[^a-z]+/)) {
    if (token.length >= 5 && !SPECIALTY_STOPWORDS.has(token)) terms.add(token.slice(0, 6));
  }
  for (const [re, syns] of SPECIALTY_SYNONYMS) {
    if (re.test(spec)) syns.forEach(s => terms.add(s));
  }
  return [...terms].filter(Boolean);
}

export async function identifyPractitioner({ recipient, subject = '', body = '' }) {
  const fullText = normalizeText(`${subject} ${body}`);
  const recipientClean = (recipient || '').toLowerCase().trim();
  const doctors = await loadActiveDoctors();
  const centralAddresses = getCentralMailboxAddresses();

  // 1. Adresse de destination : alias dédié d'un praticien (jamais la boîte centrale)
  if (recipientClean) {
    const [local, domain] = recipientClean.split('@');
    const plusTag = local?.includes('+') ? local.split('+')[1] : null;
    const baseAddress = plusTag ? `${local.split('+')[0]}@${domain}` : recipientClean;
    const isCentral = centralAddresses.has(recipientClean) || centralAddresses.has(baseAddress);

    for (const doc of doctors) {
      const docEmail = (doc.professionalEmail || '').toLowerCase();
      const aliases = (doc.receptionAliases || []).map(a => a.toLowerCase().trim());
      const slug = normalizeText(doc.name || '').replace(/[^a-z0-9]/g, '');
      const publicId = (doc.publicContactId || '').toLowerCase();

      const aliasHit = aliases.includes(recipientClean);
      const plusHit = plusTag && (slug.includes(plusTag.replace(/[^a-z0-9]/g, '')) || plusTag === publicId);
      const emailHit = !isCentral && recipientClean === docEmail;
      if (aliasHit || plusHit || emailHit) {
        return { matched: true, practitioner: doc, method: 'RECIPIENT_ALIAS', confidence: 0.99 };
      }
    }
  }

  // 2. Lien personnalisé (medilawai.com/rdv/<slug|id|publicContactId>)
  for (const doc of doctors) {
    const docId = String(doc._id || doc.id).toLowerCase();
    const slug = normalizeText(doc.name || '').replace(/[^a-z0-9]/g, '');
    const publicId = (doc.publicContactId || '').toLowerCase();
    if (
      (publicId && fullText.includes(`/rdv/${publicId}`)) ||
      fullText.includes(`medilawai.com/rdv/${slug}`) ||
      fullText.includes(`medilawai.com/rdv/${docId}`)
    ) {
      return { matched: true, practitioner: doc, method: 'PERSONAL_LINK', confidence: 0.98 };
    }
  }

  // 3. Nom du praticien cité (mots entiers, accents ignorés)
  const nameMatches = [];
  for (const doc of doctors) {
    const parts = normalizeText(doc.name || '').split(/[^a-z0-9]+/).filter(p => p.length >= 3 && !NAME_STOPWORDS.has(p));
    const hits = parts.filter(p => wordRe(p).test(fullText));
    if (hits.length) nameMatches.push({ doc, score: hits.length });
  }
  if (nameMatches.length) {
    nameMatches.sort((a, b) => b.score - a.score);
    if (nameMatches.length === 1 || nameMatches[0].score > nameMatches[1].score) {
      return { matched: true, practitioner: nameMatches[0].doc, method: 'NAME_IN_BODY', confidence: 0.92 };
    }
  }

  // 4. Spécialité / mots-clés métier
  let candidates = nameMatches.map(m => m.doc);
  if (!nameMatches.length) {
    const specMatches = doctors.filter(doc => specialtyTerms(doc).some(term => fullText.includes(term)));
    if (specMatches.length === 1) {
      return { matched: true, practitioner: specMatches[0], method: 'SPECIALTY_MATCH', confidence: 0.85 };
    }
    candidates = specMatches;
  }

  // 5. Aucun / plusieurs praticiens. Un nom cité mais absent de l'annuaire ?
  const MENTION_STOP = new Set(['pour', 'qui', 'que', 'svp', 'generaliste', 'specialiste', 'traitant', 'de', 'du', 'la', 'le', 'les', 'en', 'un', 'une', 'disponible', 'rapidement']);
  let mentionedName = null;
  if (!candidates.length) {
    const re = /(?:^|[^a-z])(?:dr\.?|docteur|doctor|maitre|me\.)\s+([a-z][a-z-]{2,})/g;
    let m;
    while ((m = re.exec(fullText))) {
      if (!MENTION_STOP.has(m[1])) { mentionedName = m[1]; break; }
    }
  }

  return {
    matched: false,
    practitioner: null,
    ambiguous: candidates.length > 1,
    candidateCount: candidates.length,
    candidates,
    doctors,
    unregisteredPractitionerMentioned: Boolean(mentionedName),
    mentionedName: mentionedName ? mentionedName.charAt(0).toUpperCase() + mentionedName.slice(1) : null,
    method: 'NONE_UNASSIGNED',
    confidence: 0.0,
  };
}

// ─── Fils de conversation ────────────────────────────────────────────────────
async function findThread({ threadId, contactEmail }) {
  if (isDbConnected()) {
    try {
      if (threadId) {
        const t = await EmailThread.findOne({ threadId }).lean();
        if (t) return t;
      }
      // Le patient a écrit un nouvel e-mail au lieu de répondre : reprise du fil en attente récent
      if (contactEmail) {
        const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        return await EmailThread.findOne({
          contactEmail,
          status: { $in: ['WAITING_FOR_REPLY', 'NEEDS_CLARIFICATION'] },
          lastMessageAt: { $gte: since },
        }).sort({ lastMessageAt: -1 }).lean();
      }
    } catch {}
    return null;
  }
  if (threadId && fallbackStore.threads.has(threadId)) return fallbackStore.threads.get(threadId);
  return null;
}

async function loadThreadPractitioner(thread, doctors) {
  if (!thread) return null;
  if (thread.practitioner) return thread.practitioner;
  if (!thread.practitionerId) return null;
  const id = String(thread.practitionerId);
  const local = doctors.find(d => String(d._id || d.id) === id);
  if (local) return local;
  if (isDbConnected() && mongoose.isValidObjectId(id)) {
    try { return await Doctor.findById(id).lean(); } catch {}
  }
  return null;
}

function detectIntentLocally(text) {
  const t = normalizeText(text);
  if (CANCEL_RE.test(t)) return 'CANCEL';
  if (RESCHEDULE_RE.test(t)) return 'RESCHEDULE';
  if (APPOINTMENT_RE.test(t)) return 'APPOINTMENT';
  if (/tarif|prix|combien|cout|\bdt\b|dinars?/.test(t)) return 'PRICING';
  return null;
}

async function cancelAppointmentFromThread(appointmentId) {
  if (!isDbConnected() || !mongoose.isValidObjectId(String(appointmentId))) return null;
  try {
    const apt = await Appointment.findById(appointmentId);
    if (!apt || !['SCHEDULED', 'CONFIRMED'].includes(apt.status)) return null;
    apt.status = 'CANCELLED';
    await apt.save();
    return apt.toObject();
  } catch (e) {
    console.warn('[CentralRouter] Annulation impossible:', e.message);
    return null;
  }
}

// ─── Pipeline principal ──────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {boolean} [params.autoSend=false] Envoie réellement la réponse via Gmail
 *        (sinon brouillon en attente de validation humaine).
 */
export async function processIncomingEmail({
  senderEmail,
  senderName = '',
  recipient = 'contact@medilawai.com',
  subject = '',
  body = '',
  bodyHtml = '',
  attachments = [],
  threadId = null,
  gmailMessageId = null,
  rfcMessageId = null,
  references = null,
  receivedAt = new Date(),
  autoSend = false,
  now = new Date(),
}) {
  const cleanSender = (senderEmail || '').toLowerCase().trim();

  // Protection anti-boucle : jamais de réponse à la boîte centrale ni aux robots
  if (getCentralMailboxAddresses().has(cleanSender) || /no-?reply|mailer-daemon|postmaster|notifications?@/.test(cleanSender)) {
    return { success: true, ignored: true, reason: 'SELF_OR_AUTOMATED_SENDER', email: null };
  }

  const stableThreadId = threadId || gmailMessageId || `thread-${Date.now()}`;
  const autoSendEnabled = autoSend && process.env.AUTO_REPLY_MODE !== 'hitl' && readIntegrationsConfig().autoReplyMode !== 'hitl';

  // ─── Étape 2 : contact ───────────────────────────────────────────────────
  const contact = await identifyContact(cleanSender, senderName);

  // ─── Reprise de conversation ─────────────────────────────────────────────
  const existingThread = await findThread({ threadId: stableThreadId, contactEmail: contact.email });
  const effectiveThreadId = existingThread?.threadId || stableThreadId;
  const isFollowUp = Boolean(existingThread && ['WAITING_FOR_REPLY', 'NEEDS_CLARIFICATION', 'PENDING_VALIDATION', 'SENT'].includes(existingThread.status));
  const bookingContext = { ...(existingThread?.bookingContext || {}) };
  const historyText = isFollowUp ? (existingThread.originalText || '') : '';

  // ─── Étape 3 : praticien ─────────────────────────────────────────────────
  const doctors = await loadActiveDoctors();
  let matchResult = await identifyPractitioner({ recipient, subject, body });
  let practitioner = matchResult.matched ? matchResult.practitioner : null;

  if (!practitioner && isFollowUp) {
    // Praticien déjà connu dans ce fil, ou cité dans le premier message
    practitioner = await loadThreadPractitioner(existingThread, doctors);
    if (!practitioner && historyText) {
      const historic = await identifyPractitioner({ recipient, subject: '', body: historyText });
      if (historic.matched) { matchResult = historic; practitioner = historic.practitioner; }
    }
    if (practitioner && !matchResult.matched) {
      matchResult = { ...matchResult, matched: true, method: matchResult.method === 'NONE_UNASSIGNED' ? 'NAME_IN_BODY' : matchResult.method, confidence: 0.9 };
    }
  }
  const isPractitionerIdentified = Boolean(practitioner);

  let scenario;
  if (contact.isRegistered && isPractitionerIdentified) scenario = 1;
  else if (!contact.isRegistered && isPractitionerIdentified) scenario = 2;
  else if (contact.isRegistered) scenario = 3;
  else scenario = 4;

  const detectedLang = detectLanguage(`${subject} ${body}`);
  const combinedText = `${subject}\n${body}`;
  const normalized = normalizeText(combinedText);

  // ─── Étape 5 : analyse IA ────────────────────────────────────────────────
  let aiResult = { intent: 'UNCERTAIN', confidence: 0.5, suggestedReply: '', extractedEntities: {} };
  try {
    const res = await queryAiService({
      subject,
      body,
      language: detectedLang,
      clinicType: practitioner?.profession === 'AVOCAT' ? 'LEGAL' : 'MEDICAL',
    });
    if (res) {
      const INTENT_ALIASES = { CANCELLATION: 'CANCEL', INFORMATION: 'ADMINISTRATIVE', OTHER: 'UNCERTAIN', BOOKING_REQUEST: 'APPOINTMENT' };
      aiResult = {
        intent: INTENT_ALIASES[res.intent] || res.intent || 'UNCERTAIN',
        confidence: res.confidence || 0.5,
        // Les réponses types du service IA sont génériques : les réponses envoyées
        // sont toujours construites ici à partir des vraies données (praticien, agenda).
        suggestedReply: '',
        extractedEntities: res.extractedEntities || {},
        urgencyKeywords: res.extractedEntities?.urgencyKeywords || [],
        isFallback: Boolean(res.isFallback),
      };
    }
  } catch {
    console.warn('[CentralRouter] Service IA indisponible, analyse locale.');
  }

  const localIntent = detectIntentLocally(combinedText);
  let intent = aiResult.intent;
  if (['UNCERTAIN', 'ADMINISTRATIVE'].includes(intent) || aiResult.isFallback || (intent === 'EMERGENCY' && localIntent)) {
    intent = localIntent || intent;
  }
  // Une réponse dans un fil de prise de RDV reste une demande de RDV (« le premier », « Dr Nadia », « 15h »)
  if (isFollowUp && !['CANCEL', 'RESCHEDULE'].includes(localIntent) && (bookingContext.awaiting || existingThread?.status === 'WAITING_FOR_REPLY')) {
    intent = 'APPOINTMENT';
  }
  // Déplacement : on réserve le nouveau créneau, puis on annule l'ancien RDV (jamais deux RDV actifs)
  const rescheduleFrom = (localIntent === 'RESCHEDULE' && bookingContext.appointmentId)
    ? bookingContext.appointmentId
    : (bookingContext.rescheduleFrom || null);
  if (intent === 'RESCHEDULE') intent = 'APPOINTMENT';

  // L'IA seule (mot « urgent », numéro « 190 »…) ne suffit pas : il faut un signe vital explicite
  const VITAL_AI_KEYWORDS = ['infarctus', 'avc', 'paralysie', 'perte de connaissance', 'étouffement', 'hémorragie', 'détresse respiratoire', 'malaise grave', 'douleur thoracique'];
  const isEmergency = VITAL_EMERGENCY_RE.test(normalized)
    || (aiResult.intent === 'EMERGENCY' && !aiResult.isFallback && (aiResult.urgencyKeywords || []).some(k => VITAL_AI_KEYWORDS.includes(k)));
  if (isEmergency) intent = 'EMERGENCY';

  // ─── Étape 6 : décision et brouillon ─────────────────────────────────────
  let draftReply = '';
  let decision = 'HUMAN_REVIEW';
  let autoBookingResult = null;
  let clarificationMessage = null;
  let shouldAutoSend = false;
  let nextBookingContext = { ...bookingContext };
  const tenantId = practitioner?.tenantId || await resolveDefaultTenantId();

  if (isEmergency) {
    decision = 'EMERGENCY';
    draftReply = `Bonjour${contact.name ? ' ' + contact.name : ''},\n\n⚠️ Votre message décrit des symptômes qui peuvent nécessiter une prise en charge immédiate.\n\nSi votre état présente un risque vital, appelez SANS ATTENDRE le SAMU au 190 (ou la Protection Civile au 198) ou rendez-vous aux urgences les plus proches.\n\nL'équipe médicale a été alertée de votre message et reviendra vers vous rapidement.\n\nLe secrétariat MediLawAI`;
    shouldAutoSend = true;
  } else if (intent === 'CANCEL' && bookingContext.appointmentId) {
    const cancelled = await cancelAppointmentFromThread(bookingContext.appointmentId);
    if (cancelled) {
      decision = 'CANCELLED';
      draftReply = `Bonjour${contact.name ? ' ' + contact.name : ''},\n\nVotre rendez-vous du ${formatDateFr(cancelled.date)} à ${cancelled.timeSlot.start} a bien été annulé. Le créneau a été libéré.\n\nN'hésitez pas à nous écrire pour reprendre un nouveau rendez-vous.\n\nBien cordialement,\nLe secrétariat MediLawAI`;
      shouldAutoSend = true;
      nextBookingContext = { reason: bookingContext.reason };
    } else {
      draftReply = `Bonjour,\n\nNous avons bien reçu votre demande d'annulation. Notre secrétariat la traite et vous confirme sous peu.\n\nCordialement,\nLe secrétariat MediLawAI`;
    }
  } else if (!isPractitionerIdentified && (intent === 'APPOINTMENT' || intent === 'UNCERTAIN' || !intent)) {
    // Praticien inconnu → e-mail de clarification. On mémorise déjà la date / l'heure demandées.
    const parsedDate = parseDateDetailed(combinedText, now);
    nextBookingContext = {
      ...nextBookingContext,
      date: (!parsedDate.approximate && parsedDate.date) || bookingContext.date || null,
      time: parseTimeFromText(combinedText) || bookingContext.time || null,
      reason: bookingContext.reason || parseReasonFromText(combinedText),
      period: parsePeriodPreference(combinedText) || bookingContext.period || null,
      awaiting: 'PRACTITIONER',
    };
    clarificationMessage = buildClarificationMessage({
      doctors: matchResult.doctors || doctors,
      candidates: matchResult.candidates || [],
      unregisteredName: matchResult.unregisteredPractitionerMentioned ? matchResult.mentionedName : null,
      bookingContext: nextBookingContext,
    });
    draftReply = clarificationMessage;
    decision = 'NEEDS_CLARIFICATION';
    shouldAutoSend = true;
  } else if (intent === 'APPOINTMENT' && isPractitionerIdentified) {
    autoBookingResult = await evaluateBookingRequest({
      messageText: combinedText,
      patientInfo: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        source: 'EMAIL_AI',
      },
      practitioner,
      tenantId,
      context: {
        date: bookingContext.date,
        // Pour un déplacement, l'ancienne heure ne doit pas être reprise
        time: localIntent === 'RESCHEDULE' ? null : bookingContext.time,
        reason: bookingContext.reason,
        period: bookingContext.period,
        proposedSlots: localIntent === 'RESCHEDULE' ? [] : bookingContext.proposedSlots,
      },
      now,
    });
    decision = autoBookingResult.decision;
    draftReply = autoBookingResult.message;
    if (decision === 'DIRECT_CONFIRMATION') {
      // On ne confirme au patient que si le RDV est réellement enregistré
      shouldAutoSend = autoBookingResult.persisted !== false || !isDbConnected();
      const newId = autoBookingResult.appointment?._id ? String(autoBookingResult.appointment._id) : null;
      if (rescheduleFrom && rescheduleFrom !== newId && autoBookingResult.persisted) {
        const old = await cancelAppointmentFromThread(rescheduleFrom);
        if (old) {
          autoBookingResult.rescheduledFrom = { id: String(old._id), date: old.date, time: old.timeSlot.start };
          draftReply = draftReply.replace(
            'Nous vous confirmons avec plaisir votre rendez-vous',
            `Votre rendez-vous du ${formatDateFr(old.date)} à ${old.timeSlot.start} a bien été annulé et remplacé.\n\nNous vous confirmons avec plaisir votre nouveau rendez-vous`
          );
          decision = 'RESCHEDULED';
        }
      }
      nextBookingContext = {
        reason: autoBookingResult.context?.reason,
        appointmentId: autoBookingResult.appointment?._id ? String(autoBookingResult.appointment._id) : null,
        date: autoBookingResult.date,
        time: autoBookingResult.time,
        awaiting: null,
      };
    } else {
      shouldAutoSend = true;
      nextBookingContext = {
        ...nextBookingContext,
        ...(autoBookingResult.context || {}),
        proposedSlots: autoBookingResult.proposedSlotObjects || [],
        awaiting: 'SLOT',
        // Le RDV d'origine reste valable tant que le nouveau n'est pas confirmé
        appointmentId: bookingContext.appointmentId || null,
        rescheduleFrom,
      };
    }
  } else if (isPractitionerIdentified) {
    const docName = practitioner.name;
    draftReply = aiResult.suggestedReply || `Bonjour ${contact.name || 'M./Mme'},\n\nNous avons bien reçu votre message concernant « ${subject || 'votre demande'} ». Il a été transmis à ${docName} et notre secrétariat vous répondra dans les plus brefs délais.\n\nCordialement,\nLe secrétariat pour ${docName}\nMediLawAI`;
  } else {
    draftReply = aiResult.suggestedReply || CLARIFICATION_TEMPLATE;
  }

  if (intent === 'SPAM') shouldAutoSend = false;

  // ─── Étape 7 : envoi (ou brouillon HITL) ─────────────────────────────────
  let sendResult = { sent: false, reason: autoSendEnabled ? 'NOT_AUTO_SENDABLE' : 'HITL_MODE' };
  if (autoSendEnabled && shouldAutoSend && draftReply) {
    sendResult = await sendGmailMessage({
      to: contact.email,
      subject: buildReplySubject(subject || existingThread?.subject),
      body: draftReply,
      threadId: effectiveThreadId,
      inReplyTo: rfcMessageId,
      references: [existingThread?.references, references].filter(Boolean).join(' ') || null,
    });
  }

  let emailStatus;
  if (isEmergency) emailStatus = 'ESCALATED_EMERGENCY';
  else if (decision === 'NEEDS_CLARIFICATION') emailStatus = 'WAITING_FOR_REPLY';
  else if (sendResult.sent) emailStatus = ['DIRECT_CONFIRMATION', 'RESCHEDULED', 'CANCELLED'].includes(decision) ? 'SENT' : 'WAITING_FOR_REPLY';
  else emailStatus = 'PENDING_VALIDATION';

  // ─── Persistance ─────────────────────────────────────────────────────────
  const emailId = 'em-' + Date.now();
  const practitionerRef = practitioner?._id || practitioner?.id || null;
  const dbPractitionerId = practitionerRef && mongoose.isValidObjectId(String(practitionerRef)) ? practitionerRef : undefined;
  const emailRecord = {
    _id: emailId,
    id: emailId,
    clinicId: tenantId,
    tenantId,
    doctorId: dbPractitionerId || practitionerRef,
    practitionerId: dbPractitionerId || practitionerRef,
    contactId: contact.id || null,
    isRegisteredContact: contact.isRegistered,
    scenario,
    threadId: effectiveThreadId,
    gmailMessageId,
    messageId: rfcMessageId || gmailMessageId || `msg-${Date.now()}@medilawai.com`,
    sender: { name: contact.name, email: contact.email },
    recipient,
    recipients: [recipient],
    subject: subject || 'Sans objet',
    body: body || '(vide)',
    bodyText: body || '',
    bodyHtml: bodyHtml || '',
    attachments: attachments || [],
    detectedLanguage: detectedLang,
    intent: ['APPOINTMENT', 'PRICING', 'EMERGENCY', 'ADMINISTRATIVE', 'SPAM', 'UNCERTAIN', 'CANCEL', 'RESCHEDULE'].includes(intent) ? intent : 'UNCERTAIN',
    confidence: aiResult.confidence,
    status: emailStatus,
    processingStatus: sendResult.sent ? 'SENT' : (isPractitionerIdentified ? 'DRAFT_GENERATED' : 'AWAITING_APPROVAL'),
    draftReply,
    aiDraft: draftReply,
    finalResponse: sendResult.sent ? draftReply : undefined,
    sentAt: sendResult.sent ? new Date() : undefined,
    replyStatus: sendResult.sent ? 'SENT' : (autoSendEnabled && shouldAutoSend ? 'FAILED' : 'DRAFT'),
    replyError: sendResult.sent ? undefined : sendResult.reason,
    replyGmailMessageId: sendResult.messageId,
    bookingDecision: decision,
    appointmentId: autoBookingResult?.persisted ? autoBookingResult.appointment?._id : undefined,
    aiAnalysis: aiResult,
    extractedEntities: {
      requestedDate: autoBookingResult?.date || nextBookingContext.date || undefined,
      requestedTime: autoBookingResult?.time || nextBookingContext.time || undefined,
      specialtyOrService: practitioner?.specialty,
      phone: aiResult.extractedEntities?.phone,
    },
    practitionerIdentificationMethod: matchResult.method,
    clarificationSent: decision === 'NEEDS_CLARIFICATION' && sendResult.sent,
    clarificationMessage: clarificationMessage || undefined,
    receivedAt: new Date(receivedAt),
    processedAt: new Date(),
  };

  const threadState = {
    threadId: effectiveThreadId,
    tenantId,
    practitionerId: dbPractitionerId,
    contactId: contact.id && mongoose.isValidObjectId(contact.id) ? contact.id : undefined,
    contactEmail: contact.email,
    contactName: contact.name,
    isRegistered: contact.isRegistered,
    status: emailStatus,
    subject: existingThread?.subject || emailRecord.subject,
    originalText: (isFollowUp ? `${historyText}\n---\n${combinedText}` : combinedText).slice(-6000),
    bookingContext: nextBookingContext,
    references: [existingThread?.references, rfcMessageId].filter(Boolean).join(' ').split(' ').slice(-10).join(' ') || undefined,
    lastMessageAt: new Date(),
    clarificationSentAt: decision === 'NEEDS_CLARIFICATION' && sendResult.sent ? new Date() : existingThread?.clarificationSentAt,
    clarificationPrompt: clarificationMessage || existingThread?.clarificationPrompt,
  };

  if (isDbConnected()) {
    try {
      const { _id, id, ...dbFields } = emailRecord;
      if (!mongoose.isValidObjectId(String(dbFields.doctorId || ''))) { delete dbFields.doctorId; delete dbFields.practitionerId; }
      if (!mongoose.isValidObjectId(String(dbFields.contactId || ''))) delete dbFields.contactId;
      const dbEmail = await Email.create(dbFields);
      emailRecord._id = dbEmail._id;
      emailRecord.id = String(dbEmail._id);

      if (autoBookingResult?.persisted && autoBookingResult.appointment?._id) {
        await Appointment.updateOne({ _id: autoBookingResult.appointment._id }, { emailReference: dbEmail._id }).catch(() => {});
      }

      await EmailThread.findOneAndUpdate(
        { threadId: effectiveThreadId },
        { $set: threadState, $addToSet: { emails: dbEmail._id } },
        { upsert: true, new: true }
      );

      await AuditLog.create({
        clinicId: emailRecord.clinicId,
        action: 'EMAIL_PROCESSED_CENTRAL_ROUTER',
        resource: 'Email',
        resourceId: String(emailRecord._id),
        details: {
          scenario,
          contactType: contact.type,
          practitioner: practitioner?.name || 'UNASSIGNED',
          method: matchResult.method,
          intent: emailRecord.intent,
          decision,
          status: emailStatus,
          replySent: sendResult.sent,
          followUp: isFollowUp,
        },
      }).catch(() => {});
    } catch (dbErr) {
      console.warn('[CentralRouter] Erreur persistance DB:', dbErr.message);
    }
  }

  fallbackStore.emails.set(String(emailRecord._id), emailRecord);
  fallbackStore.threads.set(effectiveThreadId, { ...threadState, practitioner });

  // ─── Événements n8n (non bloquants) ──────────────────────────────────────
  const n8nPayload = {
    emailId: String(emailRecord._id),
    threadId: effectiveThreadId,
    scenario,
    intent: emailRecord.intent,
    decision,
    status: emailStatus,
    replySent: sendResult.sent,
    patient: { name: contact.name, email: contact.email },
    practitioner: practitioner ? { id: String(practitionerRef), name: practitioner.name, phone: practitioner.phone || null } : null,
    subject: emailRecord.subject,
  };
  notifyN8n(N8N_EVENTS.EMAIL_PROCESSED, n8nPayload);
  if (isEmergency) notifyN8n(N8N_EVENTS.EMERGENCY, { ...n8nPayload, excerpt: body.slice(0, 300) });
  if (['DIRECT_CONFIRMATION', 'RESCHEDULED'].includes(decision) && autoBookingResult?.persisted) {
    notifyN8n(N8N_EVENTS.APPOINTMENT_BOOKED, {
      ...n8nPayload,
      appointmentId: String(autoBookingResult.appointment._id),
      date: autoBookingResult.date,
      time: autoBookingResult.time,
    });
  }

  return {
    success: true,
    scenario,
    scenarioDescription: getScenarioDescription(scenario),
    contact,
    practitioner: practitioner ? { id: practitionerRef, name: practitioner.name, specialty: practitioner.specialty } : null,
    email: emailRecord,
    decision,
    isEmergency,
    isFollowUp,
    needsClarification: !isPractitionerIdentified && decision === 'NEEDS_CLARIFICATION',
    autoBooking: autoBookingResult,
    reply: { sent: sendResult.sent, reason: sendResult.reason || null, gmailMessageId: sendResult.messageId || null },
  };
}

function getScenarioDescription(s) {
  switch (s) {
    case 1: return 'Scénario 1 : Patient inscrit + Médecin identifié -> Associé au profil et au praticien';
    case 2: return 'Scénario 2 : Patient non inscrit (contact externe) + Médecin identifié -> Fiche contact créée et transmis';
    case 3: return 'Scénario 3 : Patient inscrit + Médecin inconnu -> Demande de clarification envoyée';
    case 4: return 'Scénario 4 : Patient non inscrit + Médecin inconnu -> Demande de clarification sans imposer de compte';
    default: return 'Traitement standard';
  }
}
