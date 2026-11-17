import Doctor from '../models/Doctor.js';
import InternalSchedule from '../models/InternalSchedule.js';
import Appointment from '../models/Appointment.js';
import Integration from '../models/Integration.js';
import { getDoctorGoogleBusySlots } from './googleCalendarService.js';

/**
 * Convertit "HH:mm" en minutes depuis minuit
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convertit des minutes depuis minuit en "HH:mm"
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Retourne le nom du jour en français à partir d'une date YYYY-MM-DD
 */
function getFrenchDayName(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z');
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[date.getUTCDay()];
}

/**
 * Moteur de calcul de disponibilité centralisé et hybride pour un médecin donné.
 * Croise :
 * 1. Grille hebdomadaire du praticien
 * 2. Pauses (ex: pause déjeuner 12:30 - 14:00)
 * 3. Congés et indisponibilités
 * 4. Rendez-vous MediLawAI existants
 * 5. Blocs occupés Google Calendar (FreeBusy)
 */
export async function calculateDoctorAvailability({
  tenantId,
  doctorId,
  date,
  durationMinutes = 30,
  bufferMinutes = 5,
}) {
  // 1. Récupérer le praticien et ses paramètres
  const doctor = await Doctor.findOne({ _id: doctorId, tenantId });
  if (!doctor || doctor.status !== 'ACTIVE') {
    return {
      available: false,
      slots: [],
      reason: 'Praticien introuvable ou inactif.',
    };
  }

  const duration = durationMinutes || doctor.appointmentDuration || 30;
  const buffer = bufferMinutes !== undefined ? bufferMinutes : (doctor.bufferTime || 5);
  const slotStep = duration + buffer;

  // 2. Récupérer la grille d'horaires interne
  let schedule = await InternalSchedule.findOne({ doctorId });
  if (!schedule) {
    // Créer une grille par défaut avec pause 12:30-14:00
    schedule = await InternalSchedule.create({
      tenantId,
      doctorId,
      appointmentDuration: duration,
      bufferTime: buffer,
    });
  }

  // 3. Vérifier les congés / vacances
  if (schedule.holidays && schedule.holidays.length > 0) {
    const isHoliday = schedule.holidays.some(h => date >= h.start && date <= h.end);
    if (isHoliday) {
      return {
        available: false,
        slots: [],
        reason: 'Le praticien est en congé ou indisponible à cette date.',
      };
    }
  }

  // 4. Identifier les heures d'ouverture pour ce jour
  const dayName = getFrenchDayName(date);
  const dayConfig = schedule.weeklyWorkingHours.find(d => d.day === dayName);

  if (!dayConfig || !dayConfig.active) {
    return {
      available: false,
      slots: [],
      reason: `Le cabinet est fermé le ${dayName}.`,
    };
  }

  const openMinutes = timeToMinutes(dayConfig.start);
  const closeMinutes = timeToMinutes(dayConfig.end);

  // 5. Identifier les plages interdites (pauses déjeuner)
  const forbiddenRanges = [];

  if (dayConfig.hasBreak && dayConfig.breakStart && dayConfig.breakEnd) {
    forbiddenRanges.push({
      start: timeToMinutes(dayConfig.breakStart),
      end: timeToMinutes(dayConfig.breakEnd),
      reason: 'PAUSE_DEJEUNER',
    });
  }

  // 6. Récupérer les rendez-vous existants MediLawAI
  const existingAppointments = await Appointment.find({
    $or: [{ doctorId }, { practitionerId: doctor.userId }],
    date,
    status: { $in: ['SCHEDULED', 'CONFIRMED'] },
  });

  for (const apt of existingAppointments) {
    forbiddenRanges.push({
      start: timeToMinutes(apt.timeSlot.start),
      end: timeToMinutes(apt.timeSlot.end) + buffer,
      reason: 'APPOINTMENT_RESERVED',
    });
  }

  // 7. Interroger l'intégration Google Calendar si connectée (FreeBusy API)
  try {
    const googleBusySlots = await getDoctorGoogleBusySlots(doctorId, date);
    if (Array.isArray(googleBusySlots)) {
      for (const busy of googleBusySlots) {
        forbiddenRanges.push({
          start: timeToMinutes(busy.start),
          end: timeToMinutes(busy.end) + buffer,
          reason: 'GOOGLE_CALENDAR_BUSY',
        });
      }
    }
  } catch (err) {
    console.warn(`[AvailabilityService] Google Calendar FreeBusy non disponible pour doc ${doctorId}:`, err.message);
  }

  // 8. Découper la journée en créneaux selon la durée et le battement
  const slots = [];

  for (let current = openMinutes; current + duration <= closeMinutes; current += slotStep) {
    const slotStart = current;
    const slotEnd = current + duration;

    // Vérifier si le créneau chevauche une plage interdite
    const hasCollision = forbiddenRanges.some(range => {
      return (slotStart < range.end && slotEnd > range.start);
    });

    const isLunchBreak = dayConfig.hasBreak && (
      (slotStart >= timeToMinutes(dayConfig.breakStart) && slotStart < timeToMinutes(dayConfig.breakEnd)) ||
      (slotEnd > timeToMinutes(dayConfig.breakStart) && slotEnd <= timeToMinutes(dayConfig.breakEnd))
    );

    slots.push({
      start: minutesToTime(slotStart),
      end: minutesToTime(slotEnd),
      available: !hasCollision,
      isBreak: isLunchBreak,
      label: isLunchBreak ? 'Pause Déjeuner (12:30 - 14:00)' : (!hasCollision ? 'Disponible' : 'Réservé / Occupé'),
    });
  }

  const availableSlots = slots.filter(s => s.available);

  return {
    available: availableSlots.length > 0,
    date,
    dayName,
    doctor: {
      id: doctor._id,
      name: doctor.name,
      specialty: doctor.specialty,
      durationMinutes: duration,
      bufferMinutes: buffer,
    },
    totalSlots: slots.length,
    availableSlotsCount: availableSlots.length,
    slots,
  };
}
