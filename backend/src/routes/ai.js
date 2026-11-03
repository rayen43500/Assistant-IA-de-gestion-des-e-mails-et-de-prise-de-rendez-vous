import express from 'express';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';
import { checkHealthAI, classifyEmailContent } from '../services/aiClient.js';
import Email from '../models/Email.js';
import Appointment from '../models/Appointment.js';
import Clinic from '../models/Clinic.js';
import User from '../models/User.js';

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

// GET /api/ai/daily-summary - CDC 3.5 Résumé quotidien automatique (Compatible Auth JWT & n8n)
router.get('/daily-summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let clinicId = null;

    // 1. Si un token JWT est présent
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_cabinet_ai_2026');
        const user = await User.findById(decoded.id);
        if (user) clinicId = user.clinicId;
      } catch (err) {
        // Ignorer l'erreur JWT pour permettre le fallback automatique
      }
    }

    // 2. Si pas de token, fallback par query param ou cabinet par défaut (pour n8n)
    if (!clinicId && req.query.clinicId && req.query.clinicId.match(/^[0-9a-fA-F]{24}$/)) {
      clinicId = req.query.clinicId;
    }

    if (!clinicId) {
      const defaultClinic = await Clinic.findOne();
      if (defaultClinic) {
        clinicId = defaultClinic._id;
      }
    }

    const queryFilter = clinicId ? { clinicId } : {};

    const todayAppointments = await Appointment.find({ ...queryFilter, date: today, status: { $ne: 'CANCELLED' } });
    const pendingEmails = await Email.find({ ...queryFilter, status: 'PENDING_VALIDATION' });
    const emergencies = await Email.find({ ...queryFilter, intent: 'EMERGENCY', status: { $ne: 'VALIDATED_AND_SENT' } });

    res.json({
      date: today,
      clinicId: clinicId || 'all',
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
