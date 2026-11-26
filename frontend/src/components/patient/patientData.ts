import { useCallback, useEffect, useState } from 'react';
import { apiGetPublicBookingByToken } from '../../services/apiClient';
import { useAppStore } from '../../stores/useAppStore';

/**
 * Données de l'espace patient.
 *
 * - Patient invité (sans compte) : ses coordonnées et les liens de gestion de ses RDV
 *   sont conservés sur son appareil ; les RDV sont relus depuis le serveur.
 * - Patient avec compte : RDV chargés par l'API (filtrés sur son adresse e-mail).
 */

const CONTACT_KEY = 'medilaw_patient_contact';
const TOKENS_KEY = 'medilaw_guest_bookings';

export interface PatientContact {
  name: string;
  email: string;
  phone: string;
}

export function getPatientContact(): PatientContact {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}');
    const user = useAppStore.getState().currentUser;
    return {
      name: saved.name || (user?.role === 'PATIENT' && user.name !== 'Invité' ? user.name : ''),
      email: saved.email || (user?.role === 'PATIENT' ? user.email : '') || '',
      phone: saved.phone || '',
    };
  } catch {
    return { name: '', email: '', phone: '' };
  }
}

export function savePatientContact(contact: PatientContact) {
  try { localStorage.setItem(CONTACT_KEY, JSON.stringify(contact)); } catch {}
}

export function getSavedBookingTokens(): string[] {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || '[]'); } catch { return []; }
}

export function addSavedBookingToken(token: string) {
  try {
    const list = getSavedBookingTokens();
    localStorage.setItem(TOKENS_KEY, JSON.stringify([token, ...list.filter(t => t !== token)].slice(0, 20)));
  } catch {}
}

export interface PatientBooking {
  id: string;
  token?: string;
  date: string;
  start: string;
  end: string;
  status: string;
  reason: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  canCancel: boolean;
  createdAt?: string;
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatLongDate = (iso: string) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

/** Rendez-vous réels du patient (invité ou connecté), triés par date. */
export function usePatientBookings() {
  const { currentUser, appointments, isAuthenticated } = useAppStore();
  const [guestBookings, setGuestBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const tokens = getSavedBookingTokens();
    const results = await Promise.all(tokens.map(async (token) => {
      try {
        const b: any = await apiGetPublicBookingByToken(token);
        return {
          id: String(b.id),
          token,
          date: b.date,
          start: b.timeSlot?.start || '',
          end: b.timeSlot?.end || '',
          status: b.status,
          reason: b.reason || 'Consultation',
          doctorName: b.doctor?.name || '',
          specialty: b.doctor?.specialty || '',
          clinicName: b.clinic?.name || '',
          canCancel: Boolean(b.canCancel),
          createdAt: b.createdAt,
        } as PatientBooking;
      } catch {
        return null; // lien expiré ou RDV supprimé
      }
    }));
    setGuestBookings(results.filter(Boolean) as PatientBooking[]);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Patient connecté : RDV chargés par l'API (déjà filtrés côté serveur)
  const accountBookings: PatientBooking[] = isAuthenticated && currentUser?.role === 'PATIENT'
    ? appointments.map(a => ({
      id: a.id, date: a.date, start: a.timeStart, end: a.timeEnd, status: a.status, reason: a.serviceName,
      doctorName: a.practitionerName, specialty: '', clinicName: '', canCancel: !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(a.status),
    }))
    : [];

  const seen = new Set<string>();
  const bookings = [...guestBookings, ...accountBookings]
    .filter(b => (seen.has(b.id) ? false : (seen.add(b.id), true)))
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));

  const today = todayISO();
  const upcoming = bookings.filter(b => b.date >= today && !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status));
  const past = bookings.filter(b => !upcoming.includes(b));

  return { bookings, upcoming, past, loading, reload };
}
