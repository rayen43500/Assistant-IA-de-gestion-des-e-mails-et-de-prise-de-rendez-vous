import express from 'express';
import Email from '../models/Email.js';
import Clinic from '../models/Clinic.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { classifyEmailContent } from '../services/aiClient.js';

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

// POST /api/emails/ingest - Ingestion d'un e-mail (appelé par n8n ou simulation)
router.post('/ingest', async (req, res) => {
  try {
    const { sender, subject, body, clinicId } = req.body;

    const targetClinicId = clinicId || req.body.clinic_id;
    let clinic = null;
    
    if (targetClinicId && targetClinicId.match(/^[0-9a-fA-F]{24}$/)) {
      clinic = await Clinic.findById(targetClinicId);
    }
    
    if (!clinic) {
      clinic = await Clinic.findOne();
    }

    if (!clinic) {
      return res.status(404).json({ message: 'Cabinet introuvable' });
    }

    // Appel du microservice IA (FastAPI) pour classifier
    const aiResult = await classifyEmailContent({
      subject,
      body,
      clinicType: clinic.type,
    });

    const isEmergency = aiResult.intent === 'EMERGENCY';
    const confidence = aiResult.confidence || 0.5;
    const threshold = clinic.aiSettings?.confidenceThreshold || 0.85;
    const autonomy = clinic.aiSettings?.autonomyLevel || 'HUMAN_IN_THE_LOOP';

    let initialStatus = 'PENDING_VALIDATION';
    if (isEmergency) {
      initialStatus = 'ESCALATED_EMERGENCY';
    } else if (autonomy === 'FULL_AUTONOMOUS' && confidence >= threshold && aiResult.intent !== 'SPAM') {
      initialStatus = 'AUTO_PROCESSED';
    }

    const newEmail = await Email.create({
      clinicId: clinic._id,
      sender: {
        name: sender?.name || 'Patient Inconnu',
        email: sender?.email || 'patient@example.com',
      },
      subject,
      body,
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      draftReply: aiResult.suggestedReply || '',
      extractedEntities: aiResult.extractedEntities || {},
      status: initialStatus,
      processedAt: new Date(),
    });

    // Journalisation d'audit
    await AuditLog.create({
      clinicId: clinic._id,
      action: 'EMAIL_INGESTED_AND_CLASSIFIED',
      resource: 'Email',
      resourceId: newEmail._id.toString(),
      details: {
        intent: aiResult.intent,
        confidence: aiResult.confidence,
        status: initialStatus,
      },
    });

    res.status(201).json(newEmail);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’ingestion de l’e-mail', error: error.message });
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
