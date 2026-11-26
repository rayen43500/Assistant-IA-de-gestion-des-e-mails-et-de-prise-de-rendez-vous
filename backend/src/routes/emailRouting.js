import express from 'express';
import Integration from '../models/Integration.js';
import Doctor from '../models/Doctor.js';
import Email from '../models/Email.js';
import EmailDraft from '../models/EmailDraft.js';
import Conversation from '../models/Conversation.js';
import AuditLog from '../models/AuditLog.js';
import { calculateDoctorAvailability } from '../services/availabilityService.js';
import { queryAiService } from '../services/aiClient.js';
import { getPractitionerScope } from '../middleware/practitionerScope.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendValidatedReply } from './emails.js';

const router = express.Router();

/**
 * POST /api/webhooks/google/gmail
 * Endpoint de notification Push Google Pub/Sub ou ingestion automatisée par boîte aux lettres.
 * Route automatiquement le message vers le bon médecin selon la boîte réceptrice (recipient).
 */
router.post('/google/gmail', async (req, res) => {
  try {
    let emailPayload = req.body;

    // Décodage du message Google Cloud Pub/Sub si présent
    if (req.body.message && req.body.message.data) {
      try {
        const decoded = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        emailPayload = JSON.parse(decoded);
      } catch (decodeErr) {
        console.warn('[GmailWebhook] Message Pub/Sub non JSON, utilisation du corps direct.');
      }
    }

    const recipientEmail = (emailPayload.recipient || emailPayload.to || emailPayload.emailAddress || '').toLowerCase().trim();
    const sender = emailPayload.sender || { name: emailPayload.fromName || 'Expéditeur Inconnu', email: emailPayload.from || '' };
    const subject = emailPayload.subject || 'Sans objet';
    const body = emailPayload.body || emailPayload.snippet || '';
    const providerMessageId = emailPayload.id || emailPayload.messageId || `msg_${Date.now()}`;
    const threadId = emailPayload.threadId || providerMessageId;

    // 1. RÈGLE CRITIQUE : Identifier l'intégration Google correspondante
    const integration = await Integration.findOne({
      provider: 'GOOGLE',
      providerAccountEmail: recipientEmail,
      connectionStatus: 'CONNECTED',
    });

    if (!integration) {
      console.warn(`[EmailRouting] Boîte réceptrice non identifiée (${recipientEmail}). Message placé dans la file non résolue.`);
      
      // Sauvegarder dans la file non résolue sans deviner le praticien
      const unresolvedEmail = await Email.create({
        clinicId: emailPayload.clinicId || (await Doctor.findOne())?.tenantId,
        sender,
        recipient: recipientEmail,
        subject,
        body,
        intent: 'UNCERTAIN',
        processingStatus: 'UNRESOLVED_MAILBOX',
        providerMessageId,
        threadId,
      });

      return res.status(202).json({
        routed: false,
        status: 'UNRESOLVED_MAILBOX',
        message: 'Boîte non liée à un médecin. Message mis en quarantaine pour supervision admin.',
        emailId: unresolvedEmail._id,
      });
    }

    const { tenantId, doctorId } = integration;

    // 2. Vérification anti-doublon d'ingestion (idempotence)
    const existing = await Email.findOne({ integrationId: integration._id, providerMessageId });
    if (existing) {
      return res.json({ routed: true, duplicate: true, emailId: existing._id });
    }

    // 3. Filtrer les auto-réponses / e-mails émis par le médecin lui-même
    if (sender.email && sender.email.toLowerCase() === recipientEmail) {
      return res.json({ routed: false, ignored: 'SELF_GENERATED_EMAIL' });
    }

    // 4. Analyser l'e-mail via le moteur IA
    let aiAnalysis = {
      intent: 'APPOINTMENT',
      confidence: 0.95,
      suggestedReply: '',
      extractedEntities: {},
      isEmergency: false,
    };

    try {
      const aiResult = await queryAiService({ subject, body, clinicType: 'MEDICAL' });
      if (aiResult) {
        aiAnalysis = {
          intent: aiResult.intent || 'APPOINTMENT',
          confidence: aiResult.confidence || 0.9,
          suggestedReply: aiResult.suggestedReply || '',
          extractedEntities: aiResult.extractedEntities || {},
          isEmergency: aiResult.isEmergency || false,
        };
      }
    } catch (aiErr) {
      console.warn('[EmailRouting] Analyse IA fallback locale :', aiErr.message);
    }

    // 5. Calculer la vraie disponibilité du médecin cible (JAMAIS inventée par l'IA)
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const availability = await calculateDoctorAvailability({
      tenantId,
      doctorId,
      date: aiAnalysis.extractedEntities?.requestedDate || tomorrowStr,
    });

    const realAvailableSlots = (availability.slots || []).filter(s => s.available).slice(0, 3);
    const slotsProposalText = realAvailableSlots.length > 0
      ? realAvailableSlots.map(s => `• ${availability.dayName} de ${s.start} à ${s.end}`).join('\n')
      : '• Aucun créneau libre à cette date exacte, nous vous proposons le jour ouvrable suivant.';

    // 6. Préparer le brouillon de réponse basé UNIQUEMENT sur des créneaux validés
    let finalDraft = `Bonjour,\n\nNous avons bien reçu votre demande concernant "${subject}".\n\nVoici les créneaux disponibles pour votre consultation :\n${slotsProposalText}\n\nMerci de nous indiquer le créneau qui vous convient le mieux afin de valider votre réservation.\n\nBien cordialement,\nLe secrétariat intelligent du Cabinet`;

    if (aiAnalysis.isEmergency) {
      finalDraft = `🚨 ALERTE URGENCE VITALE : Vos symptômes requièrent une prise en charge médicale hospitalière immédiate sans délai. Veuillez contacter sans attendre le SAMU (190) ou la Protection Civile (198), ou vous présenter aux urgences les plus proches.`;
    }

    // 7. Enregistrer l'e-mail avec son tenantId et doctorId vérifiés
    const savedEmail = await Email.create({
      clinicId: tenantId,
      tenantId,
      doctorId,
      integrationId: integration._id,
      recipient: recipientEmail,
      sender,
      subject,
      body,
      intent: aiAnalysis.isEmergency ? 'EMERGENCY' : aiAnalysis.intent,
      confidence: aiAnalysis.confidence,
      status: aiAnalysis.isEmergency ? 'ESCALATED_EMERGENCY' : 'PENDING_VALIDATION',
      processingStatus: 'DRAFT_GENERATED',
      providerMessageId,
      threadId,
      draftReply: finalDraft,
      extractedEntities: aiAnalysis.extractedEntities,
    });

    // 8. Créer l'entité EmailDraft pour revue et approbation humaine
    await EmailDraft.create({
      tenantId,
      doctorId,
      emailId: savedEmail._id,
      generatedContent: finalDraft,
      proposedSlots: realAvailableSlots.map(s => ({ date: availability.date, start: s.start, end: s.end })),
      approvalStatus: 'PENDING',
    });

    // 9. Créer ou mettre à jour la conversation
    await Conversation.findOneAndUpdate(
      { tenantId, doctorId, threadId },
      {
        channel: 'EMAIL',
        currentIntent: aiAnalysis.intent,
        currentState: 'SLOT_PROPOSED',
        proposedSlots: realAvailableSlots.map(s => ({ date: availability.date, start: s.start, end: s.end })),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      routed: true,
      doctorId,
      recipient: recipientEmail,
      emailId: savedEmail._id,
      intent: aiAnalysis.intent,
      proposedSlotsCount: realAvailableSlots.length,
    });
  } catch (error) {
    console.error('[EmailRouting] Erreur lors du routage d’e-mail:', error);
    res.status(500).json({ message: 'Erreur interne de routage e-mail', error: error.message });
  }
});

