import express from 'express';
import { sendGmailMessage } from '../services/gmailSenderService.js';
import { formatDateFr } from '../services/smartBookingDecisionService.js';
import { notifyN8n, N8N_EVENTS } from '../services/n8nNotifier.js';
import crypto from 'crypto';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import DoctorPatient from '../models/DoctorPatient.js';
import Appointment from '../models/Appointment.js';
import Clinic from '../models/Clinic.js';
import { calculateDoctorAvailability, loadPractitionerDay, checkTimeInDay } from '../services/availabilityService.js';
import { syncAppointmentToGoogle } from '../services/googleCalendarService.js';

const router = express.Router();

/**
 * GET /api/public/doctors
 * Liste publique des praticiens disponibles à la réservation
 */
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: 'ACTIVE' })
      .populate('tenantId', 'name specialty address phone')
      .select('name specialty profession appointmentDuration bufferTime bookingSettings');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des praticiens', error: error.message });
  }
});

/**
 * GET /api/public/doctors/:id/availability
 * Créneaux réellement disponibles pour un praticien à une date donnée
 */
router.get('/doctors/:id/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Le paramètre de date (YYYY-MM-DD) est obligatoire.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Praticien introuvable.' });
    }

    const availability = await calculateDoctorAvailability({
      tenantId: doctor.tenantId,
      doctorId: doctor._id,
      date,
      durationMinutes: doctor.appointmentDuration,
      bufferMinutes: doctor.bufferTime,
    });

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul de disponibilité', error: error.message });
  }
});

/**
 * POST /api/public/bookings
 * Réservation directe d'un créneau par un patient sans compte avec protection atomique anti-double réservation
 */
