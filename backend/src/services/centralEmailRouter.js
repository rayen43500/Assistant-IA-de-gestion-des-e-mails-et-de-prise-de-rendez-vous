import mongoose from 'mongoose';
import Contact from '../models/Contact.js';
import Email from '../models/Email.js';
import EmailThread from '../models/EmailThread.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { queryAiService } from './aiClient.js';
import { evaluateBookingRequest } from './smartBookingDecisionService.js';

/**
 * MediLawAI — Moteur Centralisé de Routage et Traitement des E-mails
 * Implémente rigoureusement l'architecture centralisée :
 * - 1 seule boîte de réception (ex: contact@medilawai.com)
 * - 1 seule boîte d'envoi pour toutes les réponses
 * - Aucun compte obligatoire pour le patient
 * - Aucun Gmail personnel requis pour les praticiens
 * - Gestion des 4 scénarios fondamentaux
 */

// Message type pour praticien non référencé sur MediLawAI
export const UNREGISTERED_PRACTITIONER_TEMPLATE = (name) => `Bonjour,

Merci d'avoir contacté MediLawAI.

Le praticien ou professionnel que vous recherchez (${name || 'demandé'}) ne figure pas actuellement dans l'annuaire de notre cabinet / plateforme.

Si vous souhaitez être orienté(e) vers un autre praticien de notre équipe ou obtenir un accompagnement, vous pouvez répondre directement à cet e-mail ou joindre notre secrétariat d'accueil à contact@medilawai.com.

Vous n'avez pas besoin de créer un compte MediLawAI pour échanger avec nous.

Cordialement,
L'équipe MediLawAI`;

/**
 * Détection de langue robuste (Français, Arabe, Anglais)
 */
export function detectLanguage(text = '') {
  if (!text) return 'FR';
  // Détection arabe (caractères arabes Unicode)
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'AR';
  }
  const clean = text.toLowerCase();
  const englishWords = ['appointment', 'please', 'schedule', 'doctor', 'cancel', 'urgent', 'available', 'thank you', 'hello', 'pain', 'consultation'];
  const frenchWords = ['bonjour', 'rendez-vous', 'consultation', 'docteur', 'urgent', 'merci', 'souhaite', 'créneau', 'cabinet'];

  let enScore = 0;
  let frScore = 0;

  for (const w of englishWords) {
    if (clean.includes(w)) enScore++;
  }
  for (const w of frenchWords) {
    if (clean.includes(w)) frScore++;
  }

  if (enScore > frScore && enScore >= 2) return 'EN';
  return 'FR';
}
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

// In-memory fallback si MongoDB n'est pas connecté
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
      keywords: ['rayen', 'cardiologue', 'cardiologie', 'coeur', 'palpitation', 'ben salem']
    },
    {
      _id: 'doc-youssef',
      id: 'doc-youssef',
      name: 'Dr. Youssef Ben Salem',
      professionalEmail: 'youssef@medilawai.com',
      specialty: 'Médecine Générale',
      keywords: ['youssef', 'generaliste', 'medecine generale', 'docteur youssef']
    }
  ]
};

/**
 * Étape 2 — Identification du patient / correspondant
 * Recherche dans MongoDB ou mémoire si le correspondant est inscrit ou externe.
 */
