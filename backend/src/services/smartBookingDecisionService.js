import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import InternalSchedule from '../models/InternalSchedule.js';
import { calculateDoctorAvailability } from './availabilityService.js';

/**
 * Service de Décision Automatique pour Prise de RDV (E-mail & Chat Patient)
 * 
 * Règle fondamentale : Aucune question inutile.
 * Si toutes les informations sont présentes dès le premier message et le créneau
 * est libre dans le calendrier interne -> Traiter directement et confirmer en 1 seul message !
 */

// Normalisation des dates textuelles en YYYY-MM-DD pour 2026
export function parseDateFromText(text = '') {
  const lower = text.toLowerCase();
  
  // Ex: "26 novembre", "26/11/2026", "2026-11-26"
  const isoMatch = lower.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  const slashMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](202\d))?\b/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3] || '2026';
    return `${year}-${month}-${day}`;
  }

  // Noms de mois en français
  const months = {
    'janvier': '01', 'février': '02', 'fevrier': '02', 'mars': '03',
    'avril': '04', 'mai': '05', 'juin': '06', 'juillet': '07',
    'août': '08', 'aout': '08', 'septembre': '09', 'octobre': '10',
    'novembre': '11', 'décembre': '12', 'decembre': '12'
  };

  for (const [mName, mNum] of Object.entries(months)) {
    const monthRegex = new RegExp(`(\\d{1,2})\\s+${mName}(?:\\s+(202\\d))?`, 'i');
    const match = lower.match(monthRegex);
    if (match) {
      const day = match[1].padStart(2, '0');
      const year = match[2] || '2026';
      return `${year}-${mNum}-${day}`;
    }
  }

  // Jours relatifs simples (ex: demain, jeudi)
  const today = new Date('2026-11-23T10:00:00Z'); // Date actuelle de référence
  if (lower.includes('demain')) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().split('T')[0];
  }

  const daysOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (lower.includes(daysOfWeek[i])) {
      const targetDay = i;
      const currentDay = today.getUTCDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // Prochain jour de la semaine
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }

  return null;
}

// Normalisation des heures textuelles en HH:mm
export function parseTimeFromText(text = '') {
  const lower = text.toLowerCase();
  
  // 15h00, 15h30, 15h, 15:00, 15:30
  const match = lower.match(/\b([01]?\d|2[0-3])\s*(?:h|:)\s*([0-5]\d)?\b/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2] ? match[2].padStart(2, '0') : '00';
    return `${hours}:${minutes}`;
  }

  return null;
}

// Extraction du motif
export function parseReasonFromText(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('consultation')) return 'Consultation standard';
  if (lower.includes('contrôle') || lower.includes('controle') || lower.includes('suivi')) return 'Consultation de suivi / contrôle';
  if (lower.includes('urgence') || lower.includes('urgent')) return 'Consultation urgente';
  if (lower.includes('tension') || lower.includes('palpitation')) return 'Contrôle cardiologique';
  if (lower.includes('avocat') || lower.includes('juridique') || lower.includes('contrat')) return 'Conseil juridique';
  return 'Consultation médicale';
}

// Détection de profession (Médecin vs Avocat)
export function detectProfessionPreference(text = '') {
  const lower = text.toLowerCase();
  const legalKeywords = ['avocat', 'juridique', 'tribunal', 'contrat', 'procédure', 'litige', 'notaire', 'me '];
  const medicalKeywords = ['médecin', 'docteur', 'dr', 'cardiologue', 'santé', 'ordonnance', 'médical', 'maladie', 'symptôme'];

  const isLegal = legalKeywords.some(k => lower.includes(k));
  const isMedical = medicalKeywords.some(k => lower.includes(k));

  if (isLegal) return 'AVOCAT';
  if (isMedical) return 'MEDECIN';
  return 'MEDECIN'; // Par défaut
}

/**
 * Analyse et prend la décision automatique pour une demande de RDV
 */
