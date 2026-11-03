import { create } from 'zustand';
import type { SectorType, UserProfile, EmailItem, AppointmentItem, ClientContact, N8nWorkflowInfo } from '../types';

interface AppStore {
  // Sector & Organization
  sector: SectorType;
  setSector: (s: SectorType) => void;
  organizationName: string;
  setOrganizationName: (name: string) => void;
  language: 'fr' | 'en' | 'ar';
  setLanguage: (lang: 'fr' | 'en' | 'ar') => void;

  // Active User
  currentUser: UserProfile;
  setCurrentUser: (u: UserProfile) => void;

  // Data Collections
  emails: EmailItem[];
  setEmails: (emails: EmailItem[]) => void;
  updateEmailStatus: (id: string, status: EmailItem['status'], draftReply?: string) => void;
  addEmail: (email: EmailItem) => void;

  appointments: AppointmentItem[];
  addAppointment: (apt: AppointmentItem) => void;
  cancelAppointment: (id: string) => void;
  confirmAppointment: (id: string) => void;

  contacts: ClientContact[];
  workflows: N8nWorkflowInfo[];

  // AI Autonomy Settings
  aiAutonomyLevel: 'HUMAN_IN_THE_LOOP' | 'SUGGEST_ONLY' | 'FULL_AUTONOMOUS';
  setAiAutonomyLevel: (lvl: 'HUMAN_IN_THE_LOOP' | 'SUGGEST_ONLY' | 'FULL_AUTONOMOUS') => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (thresh: number) => void;

  // Toast / Alerts
  activeToast: { title: string; message: string; type: 'success' | 'warning' | 'danger' | 'info' } | null;
  showToast: (toast: { title: string; message: string; type: 'success' | 'warning' | 'danger' | 'info' }) => void;
  hideToast: () => void;
}

const initialEmails: EmailItem[] = [
  {
    id: 'em-1',
    sender: { name: 'Amine Jaziri', email: 'amine.jaziri@gmail.com', phone: '+216 98 456 789' },
    subject: 'Demande de consultation cardiologie jeudi 10h',
    body: 'Bonjour Docteur, je ressens de légères palpitations lors de mes efforts physiques. J’aimerais savoir si vous avez une disponibilité ce jeudi vers 10h pour un contrôle de tension et ECG. Merci.',
    receivedAt: '2026-11-03 09:15',
    isRead: false,
    intent: 'APPOINTMENT',
    priority: 'HIGH',
    status: 'PENDING_VALIDATION',
    confidence: 0.96,
    draftReply: 'Bonjour M. Jaziri,\n\nNous avons bien reçu votre demande. Le Dr. Ben Salem est disponible ce jeudi à 10h00 pour votre consultation de cardiologie et ECG. Souhaitez-vous que nous confirmions ce créneau ?\n\nBien cordialement,\nLe secrétariat du Dr. Ben Salem',
    folder: 'inbox',
    extractedEntities: { requestedDate: 'jeudi', requestedTime: '10h', specialtyOrService: 'Cardiologie & ECG' }
  },
  {
    id: 'em-2',
    sender: { name: 'Mona Karray', email: 'm.karray@yahoo.fr', phone: '+216 22 111 222' },
    subject: 'URGENT : Fortes douleurs thoraciques et essoufflement',
    body: 'Docteur, depuis ce matin 6h j\'ai de violentes douleurs dans la poitrine irradiant vers le bras gauche avec un essoufflement marqué. Pouvez-vous me recevoir en urgence ?',
    receivedAt: '2026-11-03 08:30',
    isRead: false,
    intent: 'EMERGENCY',
    priority: 'CRITICAL',
    status: 'ESCALATED_EMERGENCY',
    confidence: 0.99,
    draftReply: '🚨 ALERTE URGENCE VITALE : Vos symptômes imposent une prise en charge hospitalière immédiate sans attendre. Veuillez composer sans tarder le SAMU (190 / 198) ou vous présenter immédiatement au service des urgences le plus proche.',
    folder: 'urgent',
    extractedEntities: { urgencyKeywords: ['douleurs thoraciques', 'bras gauche', 'essoufflement'] }
  },
  {
    id: 'em-3',
    sender: { name: 'Karim Bouazizi', email: 'karim.b@outlook.com' },
    subject: 'Tarifs consultation et prise en charge CNAM',
    body: 'Bonjour, pourriez-vous m\'indiquer vos tarifs pour une consultation avec échocardiographie doppler ainsi que les modalités de remboursement CNAM ? Merci d\'avance.',
    receivedAt: '2026-11-03 07:45',
    isRead: true,
    intent: 'PRICING',
    priority: 'MEDIUM',
    status: 'PENDING_VALIDATION',
    confidence: 0.93,
    draftReply: 'Bonjour M. Bouazizi,\n\nLa consultation spécialisée est fixée à 70 DT et l\'échocardiographie Doppler à 140 DT. Notre cabinet est conventionné CNAM (filière privée et remboursement AP1 sur feuille de soins). N\'hésitez pas pour toute question complémentaire.\n\nCordialement,\nCabinet Dr. Ben Salem',
    folder: 'inbox'
  },
  {
    id: 'em-4',
    sender: { name: 'Me. Selim Trabelsi', email: 's.trabelsi@avocats-tunis.tn', phone: '+216 71 888 999' },
    subject: 'Demande de consultation juridique - Droit des sociétés',
    body: 'Maître, nous préparons une augmentation de capital pour notre société et souhaitons obtenir votre avis juridique préalable ce vendredi à 14h30.',
    receivedAt: '2026-11-02 16:20',
    isRead: true,
    intent: 'APPOINTMENT',
    priority: 'HIGH',
    status: 'VALIDATED_AND_SENT',
    confidence: 0.95,
    draftReply: 'Maître Trabelsi, le créneau de vendredi 14h30 est validé. Nous préparerons la revue des statuts pour notre séance.',
    folder: 'sent',
    extractedEntities: { requestedDate: 'vendredi', requestedTime: '14h30', specialtyOrService: 'Droit des affaires' }
  }
];

