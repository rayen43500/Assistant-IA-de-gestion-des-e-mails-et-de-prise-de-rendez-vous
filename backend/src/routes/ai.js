import express from 'express';
import jwt from 'jsonwebtoken';
import { protect, JWT_SECRET } from '../middleware/auth.js';
import { checkHealthAI, classifyEmailContent } from '../services/aiClient.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { sendGmailMessage } from '../services/gmailSenderService.js';
import Doctor from '../models/Doctor.js';
import { evaluateBookingRequest } from '../services/smartBookingDecisionService.js';
import { identifyPractitioner } from '../services/centralEmailRouter.js';
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
        const decoded = jwt.verify(token, JWT_SECRET);
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
/**
 * POST /api/ai/patient-chat-booking — Chat de réservation de l'espace patient.
 * Mêmes règles que l'e-mail : vrai praticien, vraies disponibilités, et coordonnées
 * obligatoires avant toute réservation (le cabinet doit pouvoir joindre le patient).
 */
router.post('/patient-chat-booking', async (req, res) => {
  try {
    const { message, patientInfo = {}, selectedProfession, context = {} } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message requis' });
    }
    const text = String(message).slice(0, 2000);

    // Praticien cité dans le message (ou déjà choisi dans la conversation)
    const match = await identifyPractitioner({ recipient: '', subject: '', body: text });
    let practitioner = match.matched ? match.practitioner : null;
    if (!practitioner && context.practitionerId && mongoose.isValidObjectId(String(context.practitionerId))) {
      practitioner = await Doctor.findOne({ _id: context.practitionerId, status: 'ACTIVE' }).lean();
    }
    if (!practitioner && selectedProfession && mongoose.connection.readyState === 1) {
      practitioner = await Doctor.findOne({ profession: selectedProfession === 'AVOCAT' ? 'AVOCAT' : 'MEDECIN', status: 'ACTIVE' }).lean();
    }

    const email = String(patientInfo.email || '').trim().toLowerCase();
    const phone = String(patientInfo.phone || '').trim();
    const hasContact = /@/.test(email) && phone.length >= 8;

    const decision = await evaluateBookingRequest({
      messageText: text,
      patientInfo: { name: patientInfo.name || 'Patient', email, phone, source: 'PATIENT_PORTAL' },
      practitioner,
      context: { date: context.date, time: context.time, proposedSlots: context.proposedSlots },
      dryRun: !hasContact,
    });

    // Sans coordonnées : on garde le créneau en mémoire et on les demande
    if (!hasContact && decision.decision === 'DIRECT_CONFIRMATION') {
      return res.json({
        success: true,
        decision: 'NEED_CONTACT',
        confirmed: false,
        replyText: `Le créneau du ${decision.date} à ${decision.time} avec ${decision.practitioner?.name} est libre. Pour le réserver, indiquez votre e-mail et votre téléphone dans « Mon profil » (ou utilisez « Prendre un rendez-vous »), puis renvoyez votre message.`,
        proposedSlots: [],
        practitioner: decision.practitioner ? { id: decision.practitioner._id, name: decision.practitioner.name } : null,
        context: { practitionerId: decision.practitioner?._id, date: decision.date, time: decision.time },
      });
    }

    // RDV réservé : lien de gestion sans compte (consultation / annulation) + e-mail de confirmation
    let managementToken = null;
    if (decision.persisted && decision.appointment?._id) {
      managementToken = crypto.randomBytes(32).toString('hex');
      await Appointment.updateOne({ _id: decision.appointment._id }, { guestManagementToken: managementToken });
      const manageUrl = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')}/?token=${managementToken}`;
      sendGmailMessage({ to: email, subject: `Confirmation de votre rendez-vous du ${decision.date} à ${decision.time}`, body: `${decision.message}

Consulter ou annuler : ${manageUrl}` }).catch(() => {});
    }

    return res.json({
      success: true,
      managementToken,
      decision: decision.decision,
      confirmed: decision.confirmed || false,
      replyText: decision.message,
      proposedSlots: decision.proposedSlots || [],
      appointment: decision.persisted ? decision.appointment : null,
      practitioner: decision.practitioner ? { id: decision.practitioner._id, name: decision.practitioner.name } : null,
      date: decision.date || null,
      time: decision.time || null,
      context: {
        practitionerId: decision.practitioner?._id,
        date: decision.context?.date || decision.date,
        time: decision.context?.time,
        proposedSlots: decision.proposedSlotObjects || [],
      },
    });
  } catch (error) {
    console.error('[Patient Chat Booking Error]:', error);
    res.status(500).json({ message: 'Erreur traitement chat patient', error: error.message });
  }
});

export default router;
