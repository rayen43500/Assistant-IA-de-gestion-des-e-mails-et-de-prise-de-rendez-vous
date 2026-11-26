import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import {
  loadPractitionerDay,
  checkTimeInDay,
  getCabinetNow,
  addDays,
  getFrenchDayName,
  timeToMinutes,
  minutesToTime,
} from './availabilityService.js';

/**
 * Service de Décision Automatique pour Prise de RDV (E-mail & Chat Patient)
 *
 * Règle fondamentale : aucune question inutile.
 *  - Praticien + date + heure présents et créneau libre  → réservation + confirmation en 1 message.
 *  - Date présente mais pas d'heure                     → on propose les vrais créneaux libres de ce jour.
 *  - Créneau occupé / fermé / pause                     → on propose les créneaux libres les plus proches.
 *  - Pas de date                                        → on demande la date en proposant les prochaines disponibilités.
 *
 * Les créneaux proviennent TOUJOURS du calendrier interne (grille + RDV existants + Google FreeBusy),
 * jamais d'une liste inventée.
 */

const MONTHS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
};
const MONTH_NAMES_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WEEKDAYS = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export function normalizeText(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'");
}

function pad(n) { return String(n).padStart(2, '0'); }

function isValidDate(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function buildDate(y, m, d, today, explicitYear) {
  if (!isValidDate(y, m, d)) return null;
  let iso = `${y}-${pad(m)}-${pad(d)}`;
  // Sans année explicite, une date passée désigne l'année suivante
  if (!explicitYear && iso < today) {
    if (!isValidDate(y + 1, m, d)) return null;
    iso = `${y + 1}-${pad(m)}-${pad(d)}`;
  }
  return iso;
}

/**
 * Extrait une date (YYYY-MM-DD) d'un texte libre FR/EN.
 * @returns {string|null}
 */
export function parseDateFromText(text = '', now = new Date()) {
  return parseDateDetailed(text, now).date;
}

export function parseDateDetailed(text = '', now = new Date()) {
  const t = normalizeText(text);
  const today = getCabinetNow(now).date;
  const year = Number(today.slice(0, 4));

  // ISO 2026-11-26
  let m = t.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (m) {
    const d = buildDate(Number(m[1]), Number(m[2]), Number(m[3]), today, true);
    if (d) return { date: d, approximate: false };
  }

  // 26/11/2026, 26/11, 26.11.26, 26-11
  const slashRe = /\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/g;
  while ((m = slashRe.exec(t))) {
    const dd = Number(m[1]); const mm = Number(m[2]);
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) continue;
    let yy = m[3] ? Number(m[3]) : year;
    if (m[3] && m[3].length === 2) yy += 2000;
    const d = buildDate(yy, mm, dd, today, Boolean(m[3]));
    if (d) return { date: d, approximate: false };
  }

  // 26 novembre (2026), 1er décembre
  const monthRe = new RegExp(`\\b(\\d{1,2})(?:er|st|nd|rd|th)?\\s+(?:de\\s+)?(${Object.keys(MONTHS).join('|')})\\b(?:\\s+(20\\d{2}))?`);
  m = t.match(monthRe);
  if (m) {
    const d = buildDate(m[3] ? Number(m[3]) : year, MONTHS[m[2]], Number(m[1]), today, Boolean(m[3]));
    if (d) return { date: d, approximate: false };
  }

  // Relatifs
  if (/\bapres[- ]demain\b/.test(t)) return { date: addDays(today, 2), approximate: false };
  if (/\bdemain\b|\btomorrow\b/.test(t)) return { date: addDays(today, 1), approximate: false };
  if (/\baujourd'?hui\b|\bce jour\b|\btoday\b/.test(t)) return { date: today, approximate: false };

  // Jour de la semaine (prochaine occurrence, jamais aujourd'hui)
  const todayIdx = new Date(`${today}T12:00:00Z`).getUTCDay();
  for (const [name, idx] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}\\b`).test(t)) {
      let diff = idx - todayIdx;
      if (diff <= 0) diff += 7;
      return { date: addDays(today, diff), approximate: false };
    }
  }

  // Approximatif : « la semaine prochaine »
  if (/semaine prochaine|next week/.test(t)) {
    const diffToMonday = ((8 - todayIdx) % 7) || 7;
    return { date: addDays(today, diffToMonday), approximate: true };
  }

  return { date: null, approximate: false };
}

/**
 * Extrait une heure HH:mm (plage plausible 07h–20h).
 */
export function parseTimeFromText(text = '') {
  const t = normalizeText(text)
    // retirer les dates pour éviter 26/11 -> heure
    .replace(/\b\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?\b/g, ' ');

  const candidates = [];
  const hRe = /\b([01]?\d|2[0-3])\s*(?:h|heures?)\s*([0-5]\d)?\b/g;
  let m;
  while ((m = hRe.exec(t))) candidates.push([Number(m[1]), m[2] ? Number(m[2]) : 0]);
  const colonRe = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
  while ((m = colonRe.exec(t))) candidates.push([Number(m[1]), Number(m[2])]);
  const ampmRe = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/g;
  while ((m = ampmRe.exec(t))) {
    let h = Number(m[1]) % 12;
    if (m[3] === 'pm') h += 12;
    candidates.push([h, m[2] ? Number(m[2]) : 0]);
  }
  if (/\bmidi\b/.test(t) && !/apres[- ]midi/.test(t)) candidates.push([12, 0]);

  const plausible = candidates.find(([h]) => h >= 7 && h <= 20);
  return plausible ? `${pad(plausible[0])}:${pad(plausible[1])}` : null;
}

export function parsePeriodPreference(text = '') {
  const t = normalizeText(text);
  if (/apres[- ]midi|afternoon|l'aprem/.test(t)) return 'AFTERNOON';
  if (/\bmatin|matinee|morning\b/.test(t)) return 'MORNING';
  if (/\bsoir|fin de journee|evening\b/.test(t)) return 'EVENING';
  return null;
}

export function parsePhoneFromText(text = '') {
  const m = String(text).match(/(?:\+?216[\s.-]?)?\b[2-9]\d[\s.-]?\d{3}[\s.-]?\d{3}\b/);
  return m ? m[0].replace(/\s+/g, ' ').trim() : null;
}

/**
 * Choix d'un créneau déjà proposé (« le premier », « le 2ème », « 15h30 »).
 */
export function pickProposedSlot(text = '', proposedSlots = []) {
  if (!proposedSlots?.length) return null;
  const t = normalizeText(text);
  const time = parseTimeFromText(text);
  if (time) {
    const exact = proposedSlots.find(s => s.time === time);
    if (exact) return exact;
  }
  const ordinalWords = [
    [/\b(premier|premiere|1er|1ere|first)\b/, 0],
    [/\b(deuxieme|second|seconde|2eme|2e)\b/, 1],
    [/\b(troisieme|3eme|3e|third)\b/, 2],
    [/\b(quatrieme|4eme|4e|fourth)\b/, 3],
    [/\b(dernier|derniere|last)\b/, proposedSlots.length - 1],
  ];
  for (const [re, idx] of ordinalWords) {
    if (re.test(t) && proposedSlots[idx]) return proposedSlots[idx];
  }
  // Chiffre seul (« option 2 », « le 2 ») : seulement avec un mot de contexte
  const digit = t.match(/\b(?:creneau|choix|option|numero|n°|le)\s*([1-4])\b(?!\s*[/h:.])/);
  if (digit && proposedSlots[Number(digit[1]) - 1]) return proposedSlots[Number(digit[1]) - 1];
  return null;
}

export function parseReasonFromText(text = '') {
  const lower = normalizeText(text);
  if (lower.includes('controle') || lower.includes('suivi')) return 'Consultation de suivi / contrôle';
  if (lower.includes('urgence') || lower.includes('urgent')) return 'Consultation urgente';
  if (lower.includes('tension') || lower.includes('palpitation')) return 'Contrôle cardiologique';
  if (lower.includes('echographie')) return 'Échographie';
  if (lower.includes('avocat') || lower.includes('juridique') || lower.includes('contrat')) return 'Conseil juridique';
  if (lower.includes('consultation')) return 'Consultation standard';
  return 'Consultation médicale';
}

export function detectProfessionPreference(text = '') {
  const lower = normalizeText(text);
  const legalKeywords = ['avocat', 'juridique', 'tribunal', 'contrat', 'procedure', 'litige', 'notaire', 'profession: avocat'];
  if (legalKeywords.some(k => lower.includes(k))) return 'AVOCAT';
  return 'MEDECIN';
}

export function formatDateFr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${getFrenchDayName(dateStr).toLowerCase()} ${d} ${MONTH_NAMES_FR[m - 1]} ${y}`;
}

function formatTimeFr(time) {
  return time.replace(':', 'h');
}

function slotLabel(slot) {
  const [y, m, d] = slot.date.split('-');
  return `${d}/${m}/${y} à ${slot.time}`;
}

function filterByPeriod(slots, period) {
  if (!period) return slots;
  const filtered = slots.filter(s => {
    const min = timeToMinutes(s.start);
    if (period === 'MORNING') return min < 12 * 60 + 30;
    if (period === 'AFTERNOON') return min >= 13 * 60;
    if (period === 'EVENING') return min >= 16 * 60;
    return true;
  });
  return filtered.length ? filtered : slots;
}

/**
 * Cherche les créneaux libres à partir d'une date (jusqu'à `maxDays` jours ouvrés).
 * Si `aroundTime` est fourni, trie les créneaux du premier jour par proximité.
 */
async function findAvailableSlots(practitioner, fromDate, { now, count = 4, maxDays = 14, aroundTime = null, period = null } = {}) {
  const results = [];
  for (let i = 0; i < maxDays && results.length < count; i++) {
    const date = addDays(fromDate, i);
    const day = await loadPractitionerDay(practitioner, date, { now });
    if (day.closed) continue;
    let free = filterByPeriod(day.slots.filter(s => s.available), period);
    if (aroundTime && i === 0) {
      const target = timeToMinutes(aroundTime);
      free = [...free].sort((a, b) => Math.abs(timeToMinutes(a.start) - target) - Math.abs(timeToMinutes(b.start) - target))
        .slice(0, count)
        .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    }
    for (const s of free) {
      if (results.length >= count) break;
      results.push({ date, time: s.start, end: s.end });
    }
  }
  return results;
}

function slotsListText(slots, { sameDay = false } = {}) {
  return slots.map(s => (sameDay ? `• ${formatTimeFr(s.time)}` : `• ${formatDateFr(s.date)} à ${formatTimeFr(s.time)}`)).join('\n');
}

const DEMO_PRACTITIONER = (profession) => ({
  _id: 'doc-rayen',
  id: 'doc-rayen',
  name: profession === 'AVOCAT' ? 'Me. Youssef Trabelsi' : 'Dr. Rayen B.',
  profession,
  specialty: profession === 'AVOCAT' ? 'Droit des Affaires & Civil' : 'Cardiologie',
  appointmentDuration: 30,
});

/**
 * Analyse et prend la décision automatique pour une demande de RDV.
 *
 * @param {object} params
 * @param {string} params.messageText    Texte du message patient (sujet + corps)
 * @param {object} params.patientInfo    { name, email, phone, source }
 * @param {object} [params.practitioner] Praticien déjà identifié
 * @param {object} [params.context]      Contexte de conversation : { date, time, proposedSlots, reason }
 * @param {Date}   [params.now]          Horloge injectable (tests)
 * @param {boolean} [params.dryRun]      Vérifie la disponibilité sans créer le RDV
 */
export async function evaluateBookingRequest({
  messageText = '',
  patientInfo = {},
  practitioner = null,
  tenantId = null,
  context = {},
  emailReference = null,
  now = new Date(),
  dryRun = false, // vérifie le créneau sans le réserver
}) {
  const dbConnected = mongoose.connection.readyState === 1;
  const parsed = parseDateDetailed(messageText, now);
  const picked = pickProposedSlot(messageText, context.proposedSlots);

  let date = picked?.date || parsed.date || context.date || null;
  let approximate = !picked && !parsed.date ? Boolean(context.approximate) : parsed.approximate;
  let time = picked?.time || parseTimeFromText(messageText) || (parsed.date ? null : context.time) || null;
  const period = parsePeriodPreference(messageText) || context.period || null;
  const reason = context.reason || parseReasonFromText(messageText);
  const professionPref = detectProfessionPreference(messageText);
  const name = patientInfo.name || '';
  const greeting = `Bonjour${name ? ' ' + name : ''},`;
  const extracted = { parsedDate: date, parsedTime: time, reason, period };

  // ─── 1. Praticien ───────────────────────────────────────────────────────
  let activePractitioner = practitioner;
  if (!activePractitioner && dbConnected) {
    try {
      activePractitioner = await Doctor.findOne({ profession: professionPref, status: 'ACTIVE' }).lean();
    } catch {}
  }
  if (!activePractitioner) {
    if (dbConnected) {
      return {
        decision: 'NEED_PRACTITIONER',
        confirmed: false,
        message: `${greeting}\n\nAfin de vous réserver le bon créneau, pourriez-vous nous préciser le praticien ou la spécialité souhaitée ?\n\nCordialement,\nLe secrétariat MediLawAI`,
        missing: ['practitioner'],
        extracted,
      };
    }
    // Mode démonstration hors base de données
    activePractitioner = DEMO_PRACTITIONER(professionPref);
  }
  const practName = activePractitioner.name;
  const duration = activePractitioner.appointmentDuration || 30;
  const today = getCabinetNow(now).date;
  const signature = `Bien cordialement,\nLe secrétariat pour ${practName}\nMediLawAI`;

  // ─── 2. Pas de date (ou date approximative) ─────────────────────────────
  if (!date || approximate) {
    const from = date && date > today ? date : today;
    const suggestions = await findAvailableSlots(activePractitioner, from, { now, count: 4, period, aroundTime: time });
    const intro = approximate
      ? `voici nos disponibilités pour la période souhaitée avec ${practName} :`
      : `avec plaisir pour votre rendez-vous avec ${practName}. Pourriez-vous nous indiquer la date qui vous conviendrait le mieux ? Voici nos prochaines disponibilités :`;
    return {
      decision: approximate ? 'NEED_TIME_PROPOSE_SLOTS' : 'NEED_DATE',
      confirmed: false,
      message: `${greeting}\n\n${intro.charAt(0).toUpperCase() + intro.slice(1)}\n${slotsListText(suggestions)}\n\nRépondez simplement à cet e-mail avec le créneau choisi (ex : « le premier » ou « ${suggestions[0] ? formatTimeFr(suggestions[0].time) : '10h00'} »).\n\n${signature}`,
      missing: ['date'],
      practitioner: activePractitioner,
      proposedSlots: suggestions.map(slotLabel),
      proposedSlotObjects: suggestions,
      context: { date: null, time, reason, period, approximate: false },
      extracted,
    };
  }

  const day = await loadPractitionerDay(activePractitioner, date, { now });

  // ─── 3. Jour fermé / passé ──────────────────────────────────────────────
  if (day.closed) {
    const suggestions = await findAvailableSlots(activePractitioner, date < today ? today : addDays(date, 1), { now, count: 4, period, aroundTime: time });
    return {
      decision: 'PROPOSE_ALTERNATIVES',
      confirmed: false,
      success: false,
      reason: day.reason,
      message: `${greeting}\n\nNous ne pouvons malheureusement pas vous recevoir le ${formatDateFr(date)} (${day.reason.replace(/\.$/, '')}).\n\nPour ${practName}, nous pouvons vous proposer les créneaux alternatifs suivants :\n${slotsListText(suggestions)}\n\nLequel de ces horaires vous conviendrait ? Répondez simplement à cet e-mail.\n\n${signature}`,
      practitioner: activePractitioner,
      date,
      requestedTime: time,
      proposedSlots: suggestions.map(slotLabel),
      proposedSlotObjects: suggestions,
      context: { date: null, time, reason, period },
      extracted,
    };
  }

  // ─── 4. Date sans heure → créneaux réels de ce jour ─────────────────────
  if (!time) {
    let suggestions = filterByPeriod(day.slots.filter(s => s.available), period).slice(0, 6).map(s => ({ date, time: s.start, end: s.end }));
    if (suggestions.length === 0) {
      suggestions = await findAvailableSlots(activePractitioner, addDays(date, 1), { now, count: 4, period });
    }
    const sameDay = suggestions.every(s => s.date === date);
    return {
      decision: 'NEED_TIME_PROPOSE_SLOTS',
      confirmed: false,
      message: sameDay
        ? `${greeting}\n\nPour votre rendez-vous avec ${practName} le ${formatDateFr(date)}, voici les créneaux disponibles dans notre planning :\n${slotsListText(suggestions, { sameDay: true })}\n\nLequel de ces horaires a votre préférence ? Répondez simplement à cet e-mail.\n\n${signature}`
        : `${greeting}\n\nLe ${formatDateFr(date)} est complet pour ${practName}. Voici les créneaux disponibles dans notre planning les jours suivants :\n${slotsListText(suggestions)}\n\nLequel vous conviendrait ?\n\n${signature}`,
      missing: ['time'],
      date,
      practitioner: activePractitioner,
      proposedSlots: suggestions.map(slotLabel),
      proposedSlotObjects: suggestions,
      context: { date, time: null, reason, period },
      extracted,
    };
  }

  // ─── 5. Toutes les informations : vérification + réservation ────────────
  const check = checkTimeInDay(day, time, duration);
  const endTime = minutesToTime(timeToMinutes(time) + duration);

  if (check.free) {
    const doctorId = activePractitioner._id || activePractitioner.id;
    const clinicId = activePractitioner.tenantId || tenantId;
    const aptPayload = {
      clinicId,
      tenantId: clinicId,
      doctorId,
      practitionerId: activePractitioner.userId || undefined,
      patient: {
        name: name || 'Patient',
        email: patientInfo.email || 'non-renseigne@medilawai.com',
        phone: patientInfo.phone || parsePhoneFromText(messageText) || 'Non renseigné',
      },
      reason,
      date,
      timeSlot: { start: time, end: endTime },
      status: 'CONFIRMED',
      source: patientInfo.source || 'EMAIL_AI',
      emailReference: emailReference || undefined,
    };

    let createdAppointment = null;
    let persisted = false;
    let conflict = false;
    if (!dryRun && dbConnected && mongoose.isValidObjectId(String(doctorId)) && mongoose.isValidObjectId(String(clinicId || ''))) {
      try {
        createdAppointment = (await Appointment.create(aptPayload)).toObject();
        persisted = true;
      } catch (err) {
        if (err.code === 11000) conflict = true; // réservé entre-temps (index unique anti double-booking)
        else console.warn('[SmartBooking] Échec création RDV:', err.message);
      }
    }

    if (!conflict) {
      if (!createdAppointment) createdAppointment = { ...aptPayload, _id: 'apt-' + Date.now() };
      return {
        decision: 'DIRECT_CONFIRMATION',
        success: true,
        confirmed: true,
        persisted,
        message: `${greeting}\n\nNous vous confirmons avec plaisir votre rendez-vous avec ${practName} :\n📅 Date : ${formatDateFr(date)}\n⏰ Heure : ${time} - ${endTime}\n📍 Lieu : Cabinet de ${practName}\n📝 Motif : ${reason}\n\nVotre créneau est réservé dans notre planning. En cas d'empêchement, répondez simplement à cet e-mail pour l'annuler ou le déplacer.\n\n${signature}`,
        appointment: createdAppointment,
        practitioner: activePractitioner,
        date,
        time,
        allInfoProvidedInitially: !context.date && !context.proposedSlots?.length,
        context: { date, time, reason },
      };
    }
    check.reason = 'Créneau déjà réservé par un autre patient';
  }

  // ─── 6. Créneau indisponible → alternatives proches ─────────────────────
  const suggestions = await findAvailableSlots(activePractitioner, date, { now, count: 4, aroundTime: time, period });
  const sameDay = suggestions.length > 0 && suggestions.every(s => s.date === date);
  return {
    decision: 'PROPOSE_ALTERNATIVES',
    success: false,
    confirmed: false,
    reason: check.reason,
    message: `${greeting}\n\nLe créneau du ${formatDateFr(date)} à ${formatTimeFr(time)} n'est malheureusement pas disponible (${check.reason}).\n\nPour ${practName}, nous pouvons vous proposer les créneaux alternatifs suivants${sameDay ? ' le même jour' : ''} :\n${slotsListText(suggestions, { sameDay })}\n\nLequel de ces horaires vous conviendrait ? Répondez simplement à cet e-mail.\n\n${signature}`,
    proposedSlots: suggestions.map(slotLabel),
    proposedSlotObjects: suggestions,
    practitioner: activePractitioner,
    date,
    requestedTime: time,
    context: { date, time: null, reason, period },
    extracted,
  };
}