const initialAppointments: AppointmentItem[] = [
  {
    id: 'apt-1',
    patientName: 'Sami Chaabane',
    patientEmail: 'sami.ch@gmail.com',
    patientPhone: '+216 98 456 789',
    practitionerName: 'Dr. Youssef Ben Salem',
    serviceName: 'Bilan cardiaque annuel',
    date: '2026-11-03',
    timeStart: '09:00',
    timeEnd: '09:30',
    durationMinutes: 30,
    status: 'CONFIRMED',
    reminderSent24h: true,
    googleCalendarSynced: true,
    priceTND: 70
  },
  {
    id: 'apt-2',
    patientName: 'Leila Trabelsi',
    patientEmail: 'leila.t@gnet.tn',
    patientPhone: '+216 22 334 455',
    practitionerName: 'Dr. Youssef Ben Salem',
    serviceName: 'Échocardiographie Doppler',
    date: '2026-11-03',
    timeStart: '10:00',
    timeEnd: '10:45',
    durationMinutes: 45,
    status: 'SCHEDULED',
    reminderSent24h: true,
    googleCalendarSynced: true,
    priceTND: 140
  },
  {
    id: 'apt-3',
    patientName: 'Kamel Dridi',
    patientEmail: 'k.dridi@topnet.tn',
    patientPhone: '+216 55 678 123',
    practitionerName: 'Dr. Youssef Ben Salem',
    serviceName: 'Consultation générale',
    date: '2026-11-03',
    timeStart: '11:15',
    timeEnd: '11:45',
    durationMinutes: 30,
    status: 'SCHEDULED',
    reminderSent24h: false,
    googleCalendarSynced: true,
    priceTND: 70
  },
  {
    id: 'apt-4',
    patientName: 'Sarra Ben Mahmoud',
    patientEmail: 'sarra.bm@yahoo.fr',
    patientPhone: '+216 29 444 555',
    practitionerName: 'Dr. Youssef Ben Salem',
    serviceName: 'Contrôle tensionnel',
    date: '2026-11-04',
    timeStart: '14:00',
    timeEnd: '14:30',
    durationMinutes: 30,
    status: 'SCHEDULED',
    reminderSent24h: false,
    googleCalendarSynced: true,
    priceTND: 70
  }
];

