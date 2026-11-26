import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import InternalSchedule from '../models/InternalSchedule.js';
import Appointment from '../models/Appointment.js';
import { getDoctorGoogleBusySlots } from './googleCalendarService.js';

export const CABINET_TIMEZONE = process.env.CABINET_TIMEZONE || 'Africa/Tunis';

export const DEFAULT_WEEKLY_HOURS = [
  { day: 'Lundi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
  { day: 'Mardi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
  { day: 'Mercredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
  { day: 'Jeudi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
  { day: 'Vendredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
  { day: 'Samedi', active: true, start: '08:30', end: '13:00', hasBreak: false },
  { day: 'Dimanche', active: false, start: '09:00', end: '12:00', hasBreak: false },
];

const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function getFrenchDayName(dateStr) {
  return FRENCH_DAYS[new Date(`${dateStr}T12:00:00Z`).getUTCDay()];
}

/**
 * Date + heure courantes dans le fuseau du cabinet.
 * @returns {{ date: 'YYYY-MM-DD', minutes: number }}
 */
export function getCabinetNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CABINET_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

/**
 * Calcul pur (sans base) des créneaux d'une journée.
 */
export function computeDaySlots({
  date,
  weeklyWorkingHours = DEFAULT_WEEKLY_HOURS,
  holidays = [],
  durationMinutes = 30,
  bufferMinutes = 5,
  appointments = [],
  externalBusy = [],
  now = new Date(),
  advanceNoticeMinutes = 60,
}) {
  const dayName = getFrenchDayName(date);
  const base = { date, dayName, slots: [], busyRanges: [], dayConfig: null };

  if (holidays.some(h => date >= h.start && date <= h.end)) {
    return { ...base, closed: true, reason: 'Le praticien est en congé ou indisponible à cette date.' };
  }

  const dayConfig = weeklyWorkingHours.find(d => d.day === dayName);
  if (!dayConfig || !dayConfig.active) {
    return { ...base, closed: true, reason: `Le cabinet est fermé le ${dayName.toLowerCase()}.` };
  }

  const cabinetNow = getCabinetNow(now);
  if (date < cabinetNow.date) {
    return { ...base, dayConfig, closed: true, past: true, reason: 'Cette date est déjà passée.' };
  }
  const earliestStart = date === cabinetNow.date ? cabinetNow.minutes + advanceNoticeMinutes : 0;

  const busyRanges = [];
  if (dayConfig.hasBreak && dayConfig.breakStart && dayConfig.breakEnd) {
    busyRanges.push({ start: timeToMinutes(dayConfig.breakStart), end: timeToMinutes(dayConfig.breakEnd), reason: 'PAUSE_DEJEUNER' });
  }
  for (const apt of appointments) {
    if (!apt?.timeSlot?.start) continue;
    busyRanges.push({
      start: timeToMinutes(apt.timeSlot.start),
      end: timeToMinutes(apt.timeSlot.end || minutesToTime(timeToMinutes(apt.timeSlot.start) + durationMinutes)) + bufferMinutes,
      reason: 'APPOINTMENT_RESERVED',
    });
  }
  for (const busy of externalBusy) {
    busyRanges.push({ start: timeToMinutes(busy.start), end: timeToMinutes(busy.end) + bufferMinutes, reason: 'GOOGLE_CALENDAR_BUSY' });
  }

  const open = timeToMinutes(dayConfig.start);
  const close = timeToMinutes(dayConfig.end);
  const slots = [];
  for (let start = open; start + durationMinutes <= close; start += durationMinutes) {
    const end = start + durationMinutes;
    const collision = busyRanges.find(r => start < r.end && end > r.start);
    const tooSoon = start < earliestStart;
    slots.push({
      start: minutesToTime(start),
      end: minutesToTime(end),
      available: !collision && !tooSoon,
      isBreak: collision?.reason === 'PAUSE_DEJEUNER',
      label: collision?.reason === 'PAUSE_DEJEUNER'
        ? `Pause Déjeuner (${dayConfig.breakStart} - ${dayConfig.breakEnd})`
        : (collision ? 'Réservé / Occupé' : (tooSoon ? 'Délai de prévenance' : 'Disponible')),
    });
  }

  return { ...base, dayConfig, busyRanges, earliestStart, slots, closed: false };
}

/**
 * Vérifie si [time, time+duration] est libre dans une journée calculée par computeDaySlots.
 * Retourne { free: boolean, reason?: string }
 */
export function checkTimeInDay(day, time, durationMinutes = 30) {
  if (day.closed) return { free: false, reason: day.reason };
  const start = timeToMinutes(time);
  const end = start + durationMinutes;
  const cfg = day.dayConfig;
  if (start < timeToMinutes(cfg.start) || end > timeToMinutes(cfg.end)) {
    return { free: false, reason: `En dehors des horaires d'ouverture (${cfg.start} - ${cfg.end})` };
  }
  if (start < (day.earliestStart || 0)) {
    return { free: false, reason: 'Ce créneau est trop proche ou déjà passé' };
  }
  const collision = day.busyRanges.find(r => start < r.end && end > r.start);
  if (collision) {
    const reasons = {
      PAUSE_DEJEUNER: `Pause déjeuner du cabinet (${cfg.breakStart} - ${cfg.breakEnd})`,
      APPOINTMENT_RESERVED: 'Créneau déjà réservé par un autre patient',
      GOOGLE_CALENDAR_BUSY: 'Le praticien est indisponible à cette heure',
    };
    return { free: false, reason: reasons[collision.reason] || 'Créneau indisponible' };
  }
  return { free: true };
}

function isDbDoctor(doctor) {
  return mongoose.connection.readyState === 1 && doctor && mongoose.isValidObjectId(String(doctor._id || doctor.id || ''));
}

/**
 * Charge la journée d'un praticien (MongoDB + Google FreeBusy si disponibles,
 * sinon grille par défaut). Fonction utilisée par le moteur de réservation e-mail.
 */
export async function loadPractitionerDay(practitioner, date, { now = new Date() } = {}) {
  const duration = practitioner?.appointmentDuration || 30;
  const buffer = practitioner?.bufferTime ?? 5;
  const advanceNoticeMinutes = (practitioner?.bookingSettings?.advanceNoticeHours ?? 1) * 60;

  if (!isDbDoctor(practitioner)) {
    return computeDaySlots({ date, durationMinutes: duration, bufferMinutes: buffer, now, advanceNoticeMinutes });
  }

  const doctorId = practitioner._id || practitioner.id;
  const schedule = await InternalSchedule.findOne({ doctorId }).lean();
  const appointments = await Appointment.find({
    doctorId,
    date,
    status: { $in: ['SCHEDULED', 'CONFIRMED'] },
  }).lean();

  let externalBusy = [];
  try {
    externalBusy = await getDoctorGoogleBusySlots(doctorId, date);
  } catch (err) {
    console.warn(`[Availability] FreeBusy indisponible pour ${doctorId}:`, err.message);
  }

  return computeDaySlots({
    date,
    weeklyWorkingHours: schedule?.weeklyWorkingHours?.length ? schedule.weeklyWorkingHours : DEFAULT_WEEKLY_HOURS,
    holidays: schedule?.holidays || [],
    durationMinutes: schedule?.appointmentDuration || duration,
    bufferMinutes: schedule?.bufferTime ?? buffer,
    appointments,
    externalBusy: Array.isArray(externalBusy) ? externalBusy : [],
    now,
    advanceNoticeMinutes,
  });
}

/**
 * API historique (routes /availability) : conserve le même format de réponse.
 */
export async function calculateDoctorAvailability({
  tenantId,
  doctorId,
  date,
  durationMinutes = 30,
  bufferMinutes = 5,
}) {
  const doctor = await Doctor.findOne({ _id: doctorId, tenantId });
  if (!doctor || doctor.status !== 'ACTIVE') {
    return { available: false, slots: [], reason: 'Praticien introuvable ou inactif.' };
  }

  let schedule = await InternalSchedule.findOne({ doctorId });
  if (!schedule) {
    schedule = await InternalSchedule.create({
      tenantId,
      doctorId,
      appointmentDuration: durationMinutes || doctor.appointmentDuration || 30,
      bufferTime: bufferMinutes ?? doctor.bufferTime ?? 5,
    });
  }

  const day = await loadPractitionerDay(doctor, date);
  const availableSlots = day.slots.filter(s => s.available);

  return {
    available: availableSlots.length > 0,
    date,
    dayName: day.dayName,
    reason: day.closed ? day.reason : undefined,
    doctor: {
      id: doctor._id,
      name: doctor.name,
      specialty: doctor.specialty,
      durationMinutes: schedule.appointmentDuration || durationMinutes,
      bufferMinutes: schedule.bufferTime ?? bufferMinutes,
    },
    totalSlots: day.slots.length,
    availableSlotsCount: availableSlots.length,
    slots: day.slots,
  };
}
