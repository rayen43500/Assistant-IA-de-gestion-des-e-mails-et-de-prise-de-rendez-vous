import express from 'express';
import Appointment from '../models/Appointment.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/appointments - Liste des rendez-vous
router.get('/', protect, async (req, res) => {
  try {
    const { date, status } = req.query;
    const query = { clinicId: req.clinicId };

    if (date) query.date = date;
    if (status) query.status = status;

    const appointments = await Appointment.find(query).sort({ date: 1, 'timeSlot.start': 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous', error: error.message });
  }
});

// POST /api/appointments/check-availability - Vérifier les conflits
router.post('/check-availability', protect, async (req, res) => {
  try {
    const { date, startTime, practitionerId } = req.body;
    const query = {
      clinicId: req.clinicId,
      date,
      'timeSlot.start': startTime,
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    };

    if (practitionerId) {
      query.practitionerId = practitionerId;
    }

    const existing = await Appointment.findOne(query);
    res.json({
      available: !existing,
      message: existing ? 'Créneau déjà réservé' : 'Créneau disponible',
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de vérification', error: error.message });
  }
});

// POST /api/appointments - Création d'un rendez-vous avec protection double réservation
router.post('/', protect, async (req, res) => {
  try {
    const { patient, reason, date, timeSlot, source, practitionerId, emailReference } = req.body;

    // Vérification de collision préalable
    const conflict = await Appointment.findOne({
      clinicId: req.clinicId,
      date,
      'timeSlot.start': timeSlot.start,
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    });

    if (conflict) {
      return res.status(409).json({ message: 'Conflit détecté : ce créneau est déjà réservé.' });
    }

    const newAppointment = await Appointment.create({
      clinicId: req.clinicId,
      practitionerId: practitionerId || req.user._id,
      patient,
      reason,
      date,
      timeSlot,
      source: source || 'MANUAL_SECRETARY',
      emailReference,
      status: 'SCHEDULED',
    });

    await AuditLog.create({
      clinicId: req.clinicId,
      userId: req.user._id,
      action: 'APPOINTMENT_CREATED',
      resource: 'Appointment',
      resourceId: newAppointment._id.toString(),
      details: { patient: patient.name, date, timeSlot },
    });

    res.status(201).json(newAppointment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Double réservation empêchée par l’index de sécurité.' });
    }
    res.status(500).json({ message: 'Erreur lors de la création du rendez-vous', error: error.message });
  }
});

// PUT /api/appointments/:id/cancel - Annulation et libération automatique du créneau
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, clinicId: req.clinicId });
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous introuvable' });
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    await AuditLog.create({
      clinicId: req.clinicId,
      userId: req.user._id,
      action: 'APPOINTMENT_CANCELLED_SLOT_FREED',
      resource: 'Appointment',
      resourceId: appointment._id.toString(),
    });

    res.json({ message: 'Rendez-vous annulé et créneau libéré avec succès', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’annulation', error: error.message });
  }
});

export default router;
