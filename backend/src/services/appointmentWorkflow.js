/**
 * Workflow à statuts du rendez-vous (règle métier RM-03).
 *
 *   SCHEDULED ──► CONFIRMED ──► COMPLETED
 *       │             │  └────► NO_SHOW
 *       └──► CANCELLED ◄┘
 *       └──► REJECTED
 *
 * CANCELLED, COMPLETED, NO_SHOW, REJECTED et RESCHEDULED sont des états terminaux.
 */
export const APPOINTMENT_TRANSITIONS = Object.freeze({
  SCHEDULED: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED'],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
  REJECTED: [],
  RESCHEDULED: [],
});

export const ACTIVE_STATUSES = ['SCHEDULED', 'CONFIRMED'];

export function canTransition(from, to) {
  return (APPOINTMENT_TRANSITIONS[from] || []).includes(to);
}

/**
 * Applique une transition sur un document Mongoose (sans le sauvegarder).
 * Lève une erreur { code: 'INVALID_TRANSITION' } si la transition est interdite.
 */
export function applyTransition(appointment, to) {
  const from = appointment.status;
  if (!canTransition(from, to)) {
    const err = new Error(`Transition interdite : ${from} → ${to}`);
    err.code = 'INVALID_TRANSITION';
    err.from = from;
    err.to = to;
    throw err;
  }
  appointment.status = to;
  return appointment;
}

/** Un rendez-vous ne peut être marqué « réalisé » ou « absent » qu'une fois son heure passée. */
export function isPastAppointment(appointment, now = new Date()) {
  if (appointment.startAt) return new Date(appointment.startAt) <= now;
  const start = appointment.timeSlot?.start || '00:00';
  return new Date(`${appointment.date}T${start}:00+01:00`) <= now;
}