export async function identifyContact(senderEmail, senderName = '') {
  const cleanEmail = (senderEmail || '').toLowerCase().trim();
  let contact = null;
  let isRegistered = false;

  if (mongoose.connection.readyState === 1) {
    try {
      // 1. Chercher si un utilisateur ou patient officiel existe
      const user = await User.findOne({ email: cleanEmail });
      const patient = await Patient.findOne({ email: cleanEmail });

      if (user || patient) {
        isRegistered = true;
      }

      // 2. Chercher ou créer dans la collection Contacts
      contact = await Contact.findOne({ email: cleanEmail });
      if (!contact) {
        contact = await Contact.create({
          email: cleanEmail,
          name: senderName || (patient?.name || user?.name || cleanEmail.split('@')[0]),
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
          await contact.save();
        }
        contact.lastContactAt = new Date();
        await contact.save();
      }

      return {
        id: String(contact._id),
        email: contact.email,
        name: contact.name,
        type: contact.type,
        isRegistered: contact.isRegistered,
      };
    } catch (err) {
      console.warn('[CentralRouter] Erreur DB identifyContact, fallback en mémoire:', err.message);
    }
  }

  // Fallback mémoire
  if (fallbackStore.contacts.has(cleanEmail)) {
    const existing = fallbackStore.contacts.get(cleanEmail);
    existing.lastContactAt = new Date();
    return existing;
  }

  const newContact = {
    id: 'contact-' + Date.now(),
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

/**
 * Étape 3 — Identification du praticien
 * Analyse ordonnée :
 * 1. Alias de destination (ex: dr.rayen@medilawai.com)
 * 2. Lien personnalisé (ex: medilawai.com/rdv/rayen)
 * 3. Nom du médecin ou avocat mentionné dans le sujet ou le corps
 * 4. Nom du cabinet
 * 5. Spécialité ou informations métier
 */
export async function identifyPractitioner({ recipient, subject = '', body = '' }) {
  const fullText = `${subject} ${body}`.toLowerCase();
  const recipientClean = (recipient || '').toLowerCase().trim();

  let doctors = [];
  if (mongoose.connection.readyState === 1) {
    try {
      doctors = await Doctor.find({ status: 'ACTIVE' });
    } catch {}
  }
  if (!doctors || doctors.length === 0) {
    doctors = fallbackStore.doctors;
  }

  // 1. Alias destinataire (receptionAliases configurés ou email professionnel)
  for (const doc of doctors) {
    const docEmail = (doc.professionalEmail || '').toLowerCase();
    const docNameSlug = (doc.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const aliases = (doc.receptionAliases || []).map(a => a.toLowerCase().trim());

    if (recipientClean && (
      recipientClean === docEmail ||
      aliases.includes(recipientClean) ||
      recipientClean.includes(docNameSlug)
    )) {
      return {
        matched: true,
        practitioner: doc,
        method: 'RECIPIENT_ALIAS',
        confidence: 0.99,
      };
    }
  }

  // 2. Lien personnalisé (ex: /rdv/doc-rayen ou publicContactId)
  for (const doc of doctors) {
    const docId = String(doc._id || doc.id);
    const docSlug = (doc.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const publicId = (doc.publicContactId || '').toLowerCase();

    if (
      (publicId && fullText.includes(publicId)) ||
      fullText.includes(`medilawai.com/rdv/${docSlug}`) ||
      fullText.includes(`medilawai.com/rdv/${docId}`)
    ) {
      return {
        matched: true,
        practitioner: doc,
        method: 'PERSONAL_LINK',
        confidence: 0.98,
      };
    }
  }

  // 3. Nom du médecin ou avocat mentionné dans le sujet ou le corps
  const matches = [];
  for (const doc of doctors) {
    const docName = (doc.name || '').toLowerCase();
    // Ex: "Dr. Rayen B.", "Rayen", "Ben Salem"
    const nameParts = docName.split(/\s+/).filter(p => p.length > 2 && !['dr', 'docteur', 'dr.', 'me', 'maitre'].includes(p));
    const matchedParts = nameParts.filter(p => fullText.includes(p));

    if (matchedParts.length > 0) {
      matches.push({ doc, score: matchedParts.length, method: 'NAME_IN_BODY' });
    }
  }

  if (matches.length === 1) {
    return {
      matched: true,
      practitioner: matches[0].doc,
      method: 'NAME_IN_BODY',
      confidence: 0.92,
    };
  }

  // 4. & 5. Spécialité ou nom de cabinet
  if (matches.length === 0) {
    for (const doc of doctors) {
      const specialty = (doc.specialty || '').toLowerCase();
      const keywords = doc.keywords || [specialty];
      const hasKeyword = keywords.some(k => fullText.includes(k.toLowerCase()));

      if (hasKeyword || (specialty && fullText.includes(specialty))) {
        matches.push({ doc, score: 1, method: 'SPECIALTY_MATCH' });
      }
    }

    if (matches.length === 1) {
      return {
        matched: true,
        practitioner: matches[0].doc,
        method: 'SPECIALTY_MATCH',
        confidence: 0.85,
      };
    }
  }

  // B. Plusieurs praticiens possibles ou C. Aucun praticien identifié
  // Détection si un praticien particulier a été nommé mais n'existe pas sur la plateforme
  const doctorMentionRegex = /(?:dr\.?|docteur|ma[iî]tre|me)\s+([a-zA-ZÀ-ÿ-]+)/i;
  const mentionMatch = fullText.match(doctorMentionRegex);
  const mentionedNonExistent = matches.length === 0 && mentionMatch && mentionMatch[1] && mentionMatch[1].length > 2;

  return {
    matched: false,
    practitioner: null,
    ambiguous: matches.length > 1,
    candidateCount: matches.length,
    unregisteredPractitionerMentioned: Boolean(mentionedNonExistent),
    mentionedName: mentionedNonExistent ? mentionMatch[1] : null,
    method: 'NONE_UNASSIGNED',
    confidence: 0.0,
  };
}

/**
 * Pipeline principal de traitement de l'e-mail entrant
 * Couvre les 4 scénarios, de la réception à la préparation HITL.
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
  receivedAt = new Date(),
}) {
  const stableThreadId = threadId || gmailMessageId || `thread-${Date.now()}`;

  // ─── Étape 2 : Identification du Contact (Inscrit ou Externe) ────────────
  const contact = await identifyContact(senderEmail, senderName);

  // ─── Étape 8 : Vérifier si c'est une réponse à une demande de clarification existante
  let existingThread = null;
  if (mongoose.connection.readyState === 1) {
    try {
      existingThread = await EmailThread.findOne({ threadId: stableThreadId });
    } catch {}
  } else {
    existingThread = fallbackStore.threads.get(stableThreadId);
  }

  // Si le fil était en attente de précision (Scénario 3 ou 4 en reprise)
  const isReplyToClarification = existingThread && (
    existingThread.status === 'WAITING_FOR_REPLY' ||
    existingThread.status === 'NEEDS_CLARIFICATION'
  );

  // En cas de réponse à une clarification, on combine le contexte historique du fil
  const combinedContextText = isReplyToClarification ? `${existingThread.subject || ''} ${body}` : body;

  // ─── Étape 3 : Identification du Praticien ───────────────────────────────
  const matchResult = await identifyPractitioner({ recipient, subject, body: combinedContextText });
  const practitioner = matchResult.practitioner;
  const isPractitionerIdentified = matchResult.matched && practitioner;

  // ─── Détermination du Scénario ───────────────────────────────────────────
  let scenario = 1;
  let emailStatus = 'RECEIVED';

  if (contact.isRegistered && isPractitionerIdentified) {
    // Scénario 1 : Patient inscrit + Praticien identifié
    scenario = 1;
    emailStatus = 'PRACTITIONER_IDENTIFIED';
  } else if (!contact.isRegistered && isPractitionerIdentified) {
    // Scénario 2 : Patient non inscrit (externe) + Praticien identifié
    scenario = 2;
    emailStatus = 'PRACTITIONER_IDENTIFIED';
  } else if (contact.isRegistered && !isPractitionerIdentified) {
    // Scénario 3 : Patient inscrit + Praticien inconnu
    scenario = 3;
    emailStatus = 'NEEDS_CLARIFICATION';
  } else {
    // Scénario 4 : Patient non inscrit + Praticien inconnu
    scenario = 4;
    emailStatus = 'NEEDS_CLARIFICATION';
  }

  // Détection de langue automatique (FR / AR / EN)
  const detectedLang = detectLanguage(`${subject} ${body}`);

  // ─── Étape 4 : Gestion du Praticien Inconnu ou Non Référencé ─────────────
  let clarificationMessage = null;
  if (!isPractitionerIdentified) {
    if (matchResult.unregisteredPractitionerMentioned) {
      clarificationMessage = UNREGISTERED_PRACTITIONER_TEMPLATE(matchResult.mentionedName);
    } else {
      clarificationMessage = CLARIFICATION_TEMPLATE;
    }
  }

  // ─── Étape 5 : Analyse IA (FastAPI ou fallback local) ────────────────────
  let aiResult = {
    intent: 'APPOINTMENT',
    confidence: 0.90,
    suggestedReply: '',
    extractedEntities: {},
  };

  try {
    const res = await queryAiService({
      subject,
      body,
      language: detectedLang,
      clinicType: practitioner?.specialty ? 'MEDICAL' : 'GENERAL',
    });
    if (res) {
      aiResult = {
        intent: res.intent || (body.toLowerCase().includes('urgent') ? 'EMERGENCY' : 'APPOINTMENT'),
        confidence: res.confidence || 0.88,
        suggestedReply: res.suggestedReply || '',
        extractedEntities: res.extractedEntities || {},
      };
    }
  } catch (aiErr) {
    console.warn('[CentralRouter] Service IA indisponible, utilisation du fallback interne.');
  }

  // Évaluation d'urgence prioritaire
  const isEmergency = aiResult.intent === 'EMERGENCY' || /urgent|urgence|samu|douleur aigue|palpitation violente/i.test(`${subject} ${body}`);
  if (isEmergency) {
    emailStatus = 'ESCALATED_EMERGENCY';
  } else if (isPractitionerIdentified) {
    emailStatus = 'PENDING_VALIDATION';
  } else {
    emailStatus = 'WAITING_FOR_REPLY';
  }

  // ─── Étape 6 : Génération du Brouillon de Réponse HITL & Décision Calendrier Interne
  let draftReply = '';
  let autoBookingResult = null;

  if (isEmergency) {
    draftReply = `URGENT : Si votre état présente un risque vital immédiat, contactez sans attendre le SAMU au 15 (ou le 190). Le praticien et l'équipe d'astreinte ont été immédiatement alertés de votre message.`;
  } else if (!isPractitionerIdentified) {
    draftReply = clarificationMessage;
  } else if (aiResult.intent === 'APPOINTMENT') {
    // Évaluation calendrier interne sans Google Calendar obligatoire
    autoBookingResult = await evaluateBookingRequest({
      messageText: `${subject} ${body}`,
      patientInfo: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        source: 'EMAIL_AI',
      },
      practitioner,
      tenantId: practitioner.tenantId || '66f1234567890abcdef12345',
    });

    draftReply = autoBookingResult.message;
  } else {
    const docName = practitioner.name || 'le Dr. Rayen B.';
    draftReply = aiResult.suggestedReply || `Bonjour ${contact.name || 'M./Mme'},\n\n${docName} a bien pris connaissance de votre message concernant "${subject}".\nNous vous confirmons la prise en charge de votre demande et reviendrons vers vous avec les créneaux disponibles dans les plus brefs délais.\n\nCordialement,\nLe secrétariat médical pour ${docName}\nMediLawAI Platform`;
  }

  // ─── Création et Persistance de l'E-mail ─────────────────────────────────
  const emailId = 'em-' + Date.now();
  const emailRecord = {
    _id: emailId,
    id: emailId,
    clinicId: practitioner?.tenantId || '66f1234567890abcdef12345',
    tenantId: practitioner?.tenantId || '66f1234567890abcdef12345',
    doctorId: practitioner?._id || practitioner?.id || null,
    practitionerId: practitioner?._id || practitioner?.id || null,
    contactId: contact.id || null,
    isRegisteredContact: contact.isRegistered,
    scenario,
    threadId: stableThreadId,
    gmailMessageId,
    messageId: gmailMessageId || `msg-${Date.now()}@medilawai.com`,
    sender: {
      name: contact.name,
      email: contact.email,
    },
    recipient,
    recipients: [recipient],
    subject: subject || 'Sans objet',
    body: body || '',
    bodyText: body || '',
    bodyHtml: bodyHtml || '',
    attachments: attachments || [],
    detectedLanguage: detectedLang,
    intent: isEmergency ? 'EMERGENCY' : aiResult.intent,
    confidence: aiResult.confidence,
    status: emailStatus,
    processingStatus: isPractitionerIdentified ? 'DRAFT_GENERATED' : 'UNRESOLVED_MAILBOX',
    draftReply,
    aiDraft: draftReply,
    aiAnalysis: aiResult,
    extractedEntities: aiResult.extractedEntities,
    practitionerIdentificationMethod: matchResult.method,
    clarificationSent: !isPractitionerIdentified,
    clarificationMessage: clarificationMessage || undefined,
    receivedAt: new Date(receivedAt),
    processedAt: new Date(),
  };

  // Sauvegarde MongoDB si disponible
  if (mongoose.connection.readyState === 1) {
    try {
      const dbEmail = await Email.create(emailRecord);
      if (dbEmail) emailRecord._id = dbEmail._id;

      // Étape 8 : Mettre à jour EmailThread
      await EmailThread.findOneAndUpdate(
        { threadId: stableThreadId },
        {
          threadId: stableThreadId,
          tenantId: emailRecord.tenantId,
          practitionerId: emailRecord.doctorId,
          contactId: contact.id,
          contactEmail: contact.email,
          contactName: contact.name,
          isRegistered: contact.isRegistered,
          status: emailStatus,
          subject: emailRecord.subject,
          $addToSet: { emails: emailRecord._id },
          lastMessageAt: new Date(),
          clarificationSentAt: !isPractitionerIdentified ? new Date() : undefined,
          clarificationPrompt: clarificationMessage || undefined,
        },
        { upsert: true, new: true }
      );

      // Audit Log
      await AuditLog.create({
        clinicId: emailRecord.clinicId,
        action: 'EMAIL_PROCESSED_CENTRAL_ROUTER',
        resource: 'Email',
        resourceId: String(emailRecord._id),
        details: {
          scenario,
          contactType: contact.type,
          isRegistered: contact.isRegistered,
          practitioner: practitioner?.name || 'UNASSIGNED',
          method: matchResult.method,
          intent: emailRecord.intent,
          status: emailStatus,
        },
      });
    } catch (dbErr) {
      console.warn('[CentralRouter] Erreur persistance DB, conservation en mémoire:', dbErr.message);
    }
  }

  // Stockage mémoire
  fallbackStore.emails.set(String(emailRecord._id), emailRecord);
  fallbackStore.threads.set(stableThreadId, {
    threadId: stableThreadId,
    status: emailStatus,
    scenario,
    contact,
    practitioner,
    lastEmailId: emailRecord._id,
  });

  return {
    success: true,
    scenario,
    scenarioDescription: getScenarioDescription(scenario),
    contact,
    practitioner: practitioner ? { id: practitioner._id || practitioner.id, name: practitioner.name, specialty: practitioner.specialty } : null,
    email: emailRecord,
    isEmergency,
    needsClarification: !isPractitionerIdentified,
    autoBooking: autoBookingResult,
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
