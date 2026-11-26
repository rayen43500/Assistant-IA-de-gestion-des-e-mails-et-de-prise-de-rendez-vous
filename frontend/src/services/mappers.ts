import type { EmailItem, AppointmentItem } from '../types';

/**
 * Conversion des documents renvoyés par l'API (MongoDB) vers les types de l'interface.
 * Le backend reste la source de vérité ; l'interface n'invente aucune donnée.
 */

const INTENT_MAP: Record<string, EmailItem['intent']> = {
  APPOINTMENT: 'APPOINTMENT',
  RESCHEDULE: 'APPOINTMENT',
  PRICING: 'PRICING',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  EMERGENCY: 'EMERGENCY',
  SPAM: 'SPAM',
  CANCEL: 'CANCELLATION',
  UNCERTAIN: 'OTHER',
};

function formatReceivedAt(value: unknown): string {
  if (!value) return '';
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function folderFor(raw: any): EmailItem['folder'] {
  if (raw.intent === 'EMERGENCY' || raw.status === 'ESCALATED_EMERGENCY') return 'urgent';
  if (raw.intent === 'SPAM') return 'spam';
  if (['SENT', 'VALIDATED_AND_SENT'].includes(raw.status) || raw.replyStatus === 'SENT') return 'sent';
  if (!raw.doctorId && ['WAITING_FOR_REPLY', 'NEEDS_CLARIFICATION'].includes(raw.status)) return 'unassigned';
  return 'inbox';
}

function priorityFor(raw: any): EmailItem['priority'] {
  if (raw.intent === 'EMERGENCY') return 'CRITICAL';
  if (raw.intent === 'APPOINTMENT' || raw.intent === 'CANCEL') return 'HIGH';
  if (raw.intent === 'SPAM') return 'LOW';
  return 'MEDIUM';
}

export function mapEmail(raw: any): EmailItem {
  if (!raw || typeof raw !== 'object') return raw;
  // Déjà au format interface
  if (raw.folder && raw.id && !raw._id) return raw as EmailItem;
  return {
    id: String(raw._id || raw.id),
    sender: {
      name: raw.sender?.name || raw.sender?.email || 'Expéditeur inconnu',
      email: raw.sender?.email || '',
      phone: raw.sender?.phone || raw.extractedEntities?.phone,
    },
    subject: raw.subject || '(Sans objet)',
    body: raw.bodyText || raw.body || '',
    receivedAt: formatReceivedAt(raw.receivedAt || raw.createdAt),
    receivedAtISO: (() => { const d = new Date(raw.receivedAt || raw.createdAt); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; })(),
    isRead: ['SENT', 'VALIDATED_AND_SENT', 'DISMISSED'].includes(raw.status),
    intent: INTENT_MAP[raw.intent] || 'OTHER',
    priority: priorityFor(raw),
    status: raw.status || 'RECEIVED',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0,
    draftReply: raw.draftReply || raw.aiDraft || '',
    folder: folderFor(raw),
    scenario: raw.scenario,
    isRegisteredContact: raw.isRegisteredContact,
    detectedLanguage: raw.detectedLanguage,
    recipient: raw.recipient,
    extractedEntities: raw.extractedEntities,
    // Informations supplémentaires utiles à l'affichage
    ...(raw.replyStatus ? { replyStatus: raw.replyStatus } : {}),
    ...(raw.bookingDecision ? { bookingDecision: raw.bookingDecision } : {}),
    ...(raw.threadId ? { threadId: raw.threadId } : {}),
  } as EmailItem;
}

function minutesBetween(start?: string, end?: string): number {
  if (!start || !end) return 30;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1)) || 30;
}

export function mapAppointment(raw: any): AppointmentItem {
  if (!raw || typeof raw !== 'object') return raw;
  if (raw.patientName && raw.id && !raw._id) return raw as AppointmentItem;
  const start = raw.timeSlot?.start || raw.timeStart || '';
  const end = raw.timeSlot?.end || raw.timeEnd || '';
  const status = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(raw.status)
    ? raw.status
    : (raw.status === 'RESCHEDULED' || raw.status === 'REJECTED' ? 'CANCELLED' : 'SCHEDULED');
  return {
    id: String(raw._id || raw.id),
    patientName: raw.patient?.name || raw.patientName || 'Patient',
    patientEmail: raw.patient?.email || raw.patientEmail || '',
    patientPhone: raw.patient?.phone || raw.patientPhone || '',
    practitionerName: raw.doctorId?.name || raw.practitionerName || '',
    serviceName: raw.reason || raw.serviceName || 'Consultation',
    date: raw.date,
    timeStart: start,
    timeEnd: end,
    durationMinutes: minutesBetween(start, end),
    status,
    reminderSent24h: Boolean(raw.reminderSent24h),
    googleCalendarSynced: raw.synchronizationStatus === 'SYNCED' || Boolean(raw.googleEventId),
    notes: raw.notes,
    priceTND: raw.priceTND,
  };
}