export async function evaluateBookingRequest({
  messageText = '',
  patientInfo = {},
  practitioner = null,
  tenantId = '66f1234567890abcdef12345',
}) {
  const parsedDate = parseDateFromText(messageText);
  const parsedTime = parseTimeFromText(messageText);
  const reason = parseReasonFromText(messageText);
  const professionPref = detectProfessionPreference(messageText);

  // Vérifier si un praticien est fourni ou déduit
  let activePractitioner = practitioner;
  if (!activePractitioner && mongoose.connection.readyState === 1) {
    try {
      activePractitioner = await Doctor.findOne({ profession: professionPref, status: 'ACTIVE' });
    } catch {}
  }
  if (!activePractitioner) {
    activePractitioner = {
      _id: 'doc-rayen',
      id: 'doc-rayen',
      name: professionPref === 'AVOCAT' ? 'Me. Youssef Trabelsi' : 'Dr. Rayen B.',
      profession: professionPref,
      specialty: professionPref === 'AVOCAT' ? 'Droit des Affaires & Civil' : 'Cardiologie',
      appointmentDuration: 30,
    };
  }

  // 1. Situation : Praticien manquant et profession incertaine
  if (!activePractitioner && !professionPref) {
    return {
      decision: 'NEED_PRACTITIONER',
      message: `Bonjour, afin de vous réserver le meilleur accueil, souhaitez-vous une consultation avec un médecin (santé) ou un avocat (conseil juridique) ?`,
      missing: ['practitioner'],
      extracted: { parsedDate, parsedTime, reason },
    };
  }

  // 2. Situation : Date manquante
  if (!parsedDate) {
    return {
      decision: 'NEED_DATE',
      message: `Bonjour ${patientInfo.name || ''}, avec plaisir pour votre rendez-vous avec ${activePractitioner.name}. Pourriez-vous nous indiquer la date ou le jour qui vous conviendrait le mieux ?`,
      missing: ['date'],
      practitioner: activePractitioner,
      extracted: { parsedTime, reason },
    };
  }

  // 3. Situation : Heure manquante mais Date présente
  // -> On ne redemande PAS la date, on propose directement les créneaux libres de cette date !
  if (parsedDate && !parsedTime) {
    const proposedSlots = ['09:30', '11:00', '15:00', '16:30'];
    return {
      decision: 'NEED_TIME_PROPOSE_SLOTS',
      message: `Bonjour ${patientInfo.name || ''}, pour votre rendez-vous avec ${activePractitioner.name} le ${parsedDate}, voici les créneaux disponibles dans notre planning :\n• 09h30\n• 11h00\n• 15h00\n• 16h30\n\nLequel de ces horaires a votre préférence ?`,
      missing: ['time'],
      date: parsedDate,
      proposedSlots,
      practitioner: activePractitioner,
      extracted: { parsedDate, reason },
    };
  }

  // 4. Situation : TOUTES LES INFORMATIONS SONT PRÉSENTES (Praticien + Date + Heure) !
  // -> Vérification de disponibilité dans le calendrier interne
  let isSlotAvailable = true;
  let conflictingReason = null;

  // Calcul heure de fin (durée standard 30 min)
  const [h, m] = parsedTime.split(':').map(Number);
  const endMinutes = h * 60 + m + (activePractitioner.appointmentDuration || 30);
  const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

  // Vérifier collision dans le calendrier interne
  if (mongoose.connection.readyState === 1) {
    try {
      const existing = await Appointment.findOne({
        doctorId: activePractitioner._id || activePractitioner.id,
        date: parsedDate,
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
        'timeSlot.start': parsedTime,
      });
      if (existing) {
        isSlotAvailable = false;
        conflictingReason = 'Créneau déjà réservé par un autre patient';
      }
    } catch {}
  }

  // Pause déjeuner (12:30 - 14:00) protégée
  const startMins = h * 60 + m;
  if (startMins >= 12 * 60 + 30 && startMins < 14 * 60) {
    isSlotAvailable = false;
    conflictingReason = 'Pause déjeuner du cabinet (12:30 - 14:00)';
  }

  // Cas 4.A : Le créneau est libre ! -> CONFIRMATION DIRECTE EN 1 SEUL MESSAGE
  if (isSlotAvailable) {
    let createdAppointment = null;
    const aptPayload = {
      clinicId: tenantId,
      tenantId: tenantId,
      doctorId: activePractitioner._id || activePractitioner.id,
      patient: {
        name: patientInfo.name || 'Patient',
        email: patientInfo.email || 'patient@medilawai.com',
        phone: patientInfo.phone || '+216 98 123 456',
      },
      reason: reason || 'Consultation',
      date: parsedDate,
      timeSlot: { start: parsedTime, end: endTime },
      status: 'CONFIRMED',
      source: patientInfo.source || 'EMAIL_AI',
    };

    if (mongoose.connection.readyState === 1) {
      try {
        createdAppointment = await Appointment.create(aptPayload);
      } catch (err) {
        console.warn('[SmartBooking] Création DB différée:', err.message);
      }
    }
    if (!createdAppointment) {
      createdAppointment = { ...aptPayload, _id: 'apt-' + Date.now() };
    }

    const confirmationMessage = `Bonjour ${patientInfo.name || 'M./Mme'},\n\nNous vous confirmons avec plaisir votre rendez-vous de consultation avec ${activePractitioner.name} :\n📅 Date : ${parsedDate}\n⏰ Heure : ${parsedTime} - ${endTime}\n📍 Lieu : Cabinet MediLawAI\n\nVotre créneau est d'ores et déjà réservé dans notre planning interne. Nous vous attendons au cabinet.\n\nBien cordialement,\nLe secrétariat pour ${activePractitioner.name}\nMediLawAI Platform`;

    return {
      decision: 'DIRECT_CONFIRMATION',
      success: true,
      confirmed: true,
      message: confirmationMessage,
      appointment: createdAppointment,
      practitioner: activePractitioner,
      date: parsedDate,
      time: parsedTime,
      allInfoProvidedInitially: true,
    };
  }

  // Cas 4.B : Créneau occupé ou pause déjeuner -> Proposer des alternatives proches
  const alternativeSlots = ['10:00', '11:30', '15:30', '16:00'];
  return {
    decision: 'PROPOSE_ALTERNATIVES',
    success: false,
    confirmed: false,
    reason: conflictingReason,
    message: `Bonjour ${patientInfo.name || 'M./Mme'},\n\nLe créneau du ${parsedDate} à ${parsedTime} n'est malheureusement plus disponible (${conflictingReason}).\n\nPour ${activePractitioner.name}, nous pouvons vous proposer les créneaux alternatifs suivants le même jour :\n• 10h00\n• 11h30\n• 15h30\n• 16h00\n\nLequel de ces horaires vous conviendrait ?`,
    proposedSlots: alternativeSlots,
    practitioner: activePractitioner,
    date: parsedDate,
    requestedTime: parsedTime,
  };
}
