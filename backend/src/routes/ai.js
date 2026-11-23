import express from 'express';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';
import { checkHealthAI, classifyEmailContent } from '../services/aiClient.js';
import { evaluateBookingRequest } from '../services/smartBookingDecisionService.js';
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

    let todayAppointments = [];
    let pendingEmails = [];
    let emergencies = [];

    if (Appointment.db?.readyState === 1) {
      if (!clinicId) {
        const defaultClinic = await Clinic.findOne();
        if (defaultClinic) {
          clinicId = defaultClinic._id;
        }
      }
      const queryFilter = clinicId ? { clinicId } : {};
      todayAppointments = await Appointment.find({ ...queryFilter, date: today, status: { $ne: 'CANCELLED' } });
      pendingEmails = await Email.find({ ...queryFilter, status: 'PENDING_VALIDATION' });
      emergencies = await Email.find({ ...queryFilter, intent: 'EMERGENCY', status: { $ne: 'VALIDATED_AND_SENT' } });
    } else {
      // Mock résilient pour n8n et vérifications d'escalade
      todayAppointments = [
        { id: 'app_1', patient: { name: 'Mona Karray' }, time: '10:00' }
      ];
      pendingEmails = [
        { id: 'em_1', subject: 'Demande RDV', intent: 'APPOINTMENT', sender: 'Sami Chaabane' }
      ];
      emergencies = [];
    }

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

// POST /api/ai/patient-chat-booking - Chat interactif de réservation intelligente pour l'Espace Patient
router.post('/patient-chat-booking', async (req, res) => {
  try {
    const { message, patientInfo, selectedProfession } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message requis' });
    }

    const decision = await evaluateBookingRequest({
      messageText: `${selectedProfession ? 'Profession: ' + selectedProfession + ' ' : ''}${message}`,
      patientInfo: {
        name: patientInfo?.name || 'Patient',
        email: patientInfo?.email || 'patient@medilawai.com',
        phone: patientInfo?.phone || '+216 98 123 456',
        source: 'PATIENT_PORTAL',
      },
    });

    return res.json({
      success: true,
      decision: decision.decision,
      confirmed: decision.confirmed || false,
      replyText: decision.message,
      proposedSlots: decision.proposedSlots || [],
      appointment: decision.appointment || null,
      practitioner: decision.practitioner || null,
      date: decision.date || null,
      time: decision.time || null,
    });
  } catch (error) {
    console.error('[Patient Chat Booking Error]:', error);
    res.status(500).json({ message: 'Erreur traitement chat patient', error: error.message });
  }
});

export default router;