/**
 * POST /api/emails/:id/approve
 * Approbation d'un brouillon par le praticien avec envoi effectif
 */
router.post('/:id/approve', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, clinicId: req.clinicId, ...(await getPractitionerScope(req)) });
    if (!email) {
      return res.status(404).json({ message: 'E-mail introuvable.' });
    }

    const { editedReply } = req.body;
    const finalContent = editedReply || email.draftReply;

    const sendResult = await sendValidatedReply(email, finalContent);
    if (/^[0-9a-f]{24}$/i.test(String(req.user._id))) email.validatedBy = req.user._id;
    email.processedAt = new Date();
    await email.save();

    if (!sendResult.sent) {
      return res.status(502).json({
        success: false,
        message: `Brouillon approuvé mais non envoyé (${sendResult.reason}). Connectez la boîte Gmail centrale.`,
        email,
      });
    }

    await EmailDraft.findOneAndUpdate(
      { emailId: email._id },
      { approvalStatus: 'APPROVED', sentAt: new Date(), deliveryStatus: 'SENT' }
    ).catch(() => {});

    await AuditLog.create({
      clinicId: req.clinicId,
      userId: req.user._id,
      action: 'APPROVE_AI_DRAFT',
      resource: 'Email',
      resourceId: email._id,
      details: { recipient: email.sender.email, subject: email.subject },
    });

    res.json({
      success: true,
      message: 'Brouillon approuvé et transmis avec succès.',
      email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’approbation du brouillon', error: error.message });
  }
});

export default router;
