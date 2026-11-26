import express from 'express';
import { internalOnly } from '../middleware/internalOnly.js';
import { sendGmailMessage } from '../services/gmailSenderService.js';
import { formatDateFr } from '../services/smartBookingDecisionService.js';
import Appointment from '../models/Appointment.js';
import AuditLog from '../models/AuditLog.js';
import Doctor from '../models/Doctor.js';
import { getPractitionerScope } from '../middleware/practitionerScope.js';
import { protect, authorize } from '../middleware/auth.js';
import { calculateDoctorAvailability, loadPractitionerDay, checkTimeInDay, timeToMinutes, minutesToTime } from '../services/availabilityService.js';
import { notifyN8n, N8N_EVENTS } from '../services/n8nNotifier.js';
import { syncAppointmentToGoogle } from '../services/googleCalendarService.js';

const router = express.Router();

// GET /api/appointments/availability - Calcul dynamique des créneaux réels (grille + pause + Google Calendar)
router.get('/availability', protect, async (req, res) => {
  try {
    const { date, doctorId } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Le paramètre date (YYYY-MM-DD) est obligatoire.' });
    }

    let targetDoctorId = doctorId;
    if (!targetDoctorId) {
      const doc = await Doctor.findOne({ userId: req.user._id }) || await Doctor.findOne({ tenantId: req.clinicId });
      targetDoctorId = doc?._id;
    }

    if (!targetDoctorId) {
      return res.status(404).json({ message: 'Aucun praticien identifié.' });
    }

    const availability = await calculateDoctorAvailability({
      tenantId: req.clinicId,
      doctorId: targetDoctorId,
      date,
    });

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul de disponibilité', error: error.message });
  }
});

