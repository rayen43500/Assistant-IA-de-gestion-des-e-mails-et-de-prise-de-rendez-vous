import express from 'express';
import Email from '../models/Email.js';
import Clinic from '../models/Clinic.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { classifyEmailContent } from '../services/aiClient.js';
import { processIncomingEmail } from '../services/centralEmailRouter.js';
import EmailThread from '../models/EmailThread.js';
import Contact from '../models/Contact.js';

const router = express.Router();

// GET /api/emails - Liste des e-mails du cabinet
router.get('/', protect, async (req, res) => {
  try {
    const { status, intent, search } = req.query;
    const query = { clinicId: req.clinicId };

    if (status) query.status = status;
    if (intent) query.intent = intent;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { 'sender.email': { $regex: search, $options: 'i' } },
        { 'sender.name': { $regex: search, $options: 'i' } },
      ];
    }

    const emails = await Email.find(query).sort({ receivedAt: -1 }).limit(100);
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des e-mails', error: error.message });
  }
});

// POST /api/emails/ingest - Ingestion d'un e-mail via l'architecture centralisée
router.post('/ingest', async (req, res) => {
  try {
    const {
      sender,
      senderName,
      senderEmail,
      from,
      recipient,
      to,
      subject,
      body,
      threadId,
      gmailMessageId,
      receivedAt
    } = req.body;

    const emailOfSender = senderEmail || sender?.email || from || 'patient@example.com';
    const nameOfSender = senderName || sender?.name || '';
    const targetRecipient = recipient || to || 'contact@medilawai.com';

    // Exécution du moteur centralisé MediLawAI (8 étapes et 4 scénarios)
    const result = await processIncomingEmail({
      senderEmail: emailOfSender,
      senderName: nameOfSender,
      recipient: targetRecipient,
      subject: subject || 'Sans objet',
      body: body || '',
      threadId: threadId || null,
      gmailMessageId: gmailMessageId || null,
      receivedAt: receivedAt || new Date(),
    });

    return res.status(201).json(result.email || result);
  } catch (error) {
    console.error('[Emails Ingest Error]:', error);
    res.status(500).json({ message: 'Erreur lors de l’ingestion de l’e-mail', error: error.message });
  }
});

// POST /api/emails/simulate-scenario - Test instantané des 4 scénarios MediLawAI
router.post('/simulate-scenario', async (req, res) => {
  try {
    const { scenarioNumber = 1 } = req.body;
    let payload = {};

    switch (Number(scenarioNumber)) {
      case 1:
        // Scénario 1 : Patient inscrit + Praticien identifié
        payload = {
          senderEmail: 'ahmed.benali@gmail.com',
          senderName: 'Ahmed Ben Ali',
          recipient: 'contact@medilawai.com',
          subject: 'Demande de consultation cardiologie – Dr. Rayen',
          body: 'Bonjour Docteur Rayen B., je ressens des essoufflements à l’effort et souhaiterais une consultation de suivi ce vendredi si possible.',
        };
        break;
      case 2:
        // Scénario 2 : Patient non inscrit (externe) + Praticien identifié
        payload = {
          senderEmail: 'nouveau.patient.' + Date.now() + '@yahoo.fr',
          senderName: 'Salma Mansour',
          recipient: 'contact@medilawai.com',
          subject: 'Première consultation avec Dr. Rayen',
          body: 'Bonjour, on m’a vivement recommandé le Dr. Rayen B. pour un contrôle cardiologique. Avez-vous un créneau lundi prochain ?',
        };
        break;
      case 3:
        // Scénario 3 : Patient inscrit + Praticien inconnu (demande de clarification)
        payload = {
          senderEmail: 'ahmed.benali@gmail.com',
          senderName: 'Ahmed Ben Ali',
          recipient: 'contact@medilawai.com',
          subject: 'Demande de rendez-vous médical',
          body: 'Bonjour, je voudrais prendre un rendez-vous pour une consultation la semaine prochaine s’il vous plaît.',
        };
        break;
      case 4:
      default:
        // Scénario 4 : Patient non inscrit + Praticien inconnu (demande de clarification sans inscription)
        payload = {
          senderEmail: 'visiteur.anonyme.' + Date.now() + '@gmail.com',
          senderName: 'Visiteur Inconnu',
          recipient: 'contact@medilawai.com',
          subject: 'Besoin d’un rendez-vous',
          body: 'Bonjour, j’ai besoin d’une consultation rapidement mais je ne connais pas les spécialistes disponibles dans votre cabinet.',
        };
        break;
    }

    const result = await processIncomingEmail(payload);
    return res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la simulation du scénario', error: error.message });
  }
});

// GET /api/emails/threads/:threadId - Récupère l'historique complet d'une conversation
router.get('/threads/:threadId', async (req, res) => {
  try {
    const thread = await EmailThread.findOne({ threadId: req.params.threadId }).populate('emails');
    if (!thread) {
      return res.status(404).json({ message: 'Fil de discussion non trouvé' });
    }
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération thread', error: error.message });
  }
});

// PUT /api/emails/:id/validate - Validation / modification en 1 clic par le secrétaire
router.put('/:id/validate', protect, async (req, res) => {
  try {
    const { draftReply, intent, sendNow } = req.body;
    const email = await Email.findOne({ _id: req.params.id, clinicId: req.clinicId });

    if (!email) {
      return res.status(404).json({ message: 'E-mail non trouvé' });
    }

    if (draftReply) email.draftReply = draftReply;
    if (intent) email.intent = intent;

    email.status = sendNow ? 'VALIDATED_AND_SENT' : 'MANUAL_OVERRIDE';
    email.validatedBy = req.user._id;
    await email.save();

    await AuditLog.create({
      clinicId: req.clinicId,
      userId: req.user._id,
      action: 'EMAIL_HUMAN_VALIDATION',
      resource: 'Email',
      resourceId: email._id.toString(),
      details: {
        newStatus: email.status,
        sent: sendNow,
      },
    });

    res.json({ message: 'E-mail validé avec succès', email });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la validation', error: error.message });
  }
});

// GET /api/emails/stats - Statistiques pour le Dashboard
router.get('/stats', protect, async (req, res) => {
  try {
    const clinicId = req.clinicId;
    const total = await Email.countDocuments({ clinicId });
    const pendingValidation = await Email.countDocuments({ clinicId, status: 'PENDING_VALIDATION' });
    const emergencies = await Email.countDocuments({ clinicId, intent: 'EMERGENCY' });
    const appointments = await Email.countDocuments({ clinicId, intent: 'APPOINTMENT' });
    const autoProcessed = await Email.countDocuments({ clinicId, status: 'AUTO_PROCESSED' });

    res.json({
      total,
      pendingValidation,
      emergencies,
      appointments,
      autoProcessed,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques', error: error.message });
  }
});

export default router;
