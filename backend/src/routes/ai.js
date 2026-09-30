import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkHealthAI, classifyEmailContent } from '../services/aiClient.js';
import Email from '../models/Email.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// GET /api/ai/health - Statut du microservice IA
router.get('/health', async (req, res) => {
  const status = await checkHealthAI();
  res.json(status);
});

// POST /api/ai/test-classify - Test direct de la classification
router.post('/test-classify', protect, async (req, res) => {
  const { subject, body } = req.body;
  const result = await classifyEmailContent({ subject, body });
  res.json(result);
});

// GET /api/ai/daily-summary - CDC 3.5 Résumé quotidien automatique
router.get('/daily-summary', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const clinicId = req.clinicId;

    const todayAppointments = await Appointment.find({ clinicId, date: today, status: { $ne: 'CANCELLED' } });
    const pendingEmails = await Email.find({ clinicId, status: 'PENDING_VALIDATION' });
    const emergencies = await Email.find({ clinicId, intent: 'EMERGENCY', status: { $ne: 'VALIDATED_AND_SENT' } });

    res.json({
      date: today,
      appointmentsCount: todayAppointments.length,
      appointments: todayAppointments,
      pendingEmailsCount: pendingEmails.length,
      pendingEmails: pendingEmails.map(e => ({ id: e._id, subject: e.subject, intent: e.intent, sender: e.sender.name })),
      emergenciesCount: emergencies.length,
      emergencies: emergencies.map(e => ({ id: e._id, subject: e.subject, sender: e.sender.name })),
      readyToSendBeforeOpening: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la génération du résumé', error: error.message });
  }
});

export default router;
