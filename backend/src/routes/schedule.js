import express from 'express';
import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import InternalSchedule from '../models/InternalSchedule.js';
import { protect, authorize } from '../middleware/auth.js';
import { getPractitionerScope } from '../middleware/practitionerScope.js';
import { DEFAULT_WEEKLY_HOURS } from '../services/availabilityService.js';

/**
 * Horaires réels d'un praticien (utilisés par le moteur de réservation e-mail / IA).
 * PRATICIEN : son propre agenda. ADMIN : ?doctorId=… (sinon premier praticien du cabinet).
 */
const router = express.Router();
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

async function resolveDoctor(req) {
  const scope = await getPractitionerScope(req);
  if (scope.doctorId) return Doctor.findById(scope.doctorId);
  const asked = req.query.doctorId || req.body?.doctorId;
  if (asked && mongoose.isValidObjectId(String(asked))) {
    return Doctor.findOne({ _id: asked, tenantId: req.clinicId });
  }
  if (mongoose.isValidObjectId(String(req.user?._id))) {
    const own = await Doctor.findOne({ userId: req.user._id });
    if (own) return own;
  }
  return Doctor.findOne({ tenantId: req.clinicId, status: 'ACTIVE' });
}

function toSettings(doctor, schedule) {
  return {
    doctorId: String(doctor._id),
    doctorName: doctor.name,
    onlineBookingEnabled: doctor.bookingSettings?.onlineBookingEnabled !== false,
    consultationDuration: schedule?.appointmentDuration || doctor.appointmentDuration || 30,
    bufferTime: schedule?.bufferTime ?? doctor.bufferTime ?? 5,
    daysSchedule: (schedule?.weeklyWorkingHours?.length ? schedule.weeklyWorkingHours : DEFAULT_WEEKLY_HOURS).map(d => ({
      day: d.day, active: d.active, start: d.start, end: d.end,
      hasBreak: Boolean(d.hasBreak), breakStart: d.breakStart || '12:30', breakEnd: d.breakEnd || '14:00',
    })),
    unavailablePeriods: (schedule?.holidays || []).map((h, i) => ({ id: h.id || String(i), title: h.title, start: h.start, end: h.end, type: h.type || 'VACATION' })),
  };
}

router.get('/me', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const doctor = await resolveDoctor(req);
    if (!doctor) return res.status(404).json({ message: 'Aucun praticien associé à ce compte.' });
    const schedule = await InternalSchedule.findOne({ doctorId: doctor._id }).lean();
    res.json(toSettings(doctor, schedule));
  } catch (error) {
    res.status(500).json({ message: 'Erreur de chargement des horaires', error: error.message });
  }
});

router.put('/me', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const doctor = await resolveDoctor(req);
    if (!doctor) return res.status(404).json({ message: 'Aucun praticien associé à ce compte.' });
    const { consultationDuration, bufferTime, daysSchedule, unavailablePeriods, onlineBookingEnabled } = req.body || {};

    const duration = Number(consultationDuration);
    if (![15, 20, 30, 45, 60].includes(duration)) return res.status(400).json({ message: 'Durée de consultation invalide.' });
    const buffer = Number(bufferTime);
    if (!(buffer >= 0 && buffer <= 60)) return res.status(400).json({ message: 'Temps de battement invalide.' });

    const days = Array.isArray(daysSchedule) ? daysSchedule : [];
    for (const d of days) {
      if (!TIME_RE.test(d.start) || !TIME_RE.test(d.end) || d.start >= d.end) {
        return res.status(400).json({ message: `Horaires invalides pour ${d.day}.` });
      }
      if (d.hasBreak && (!TIME_RE.test(d.breakStart) || !TIME_RE.test(d.breakEnd) || d.breakStart >= d.breakEnd || d.breakStart < d.start || d.breakEnd > d.end)) {
        return res.status(400).json({ message: `Pause invalide pour ${d.day}.` });
      }
    }
    const holidays = (Array.isArray(unavailablePeriods) ? unavailablePeriods : [])
      .filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.start) && /^\d{4}-\d{2}-\d{2}$/.test(p.end) && p.start <= p.end)
      .map(p => ({ id: String(p.id), title: String(p.title || 'Indisponibilité').slice(0, 120), start: p.start, end: p.end, type: p.type || 'VACATION' }));

    const schedule = await InternalSchedule.findOneAndUpdate(
      { doctorId: doctor._id },
      {
        $set: {
          tenantId: doctor.tenantId,
          appointmentDuration: duration,
          bufferTime: buffer,
          ...(days.length ? { weeklyWorkingHours: days.map(d => ({ day: d.day, active: Boolean(d.active), start: d.start, end: d.end, hasBreak: Boolean(d.hasBreak), breakStart: d.breakStart, breakEnd: d.breakEnd })) } : {}),
          holidays,
        },
      },
      { upsert: true, new: true }
    ).lean();

    doctor.appointmentDuration = duration;
    doctor.bufferTime = buffer;
    if (typeof onlineBookingEnabled === 'boolean') {
      doctor.bookingSettings = { ...(doctor.bookingSettings?.toObject?.() || doctor.bookingSettings || {}), onlineBookingEnabled };
    }
    await doctor.save();

    res.json(toSettings(doctor, schedule));
  } catch (error) {
    res.status(500).json({ message: 'Erreur d’enregistrement des horaires', error: error.message });
  }
});

export default router;
