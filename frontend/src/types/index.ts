export type SectorType = 'MEDICAL' | 'LEGAL';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'PRATICIEN' | 'SECRETAIRE' | 'ADMIN' | 'SUPER_ADMIN';
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
  isRead: boolean;
  intent: 'APPOINTMENT' | 'PRICING' | 'ADMINISTRATIVE' | 'EMERGENCY' | 'SPAM' | 'GENERAL' | 'DOCUMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_VALIDATION' | 'VALIDATED_AND_SENT' | 'AUTO_PROCESSED' | 'ESCALATED_EMERGENCY' | 'DISMISSED';
  confidence: number;
  draftReply: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'urgent';
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