const initialContacts: ClientContact[] = [
  { id: 'c-1', name: 'Amine Jaziri', email: 'amine.jaziri@gmail.com', phone: '+216 98 456 789', identifier: 'MED-2026-089', category: 'Cardiologie', lastInteraction: 'Aujourd’hui', totalAppointments: 4, notes: 'Hypertension suivie, examen ECG régulier.' },
  { id: 'c-2', name: 'Mona Karray', email: 'm.karray@yahoo.fr', phone: '+216 22 111 222', identifier: 'MED-2026-102', category: 'Urgence SAMU', lastInteraction: 'Aujourd’hui', totalAppointments: 1, notes: 'Alerte 190 générée, antécédents cardiaques.' },
  { id: 'c-3', name: 'Karim Bouazizi', email: 'karim.b@outlook.com', phone: '+216 97 321 654', identifier: 'MED-2026-045', category: 'Convention CNAM', lastInteraction: 'Hier', totalAppointments: 2, notes: 'Dossier CNAM AP1 validé.' },
  { id: 'c-4', name: 'Sami Chaabane', email: 'sami.ch@gmail.com', phone: '+216 98 456 789', identifier: 'MED-2026-012', category: 'Bilan annuel', lastInteraction: 'Ce matin', totalAppointments: 6, notes: 'Patient régulier depuis 2024.' },
  { id: 'c-5', name: 'Me. Selim Trabelsi', email: 's.trabelsi@avocats-tunis.tn', phone: '+216 71 888 999', identifier: 'JUR-2026-008', category: 'Droit Sociétés', lastInteraction: 'Il y a 2 jours', totalAppointments: 3, notes: 'Cabinet d’affaires partenaire.' }
];

const initialWorkflows: N8nWorkflowInfo[] = [
  { id: 'wf-1', name: 'Ingestion & Tri Automatique E-mails', description: 'Surveillance Gmail/IMAP, classification NLP et routage prioritaire.', trigger: 'Gmail Polling / Webhook POST', status: 'ACTIVE', lastRun: 'Il y a 3 min', successRate: 99.4, totalRuns: 1420 },
  { id: 'wf-2', name: 'Rappels WhatsApp 24h Avant Rendez-vous', description: 'Cron matinal à 08h00, extraction des RDV du lendemain et messages WhatsApp.', trigger: 'Cron 08h00 (Africa/Tunis)', status: 'ACTIVE', lastRun: 'Aujourd’hui 08:00', successRate: 98.8, totalRuns: 890 },
  { id: 'wf-3', name: 'Synchronisation Google Calendar', description: 'Génération instantanée d’événement Calendar avec invitations participants.', trigger: 'Webhook Réservation', status: 'ACTIVE', lastRun: 'Il y a 14 min', successRate: 100, totalRuns: 650 },
  { id: 'wf-4', name: 'Escalade SAMU & Protection Civile', description: 'Alerte SMS immédiate au médecin de garde et consigne vitale 190.', trigger: 'Webhook Alerte Haute', status: 'ACTIVE', lastRun: 'Ce matin 08:30', successRate: 100, totalRuns: 45 }
];

export const useAppStore = create<AppStore>((set) => ({
  sector: 'MEDICAL',
  setSector: (sector) => set({ sector }),
  organizationName: 'Cabinet Médical Dr. Ben Salem',
  setOrganizationName: (organizationName) => set({ organizationName }),
  language: 'fr',
  setLanguage: (language) => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    set({ language });
  },

  currentUser: {
    id: 'u-1',
    name: 'Dr. Youssef Ben Salem',
    email: 'dr.bensalem@cabinet-ai.tn',
    role: 'PRATICIEN',
    organizationName: 'Cabinet Médical Dr. Ben Salem',
    sector: 'MEDICAL'
  },
  setCurrentUser: (currentUser) => set({ currentUser }),

  emails: initialEmails,
  setEmails: (emails) => set({ emails }),
  updateEmailStatus: (id, status, draftReply) => set((state) => ({
    emails: state.emails.map((e) => e.id === id ? { ...e, status, ...(draftReply ? { draftReply } : {}) } : e)
  })),
  addEmail: (email) => set((state) => ({ emails: [email, ...state.emails] })),

  appointments: initialAppointments,
  addAppointment: (apt) => set((state) => ({ appointments: [...state.appointments, apt] })),
  cancelAppointment: (id) => set((state) => ({
    appointments: state.appointments.map((a) => a.id === id ? { ...a, status: 'CANCELLED' } : a)
  })),
  confirmAppointment: (id) => set((state) => ({
    appointments: state.appointments.map((a) => a.id === id ? { ...a, status: 'CONFIRMED' } : a)
  })),

  contacts: initialContacts,
  workflows: initialWorkflows,

  aiAutonomyLevel: 'HUMAN_IN_THE_LOOP',
  setAiAutonomyLevel: (aiAutonomyLevel) => set({ aiAutonomyLevel }),
  confidenceThreshold: 0.88,
  setConfidenceThreshold: (confidenceThreshold) => set({ confidenceThreshold }),

  activeToast: null,
  showToast: (toast) => {
    set({ activeToast: toast });
    setTimeout(() => {
      set((s) => (s.activeToast?.title === toast.title ? { activeToast: null } : {}));
    }, 4000);
  },
  hideToast: () => set({ activeToast: null })
}));
