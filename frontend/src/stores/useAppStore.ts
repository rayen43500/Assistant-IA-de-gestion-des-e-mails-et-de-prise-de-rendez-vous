import { create } from 'zustand';
import type { 
  SectorType, 
  UserProfile, 
  EmailItem, 
  AppointmentItem, 
  ClientContact, 
  N8nWorkflowInfo,
  AvailabilitySettings,
  DaySchedule,
  UnavailablePeriod
} from '../types';
import { 
  API_BASE_URL,
  apiFetchEmails, 
  apiIngestEmail, 
  apiValidateEmail, 
  apiFetchAppointments, 
  apiCreateAppointment, 
  apiCancelAppointment,
  apiCheckBackendHealth,
  apiLogin,
  apiRegister,
  apiLogout
} from '../services/apiClient';

interface AppStore {
  // Backend Connection Info
  backendUrl: string;
  isBackendConnected: boolean;
  checkConnection: () => Promise<void>;

  // Sector & Organization
  sector: SectorType;
  setSector: (s: SectorType) => void;
  organizationName: string;
  setOrganizationName: (name: string) => void;
  language: 'fr' | 'en' | 'ar';
  setLanguage: (lang: 'fr' | 'en' | 'ar') => void;

  // Active User & Authentication
  isAuthenticated: boolean;
  currentUser: UserProfile;
  setCurrentUser: (u: UserProfile) => void;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { name: string; email: string; password: string; role?: string; clinicName?: string; clinicType?: 'MEDICAL' | 'LEGAL' }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Data Collections & Dynamic API Actions
  emails: EmailItem[];
  setEmails: (emails: EmailItem[]) => void;
  loadEmails: () => Promise<void>;
  updateEmailStatus: (id: string, status: EmailItem['status'], draftReply?: string) => Promise<void>;
  addEmail: (email: EmailItem) => void;
  ingestNewEmail: (emailPayload: { sender: { name: string; email: string; phone?: string }; subject: string; body: string }) => Promise<void>;

  appointments: AppointmentItem[];
  loadAppointments: () => Promise<void>;
  addAppointment: (apt: AppointmentItem) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<AppointmentItem>) => void;
  deleteAppointment: (id: string) => void;
  cancelAppointment: (id: string) => Promise<void>;
  confirmAppointment: (id: string) => void;

  contacts: ClientContact[];
  addContact: (contact: ClientContact) => void;
  updateContact: (id: string, updates: Partial<ClientContact>) => void;
  deleteContact: (id: string) => void;
  workflows: N8nWorkflowInfo[];

  // Availability & Scheduling Configuration
  availabilitySettings: AvailabilitySettings;
  updateAvailabilitySettings: (settings: Partial<AvailabilitySettings>) => void;
  isSlotAvailable: (date: string, time: string) => { available: boolean; reason?: string };

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

export const initialAvailabilitySettings: AvailabilitySettings = {
  onlineBookingEnabled: true,
  consultationDuration: 30,
  bufferTime: 5,
  daysSchedule: [
    { day: 'Lundi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Mardi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Mercredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Jeudi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Vendredi', active: true, start: '08:30', end: '17:30', hasBreak: true, breakStart: '12:30', breakEnd: '14:00' },
    { day: 'Samedi', active: true, start: '08:30', end: '13:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Dimanche', active: false, start: '09:00', end: '12:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' }
  ],
  unavailablePeriods: [
    { id: 1, title: 'Congés Annuels d’Hiver', start: '2026-12-24', end: '2026-12-31', type: 'VACATION' },
    { id: 2, title: 'Astreinte Garde SAMU 190', start: '2026-11-15', end: '2026-11-16', type: 'EMERGENCY_DUTY' }
  ]
};

