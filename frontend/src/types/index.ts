export type SectorType = 'MEDICAL' | 'LEGAL';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'PRATICIEN' | 'ADMIN' | 'SUPER_ADMIN' | 'PATIENT';
  avatarUrl?: string;
  organizationName: string;
  sector: SectorType;
}

export interface EmailItem {
  id: string;
  sender: {
    name: string;
    email: string;
    phone?: string;
  };
  subject: string;
  body: string;
  receivedAt: string;
  /** Date brute (YYYY-MM-DDTHH:mm) pour les statistiques */
  receivedAtISO?: string;
  /** Réponse au patient : DRAFT (brouillon), SENT (envoyée), FAILED */
  replyStatus?: 'DRAFT' | 'SENT' | 'FAILED';
  /** Décision du moteur de RDV (DIRECT_CONFIRMATION, NEEDS_CLARIFICATION…) */
  bookingDecision?: string;
  threadId?: string;
  isRead: boolean;
  intent: 'APPOINTMENT' | 'PRICING' | 'ADMINISTRATIVE' | 'EMERGENCY' | 'SPAM' | 'GENERAL' | 'DOCUMENT' | 'CANCELLATION' | 'INFORMATION' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_VALIDATION' | 'VALIDATED_AND_SENT' | 'AUTO_PROCESSED' | 'ESCALATED_EMERGENCY' | 'DISMISSED' | 'RECEIVED' | 'CONTACT_IDENTIFIED' | 'EXTERNAL_CONTACT' | 'UNASSIGNED' | 'NEEDS_CLARIFICATION' | 'WAITING_FOR_REPLY' | 'PRACTITIONER_IDENTIFIED' | 'PROCESSING' | 'VALIDATED' | 'REJECTED' | 'SENT' | 'FAILED';
  confidence: number;
  draftReply: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'urgent' | 'unassigned';
  scenario?: number;
  isRegisteredContact?: boolean;
  detectedLanguage?: 'FR' | 'AR' | 'EN';
  recipient?: string;
  extractedEntities?: {
    requestedDate?: string;
    requestedTime?: string;
    specialtyOrService?: string;
    urgencyKeywords?: string[];
  };
}

export interface AppointmentItem {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  practitionerName: string;
  serviceName: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reminderSent24h: boolean;
  googleCalendarSynced: boolean;
  notes?: string;
  priceTND?: number;
}

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  identifier: string; // Dossier patient ou Réf client
  category: string;
  lastInteraction: string;
  totalAppointments: number;
  notes: string;
}

export interface N8nWorkflowInfo {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  lastRun: string;
  successRate: number;
  totalRuns: number;
}

export interface DaySchedule {
  day: string;
  active: boolean;
  start: string;
  end: string;
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
}

export interface UnavailablePeriod {
  id: string | number;
  title: string;
  start: string;
  end: string;
  type: 'VACATION' | 'EMERGENCY_DUTY' | 'CONGRESS' | 'OTHER';
}

export interface AvailabilitySettings {
  onlineBookingEnabled: boolean;
  consultationDuration: number; // 15, 30, 45, 60
  bufferTime: number; // 0, 5, 10, 15
  daysSchedule: DaySchedule[];
  unavailablePeriods: UnavailablePeriod[];
}