router.post('/bookings', async (req, res) => {
  try {
    const {
      doctorId,
      date,
      startTime,
      patientName,
      patientEmail,
      patientPhone,
      reason,
      idempotencyKey,
    } = req.body;

    if (!doctorId || !date || !startTime || !patientName || !patientEmail || !patientPhone) {
      return res.status(400).json({ message: 'Veuillez renseigner tous les champs obligatoires (praticien, date, heure, nom, email, téléphone).' });
    }

    // 1. Vérification d'idempotence si une clé a été transmise
    if (idempotencyKey) {
      const existingIdempotent = await Appointment.findOne({ idempotencyKey });
      if (existingIdempotent) {
        return res.json({
          success: true,
          idempotentReplay: true,
          appointment: existingIdempotent,
          managementToken: existingIdempotent.guestManagementToken,
        });
      }
    }

    // 2. Vérifier l'existence du praticien
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== 'ACTIVE') {
      return res.status(404).json({ message: 'Le praticien sélectionné est indisponible ou introuvable.' });
    }

    if (doctor.bookingSettings?.onlineBookingEnabled === false) {
      return res.status(403).json({ message: 'Ce praticien n’accepte pas la réservation en ligne. Contactez le cabinet.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(startTime))) {
      return res.status(400).json({ message: 'Date ou heure invalide.' });
    }
    if (!/@/.test(String(patientEmail))) {
      return res.status(400).json({ message: 'Adresse e-mail invalide.' });
    }

    const duration = doctor.appointmentDuration || 30;
    // Mêmes règles que la réservation par e-mail : horaires, pauses, congés, passé, conflits
    const day = await loadPractitionerDay(doctor, date);
    const slotCheck = checkTimeInDay(day, startTime, duration);
    if (!slotCheck.free) {
      return res.status(409).json({ conflict: true, message: `Créneau indisponible : ${slotCheck.reason}` });
    }
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + duration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // 3. VÉRIFICATION STRICTE DE DOUBLE RÉSERVATION (CONCURRENCY LOCK)
    const collision = await Appointment.findOne({
      $or: [
        { doctorId: doctor._id, date, 'timeSlot.start': startTime, status: { $in: ['SCHEDULED', 'CONFIRMED'] } },
        { practitionerId: doctor.userId, date, 'timeSlot.start': startTime, status: { $in: ['SCHEDULED', 'CONFIRMED'] } }
      ]
    });

    if (collision) {
      return res.status(409).json({
        conflict: true,
        message: 'Ce créneau vient tout juste d’être réservé par un autre patient. Veuillez choisir un autre horaire.',
      });
    }

    // 4. Créer ou associer la fiche Patient
    let patient = await Patient.findOne({ tenantId: doctor.tenantId, email: patientEmail.toLowerCase().trim() });
    if (!patient) {
      patient = await Patient.create({
        tenantId: doctor.tenantId,
        name: patientName.trim(),
        email: patientEmail.toLowerCase().trim(),
        phone: patientPhone.trim(),
        contactPreferences: { email: true, sms: true, whatsapp: true },
      });
    }

    // Lier au praticien dans DoctorPatient
    await DoctorPatient.findOneAndUpdate(
      { tenantId: doctor.tenantId, doctorId: doctor._id, patientId: patient._id },
      { relationshipStatus: 'ACTIVE', lastConsultationDate: new Date() },
      { upsert: true }
    );

    // 5. Générer un jeton sécurisé révocable pour la gestion du RDV sans compte
    const guestManagementToken = crypto.randomBytes(32).toString('hex');

    // 6. Créer le rendez-vous atomiquement
    const newAppointment = await Appointment.create({
      clinicId: doctor.tenantId,
      tenantId: doctor.tenantId,
      practitionerId: doctor.userId,
      doctorId: doctor._id,
      patientId: patient._id,
      patient: {
        name: patientName.trim(),
        email: patientEmail.toLowerCase().trim(),
        phone: patientPhone.trim(),
      },
      reason: reason || 'Consultation générale',
      date,
      timeSlot: { start: startTime, end: endTime },
      status: 'CONFIRMED',
      source: 'PUBLIC_GUEST',
      synchronizationStatus: 'PENDING',
      idempotencyKey: idempotencyKey || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      guestManagementToken,
    });

    // 7. Déclencher la synchronisation Google Calendar en arrière-plan
    syncAppointmentToGoogle(newAppointment._id).catch(err => {
      console.warn('[PublicBooking] Erreur lors de la synchronisation asynchrone Google:', err.message);
    });

    // 8. E-mail de confirmation au patient avec son lien de gestion (annulation sans compte)
    const manageUrl = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')}/?token=${guestManagementToken}`;
    const mail = await sendGmailMessage({
      to: newAppointment.patient.email,
      subject: `Confirmation de votre rendez-vous du ${formatDateFr(date)} à ${startTime}`,
      body: `Bonjour ${newAppointment.patient.name},

Votre rendez-vous est confirmé :
📅 ${formatDateFr(date)} à ${startTime}
👨‍⚕️ ${doctor.name}${doctor.specialty ? ' (' + doctor.specialty + ')' : ''}
📝 Motif : ${newAppointment.reason}

Pour consulter ou annuler ce rendez-vous : ${manageUrl}

Un rappel vous sera envoyé la veille.

Bien cordialement,
Le secrétariat MediLawAI`,
    }).catch(() => ({ sent: false }));
    notifyN8n(N8N_EVENTS.APPOINTMENT_BOOKED, { appointmentId: String(newAppointment._id), date, time: startTime, source: 'PUBLIC_GUEST' });

    res.status(201).json({
      success: true,
      confirmationEmailSent: Boolean(mail?.sent),
      message: 'Votre rendez-vous a été confirmé avec succès !',
      appointment: {
        id: newAppointment._id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        date: newAppointment.date,
        timeSlot: newAppointment.timeSlot,
        patient: newAppointment.patient,
      },
      managementToken: guestManagementToken,
      managementUrl: `/?token=${guestManagementToken}`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        conflict: true,
        message: 'Ce créneau a été réservé simultanément. Veuillez sélectionner un autre créneau.',
      });
    }
    res.status(500).json({ message: 'Erreur lors de la réservation', error: error.message });
  }
});

/**
 * GET /api/public/bookings/:token
 * Consultation sécurisée d'un RDV via son jeton de gestion (sans compte)
 */
router.get('/bookings/:token', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ guestManagementToken: req.params.token })
      .populate('doctorId', 'name specialty phone')
      .populate('tenantId', 'name address phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous introuvable ou lien expiré.' });
    }

    res.json({
      id: appointment._id,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      reason: appointment.reason,
      status: appointment.status,
      doctor: appointment.doctorId,
      clinic: appointment.tenantId,
      patient: {
        name: appointment.patient.name,
        email: appointment.patient.email,
        phone: appointment.patient.phone,
      },
      canCancel: !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status),
      createdAt: appointment.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la consultation du rendez-vous', error: error.message });
  }
});

/**
 * POST /api/public/bookings/:token/cancel
 * Annulation d'un rendez-vous par le patient via son jeton
 */
router.post('/bookings/:token/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ guestManagementToken: req.params.token });
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous introuvable ou lien invalide.' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.json({ message: 'Ce rendez-vous est déjà annulé.' });
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    res.json({
      success: true,
      message: 'Votre rendez-vous a été annulé avec succès. Le créneau a été libéré.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’annulation', error: error.message });
  }
});

export default router;