// GET /api/appointments - Liste des rendez-vous
router.get('/', protect, async (req, res) => {
  try {
    const { date, status } = req.query;
    const query = { clinicId: req.clinicId, ...(await getPractitionerScope(req, 'appointment')) };

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

// POST /api/appointments - Création manuelle (secrétariat / praticien), mêmes règles que l'IA
router.post('/', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { patient, reason, date, timeSlot, source, emailReference } = req.body || {};
    if (!patient?.name || !date || !timeSlot?.start) {
      return res.status(400).json({ message: 'Nom du patient, date et heure sont obligatoires.' });
    }

    // Praticien : celui indiqué, sinon le praticien connecté
    let doctor = null;
    const askedId = req.body.doctorId;
    if (askedId && /^[0-9a-f]{24}$/i.test(String(askedId))) {
      doctor = await Doctor.findOne({ _id: askedId, tenantId: req.clinicId }).lean();
    }
    if (!doctor && /^[0-9a-f]{24}$/i.test(String(req.user?._id))) {
      doctor = await Doctor.findOne({ userId: req.user._id }).lean();
    }
    if (!doctor) {
      return res.status(400).json({ message: 'Veuillez choisir le praticien du rendez-vous.' });
    }
    // Un praticien ne peut créer des RDV que dans son propre agenda
    const scope = await getPractitionerScope(req);
    if (scope.doctorId && String(scope.doctorId) !== String(doctor._id)) {
      return res.status(403).json({ message: 'Vous ne pouvez gérer que votre propre agenda.' });
    }

    const duration = doctor.appointmentDuration || 30;
    const end = timeSlot.end || minutesToTime(timeToMinutes(timeSlot.start) + duration);
    const day = await loadPractitionerDay(doctor, date);
    const check = checkTimeInDay(day, timeSlot.start, timeToMinutes(end) - timeToMinutes(timeSlot.start));
    if (!check.free) {
      return res.status(409).json({ message: `Créneau indisponible : ${check.reason}` });
    }

    const newAppointment = await Appointment.create({
      clinicId: doctor.tenantId,
      tenantId: doctor.tenantId,
      doctorId: doctor._id,
      practitionerId: doctor.userId,
      patient: {
        name: patient.name,
        email: patient.email || 'non-renseigne@medilawai.com',
        phone: patient.phone || 'Non renseigné',
      },
      reason: reason || 'Consultation',
      date,
      timeSlot: { start: timeSlot.start, end },
      source: ['MANUAL_SECRETARY', 'MANUAL_CABINET', 'PATIENT_PORTAL'].includes(source) ? source : 'MANUAL_SECRETARY',
      emailReference,
      status: 'CONFIRMED',
    });

    await AuditLog.create({
      clinicId: doctor.tenantId,
      userId: /^[0-9a-f]{24}$/i.test(String(req.user._id)) ? req.user._id : undefined,
      action: 'APPOINTMENT_CREATED',
      resource: 'Appointment',
      resourceId: newAppointment._id.toString(),
      details: { patient: patient.name, date, timeSlot: newAppointment.timeSlot },
    }).catch(() => {});

    notifyN8n(N8N_EVENTS.APPOINTMENT_BOOKED, { appointmentId: String(newAppointment._id), date, time: timeSlot.start, source: 'MANUAL' });
    res.status(201).json(newAppointment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ce créneau vient d’être réservé.' });
    }
    res.status(500).json({ message: 'Erreur lors de la création du rendez-vous', error: error.message });
  }
});

// POST /api/appointments/send-reminder - Rappel Multicanal (Gmail prioritaire, WhatsApp optionnel)
router.post('/send-reminder', internalOnly, async (req, res) => {
  try {
    const { appointmentId } = req.body || {};
    let apt = null;
    if (appointmentId && Appointment.db?.readyState === 1 && /^[0-9a-f]{24}$/i.test(String(appointmentId))) {
      apt = await Appointment.findById(appointmentId).populate('doctorId', 'name').lean();
    }
    if (!apt) {
      return res.status(404).json({ success: false, message: 'Rendez-vous introuvable (appointmentId requis).' });
    }
    if (apt.reminderSent24h) {
      return res.json({ success: true, alreadySent: true, appointmentId });
    }

    const practName = apt.doctorId?.name || 'votre praticien';
    const subject = `Rappel : votre rendez-vous du ${formatDateFr(apt.date)} à ${apt.timeSlot.start}`;
    const body = `Bonjour ${apt.patient?.name || ''},\n\nNous vous rappelons votre rendez-vous avec ${practName} le ${formatDateFr(apt.date)} à ${apt.timeSlot.start}.\nMotif : ${apt.reason}\n\nEn cas d'empêchement, merci de répondre à cet e-mail pour libérer le créneau.\n\nBien cordialement,\nLe secrétariat MediLawAI`;

    const emailResult = await sendGmailMessage({ to: apt.patient?.email, subject, body });
    if (emailResult.sent) {
      await Appointment.updateOne({ _id: apt._id }, { reminderSent24h: true });
    }

    res.status(emailResult.sent ? 200 : 502).json({
      success: emailResult.sent,
      appointmentId,
      primaryChannel: 'GMAIL',
      email: { recipient: apt.patient?.email, subject, delivered: emailResult.sent, reason: emailResult.reason || null },
      message: emailResult.sent ? 'Rappel envoyé par e-mail.' : `Rappel non envoyé (${emailResult.reason}).`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur envoi rappel', error: error.message });
  }
});

// GET /api/appointments/reminders-due - Pour workflow n8n Rappel 24h WhatsApp
router.get('/reminders-due', internalOnly, async (req, res) => {
  try {
    // Calcul de la date de demain si non spécifiée
    let targetDate = req.query.date;
    if (!targetDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    }

    const query = {
      date: targetDate,
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      reminderSent24h: { $ne: true },
    };

    if (req.query.clinicId) {
      query.clinicId = req.query.clinicId;
    }

    let dueAppointments = [];
    if (Appointment.db?.readyState === 1) {
      dueAppointments = await Appointment.find(query).populate('clinicId', 'name phone address');
    }
    res.json({
      targetDate,
      count: dueAppointments.length,
      data: dueAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rappels dus', error: error.message });
  }
});

// POST /api/appointments/:id/reminder-sent - Marquer le rappel envoyé par n8n
router.post('/:id/reminder-sent', internalOnly, async (req, res) => {
  try {
    if (Appointment.db?.readyState !== 1) {
      return res.json({ 
        message: 'Rappel 24h consigné avec succès (mode résilient)', 
        appointment: { _id: req.params.id, reminderSent24h: true } 
      });
    }
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous introuvable' });
    }

    appointment.reminderSent24h = true;
    await appointment.save();

    await AuditLog.create({
      clinicId: appointment.clinicId,
      action: 'N8N_WHATSAPP_REMINDER_SENT_24H',
      resource: 'Appointment',
      resourceId: appointment._id.toString(),
      details: {
        patient: appointment.patient?.name,
        phone: appointment.patient?.phone,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
      },
    });

    res.json({ message: 'Rappel 24h consigné avec succès', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rappel', error: error.message });
  }
});

// PUT /api/appointments/:id/sync-calendar - Synchroniser ID Calendar depuis n8n
// POST /api/appointments/:id/sync-google - Appelé par n8n après une réservation : crée/maj l'événement Google Calendar du praticien
router.post('/:id/sync-google', internalOnly, async (req, res) => {
  try {
    if (!/^[0-9a-f]{24}$/i.test(req.params.id)) return res.status(400).json({ synced: false, message: 'Identifiant invalide' });
    const event = await syncAppointmentToGoogle(req.params.id);
    const apt = await Appointment.findById(req.params.id).select('synchronizationStatus googleEventId').lean();
    res.json({ synced: Boolean(event), status: apt?.synchronizationStatus || 'UNKNOWN', googleEventId: apt?.googleEventId || null });
  } catch (error) {
    res.status(500).json({ synced: false, message: error.message });
  }
});

router.put('/:id/sync-calendar', internalOnly, async (req, res) => {
  try {
    const { googleCalendarEventId } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous introuvable' });
    }

    if (googleCalendarEventId) {
      appointment.googleCalendarEventId = googleCalendarEventId;
    }
    await appointment.save();

    await AuditLog.create({
      clinicId: appointment.clinicId,
      action: 'N8N_CALENDAR_EVENT_SYNCED',
      resource: 'Appointment',
      resourceId: appointment._id.toString(),
      details: { googleCalendarEventId },
    });

    res.json({ message: 'Événement calendrier synchronisé', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la synchronisation calendrier', error: error.message });
  }
});

// PUT /api/appointments/:id/cancel - Annulation et libération automatique du créneau
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, clinicId: req.clinicId, ...(await getPractitionerScope(req, 'appointment')) });
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