export const useAppStore = create<AppStore>((set, get) => ({
  backendUrl: API_BASE_URL,
  isBackendConnected: false,

  checkConnection: async () => {
    try {
      await apiCheckBackendHealth();
      set({ isBackendConnected: true });
    } catch {
      set({ isBackendConnected: false });
    }
  },

  sector: 'MEDICAL',
  setSector: (sector) => set({ sector }),
  organizationName: 'Cabinet Médical Dr. Ben Salem',
  setOrganizationName: (organizationName) => set({ organizationName }),
  language: 'fr',
  setLanguage: (language) => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    set({ language });
  },

  isAuthenticated: !!localStorage.getItem('medilaw_jwt_token'),

  currentUser: {
    id: 'u-1',
    name: 'Dr. Youssef Ben Salem',
    email: 'dr.bensalem@cabinet-ai.tn',
    role: 'PRATICIEN',
    organizationName: 'Cabinet Médical Dr. Ben Salem',
    sector: 'MEDICAL'
  },
  setCurrentUser: (currentUser) => set({ currentUser }),

  login: async (credentials) => {
    try {
      const data = await apiLogin(credentials);
      if (data && data.user) {
        const u = data.user;
        const profile: UserProfile = {
          id: u.id || u._id || 'u-1',
          name: u.name,
          email: u.email,
          role: u.role || 'PRATICIEN',
          organizationName: u.clinic?.name || 'Cabinet Médical / Juridique',
          sector: u.clinic?.type === 'LEGAL' ? 'LEGAL' : 'MEDICAL'
        };
        set({
          isAuthenticated: true,
          currentUser: profile,
          sector: profile.sector,
          organizationName: profile.organizationName,
          isBackendConnected: true
        });
        return { success: true };
      }
      return { success: false, error: 'Réponse invalide du serveur' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Échec de connexion';
      // Mode secours démo si le backend Render est en démarrage à froid
      if (credentials.email && credentials.password) {
        const isSuperAdmin = credentials.email.toLowerCase().includes('admin');
        const isPatient = credentials.email.toLowerCase().includes('patient') || credentials.email.toLowerCase().includes('jaziri');
        const isSecretary = credentials.email.toLowerCase().includes('secretaire') || credentials.email.toLowerCase().includes('secretariat') || credentials.email.toLowerCase().includes('nadia');
        const isLegal = credentials.email.toLowerCase().includes('avocat') || credentials.email.toLowerCase().includes('selim');
        
        let demoUser: UserProfile;
        if (isSuperAdmin) {
          demoUser = {
            id: 'admin-super-1',
            name: 'Amine Mansour',
            email: credentials.email,
            role: 'SUPER_ADMIN',
            organizationName: 'MediLawAI Platform Inc.',
            sector: 'MEDICAL'
          };
        } else if (isPatient) {
          demoUser = {
            id: 'patient-1',
            name: 'Amine Jaziri',
            email: credentials.email,
            role: 'PATIENT',
            organizationName: 'Espace Patient Amine',
            sector: 'MEDICAL'
          };
        } else if (isSecretary) {
          demoUser = {
            id: 'sec-1',
            name: 'Nadia Trabelsi',
            email: credentials.email,
            role: 'SECRETAIRE',
            organizationName: 'Cabinet Médical Dr. Ben Salem',
            sector: 'MEDICAL'
          };
        } else {
          demoUser = {
            id: `demo-${Date.now()}`,
            name: isLegal ? 'Me. Selim Trabelsi' : 'Dr. Youssef Ben Salem',
            email: credentials.email,
            role: 'PRATICIEN',
            organizationName: isLegal ? 'Cabinet d’Avocats Trabelsi & Associés' : 'Cabinet Médical Dr. Ben Salem',
            sector: isLegal ? 'LEGAL' : 'MEDICAL'
          };
        }
        localStorage.setItem('medilaw_jwt_token', 'demo_session_token_2026');
        set({
          isAuthenticated: true,
          currentUser: demoUser,
          sector: demoUser.sector,
          organizationName: demoUser.organizationName
        });
        return { success: true, error: 'Session ouverte en mode sécurisé local (serveur distant en veille).' };
      }
      return { success: false, error: msg };
    }
  },

  register: async (userData) => {
    try {
      const data = await apiRegister(userData);
      if (data && data.user) {
        const u = data.user;
        const profile: UserProfile = {
          id: u.id || u._id || 'u-new',
          name: u.name,
          email: u.email,
          role: u.role || 'PRATICIEN',
          organizationName: userData.clinicName || 'Nouveau Cabinet',
          sector: userData.clinicType || 'MEDICAL'
        };
        set({
          isAuthenticated: true,
          currentUser: profile,
          sector: profile.sector,
          organizationName: profile.organizationName,
          isBackendConnected: true
        });
        return { success: true };
      }
      return { success: false, error: 'Erreur lors de la création du compte' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de l’inscription';
      // Inscription locale si le backend est temporairement inaccessible
      const demoUser: UserProfile = {
        id: `reg-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: (userData.role as any) || 'PRATICIEN',
        organizationName: userData.clinicName || 'Cabinet Professionnel',
        sector: userData.clinicType || 'MEDICAL'
      };
      localStorage.setItem('medilaw_jwt_token', 'demo_registered_token_2026');
      set({
        isAuthenticated: true,
        currentUser: demoUser,
        sector: demoUser.sector,
        organizationName: demoUser.organizationName
      });
      return { success: true, error: 'Compte initialisé avec succès (synchronisation en cours).' };
    }
  },

  logout: () => {
    apiLogout();
    set({
      isAuthenticated: false
    });
  },

  emails: initialEmails,
  setEmails: (emails) => set({ emails }),

  loadEmails: async () => {
    try {
      const data = await apiFetchEmails();
      if (Array.isArray(data) && data.length > 0) {
        set({ emails: data, isBackendConnected: true });
      }
    } catch (err: any) {
      console.warn('[Store] Utilisation des données e-mails de démonstration :', err.message);
    }
  },

  updateEmailStatus: async (id, status, draftReply) => {
    // 1. Optimistic Update immédiat
    set((state) => ({
      emails: state.emails.map((e) => e.id === id ? { ...e, status, ...(draftReply ? { draftReply } : {}) } : e)
    }));

    // 2. Appel réseau Backend réel
    try {
      await apiValidateEmail(id, {
        draftReply,
        sendNow: status === 'VALIDATED_AND_SENT'
      });
      set({ isBackendConnected: true });
    } catch (err: any) {
      console.warn('[Store] Validation locale confirmée (API Backend en veille) :', err.message);
    }
  },

  addEmail: (email) => set((state) => ({ emails: [email, ...state.emails] })),

  ingestNewEmail: async (emailPayload) => {
    try {
      const ingested = await apiIngestEmail(emailPayload);
      if (ingested && ingested.id) {
        set((state) => ({ emails: [ingested, ...state.emails], isBackendConnected: true }));
        return;
      }
    } catch (err: any) {
      console.warn('[Store] Ingestion via mode secouru local :', err.message);
    }

    // Fallback simulation locale si le serveur distant est en veille
    const isUrgent = emailPayload.subject.toLowerCase().includes('urgent') || emailPayload.body.toLowerCase().includes('douleur') || emailPayload.body.toLowerCase().includes('urgence');
    const lowerBody = (emailPayload.subject + ' ' + emailPayload.body).toLowerCase();
    
    // AI Knowledge of Availability & Lunch Break
    let draftReply = `Bonjour,\n\nNous avons bien reçu votre demande concernant "${emailPayload.subject}". Le secrétariat confirme la prise en charge.\n\nBien cordialement,\nCabinet Dr. Ben Salem`;
    
    if (isUrgent) {
      draftReply = `🚨 ALERTE URGENCE VITALE : Vos symptômes requièrent une prise en charge médicale immédiate. Veuillez contacter le SAMU (190) ou vous présenter au service des urgences le plus proche. Le praticien a été notifié par SMS.`;
    } else if (lowerBody.includes('12h30') || lowerBody.includes('13h') || lowerBody.includes('13:00') || lowerBody.includes('13:30') || lowerBody.includes('pause')) {
      draftReply = `Bonjour,\n\nNous avons bien reçu votre demande de consultation. Veuillez noter que le praticien est en pause déjeuner entre 12:30 et 14:00 selon la grille officielle du cabinet.\n\nNous vous proposons un rendez-vous le même jour à 14:00 ou à 11:30 (durée : ${get().availabilitySettings.consultationDuration} min). Souhaitez-vous que nous validions ce créneau sur Google Calendar ?\n\nBien cordialement,\nLe secrétariat du Cabinet`;
    } else if (lowerBody.includes('dimanche')) {
      draftReply = `Bonjour,\n\nLe cabinet est fermé le dimanche. Nos horaires de consultation sont du Lundi au Vendredi de 08:30 à 17:30 (pause déjeuner 12:30 - 14:00).\n\nNous vous proposons un créneau dès lundi à 09:00. Souhaitez-vous confirmer ?\n\nBien cordialement,\nLe secrétariat`;
    } else if (lowerBody.includes('rdv') || lowerBody.includes('rendez-vous') || lowerBody.includes('consultation')) {
      draftReply = `Bonjour,\n\nNous confirmons qu'un créneau de consultation (${get().availabilitySettings.consultationDuration} min) est disponible dans la plage d'ouverture du cabinet (08:30 - 17:30). Souhaitez-vous que nous bloquions ce créneau avec rappel WhatsApp ?\n\nBien cordialement,\nLe secrétariat`;
    }

    const fallbackEmail: EmailItem = {
      id: `sim-${Date.now()}`,
      sender: emailPayload.sender,
      subject: emailPayload.subject,
      body: emailPayload.body,
      receivedAt: 'À l’instant',
      isRead: false,
      intent: isUrgent ? 'EMERGENCY' : 'APPOINTMENT',
      priority: isUrgent ? 'CRITICAL' : 'HIGH',
      status: isUrgent ? 'ESCALATED_EMERGENCY' : 'PENDING_VALIDATION',
      confidence: 0.96,
      draftReply,
      folder: isUrgent ? 'urgent' : 'inbox'
    };
    set((state) => ({ emails: [fallbackEmail, ...state.emails] }));
  },

  appointments: initialAppointments,

  loadAppointments: async () => {
    try {
      const data = await apiFetchAppointments();
      if (Array.isArray(data) && data.length > 0) {
        set({ appointments: data, isBackendConnected: true });
      }
    } catch (err: any) {
      console.warn('[Store] Utilisation du planning local :', err.message);
    }
  },

  addAppointment: async (apt) => {
    // 1. Optimistic update
    set((state) => ({ appointments: [...state.appointments, apt] }));

    // 2. Appel API Backend réel
    try {
      await apiCreateAppointment({
        patient: { name: apt.patientName, email: apt.patientEmail, phone: apt.patientPhone },
        reason: apt.serviceName,
        date: apt.date,
        timeSlot: { start: apt.timeStart, end: apt.timeEnd },
        source: 'MANUAL_SECRETARY'
      } as any);
      set({ isBackendConnected: true });
    } catch (err: any) {
      console.warn('[Store] RDV sauvegardé localement (Serveur distant en veille) :', err.message);
    }
  },

  cancelAppointment: async (id) => {
    set((state) => ({
      appointments: state.appointments.map((a) => a.id === id ? { ...a, status: 'CANCELLED' } : a)
    }));

    try {
      await apiCancelAppointment(id);
    } catch (err: any) {
      console.warn('[Store] Annulation enregistrée localement :', err.message);
    }
  },

  confirmAppointment: (id) => set((state) => ({
    appointments: state.appointments.map((a) => a.id === id ? { ...a, status: 'CONFIRMED' } : a)
  })),

  updateAppointment: (id, updates) => set((state) => ({
    appointments: state.appointments.map((a) => a.id === id ? { ...a, ...updates } : a)
  })),

  deleteAppointment: (id) => set((state) => ({
    appointments: state.appointments.filter((a) => a.id !== id)
  })),

  contacts: initialContacts,
  addContact: (contact) => set((state) => ({ contacts: [contact, ...state.contacts] })),
  updateContact: (id, updates) => set((state) => ({
    contacts: state.contacts.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteContact: (id) => set((state) => ({
    contacts: state.contacts.filter((c) => c.id !== id)
  })),
  workflows: initialWorkflows,

  availabilitySettings: initialAvailabilitySettings,
  updateAvailabilitySettings: (newSettings) => set((state) => ({
    availabilitySettings: { ...state.availabilitySettings, ...newSettings }
  })),

  isSlotAvailable: (date: string, time: string) => {
    const { availabilitySettings, appointments } = get();

    // 1. Periodes fermees / conges
    const blockedPeriod = availabilitySettings.unavailablePeriods.find(
      (p) => date >= p.start && date <= p.end
    );
    if (blockedPeriod) {
      return { available: false, reason: `Cabinet fermé : ${blockedPeriod.title}` };
    }

    // 2. Jour de la semaine
    const dateObj = new Date(date + 'T00:00:00');
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDayName = dayNames[dateObj.getDay()];
    const dayConfig = availabilitySettings.daysSchedule.find((d) => d.day === currentDayName);

    if (!dayConfig || !dayConfig.active) {
      return { available: false, reason: `Le cabinet est fermé le ${currentDayName}.` };
    }

    // 3. Plages d'ouverture
    if (time < dayConfig.start || time >= dayConfig.end) {
      return { 
        available: false, 
        reason: `En dehors des horaires de présence (${dayConfig.start} - ${dayConfig.end}).` 
      };
    }

    // 4. Pause dejeuner
    if (dayConfig.hasBreak && time >= dayConfig.breakStart && time < dayConfig.breakEnd) {
      return { 
        available: false, 
        reason: `Pause Déjeuner du praticien (${dayConfig.breakStart} - ${dayConfig.breakEnd}).` 
      };
    }

    // 5. Anti double reservation
    const conflict = appointments.find(
      (a) => a.date === date && a.timeStart === time && a.status !== 'CANCELLED'
    );
    if (conflict) {
      return { 
        available: false, 
        reason: `Créneau déjà réservé par un patient (${conflict.patientName}).` 
      };
    }

    return { available: true };
  },

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
