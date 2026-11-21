import axios from 'axios';
import type { EmailItem, AppointmentItem } from '../types';

// URL Backend : prend VITE_API_BASE_URL (https://stage-cqe9.onrender.com) avec fallback
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://stage-cqe9.onrender.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter automatiquement le token JWT si disponible
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('medilaw_jwt_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========================================================
// 0. AUTHENTIFICATION & ESPACE DE CONNEXION
// ========================================================

export const apiLogin = async (credentials: { email: string; password: string }) => {
  const response = await apiClient.post('/api/auth/login', credentials);
  if (response.data && response.data.token) {
    localStorage.setItem('medilaw_jwt_token', response.data.token);
  }
  return response.data;
};

export const apiRegister = async (userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  clinicName?: string;
  clinicType?: 'MEDICAL' | 'LEGAL';
}) => {
  const response = await apiClient.post('/api/auth/register', userData);
  if (response.data && response.data.token) {
    localStorage.setItem('medilaw_jwt_token', response.data.token);
  }
  return response.data;
};

export const apiGetCurrentUser = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

export const apiLogout = () => {
  localStorage.removeItem('medilaw_jwt_token');
};

// ========================================================
// 1. ENDPOINTS EMAILS
// ========================================================

export const apiFetchEmails = async (): Promise<EmailItem[]> => {
  const response = await apiClient.get('/api/emails');
  return response.data;
};

export const apiIngestEmail = async (emailPayload: {
  sender: { name: string; email: string; phone?: string };
  subject: string;
  body: string;
  clinicId?: string;
}): Promise<EmailItem> => {
  const response = await apiClient.post('/api/emails/ingest', {
    ...emailPayload,
    clinicId: emailPayload.clinicId || import.meta.env.VITE_DEFAULT_CLINIC_ID || '66f1234567890abcdef12345',
  });
  return response.data;
};

export const apiValidateEmail = async (
  emailId: string,
  payload: { draftReply?: string; intent?: string; sendNow?: boolean }
) => {
  const response = await apiClient.put(`/api/emails/${emailId}/validate`, payload);
  return response.data;
};

// ========================================================
// 2. ENDPOINTS RENDEZ-VOUS (APPOINTMENTS)
// ========================================================

export const apiFetchAppointments = async (date?: string): Promise<AppointmentItem[]> => {
  const url = date ? `/api/appointments?date=${date}` : '/api/appointments';
  const response = await apiClient.get(url);
  return response.data;
};

export const apiCheckSlotAvailability = async (payload: {
  date: string;
  startTime: string;
  practitionerId?: string;
}) => {
  const response = await apiClient.post('/api/appointments/check-availability', payload);
  return response.data;
};

export const apiCreateAppointment = async (aptData: Partial<AppointmentItem>) => {
  const response = await apiClient.post('/api/appointments', aptData);
  return response.data;
};

export const apiCancelAppointment = async (appointmentId: string) => {
  const response = await apiClient.put(`/api/appointments/${appointmentId}/cancel`);
  return response.data;
};

// ========================================================
// 3. ENDPOINTS IA & RAG
// ========================================================

export const apiCheckAiHealth = async () => {
  const response = await apiClient.get('/api/ai/health');
  return response.data;
};

export const apiTestClassify = async (subject: string, body: string) => {
  const response = await apiClient.post('/api/ai/test-classify', { subject, body });
  return response.data;
};

export const apiFetchDailySummary = async () => {
  const response = await apiClient.get('/api/ai/daily-summary');
  return response.data;
};

// ========================================================
// 4. HEALTH CHECK BACKEND
// ========================================================

export const apiCheckBackendHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// ========================================================
// 5. INTÉGRATIONS GOOGLE OAUTH MULTI-PRATICIEN
// ========================================================

export const apiGetGoogleConnectUrl = async () => {
  const response = await apiClient.get('/api/integrations/google/connect');
  return response.data;
};

export const apiGetGoogleStatus = async () => {
  const response = await apiClient.get('/api/integrations/google/status');
  return response.data;
};

export const apiDisconnectGoogle = async () => {
  const response = await apiClient.delete('/api/integrations/google/disconnect');
  return response.data;
};

export const apiGetWhatsAppStatus = async () => {
  const response = await apiClient.get('/api/integrations/whatsapp/status');
  return response.data;
};

export const apiConnectWhatsApp = async (data: { phoneNumber: string; metaAccountId?: string }) => {
  const response = await apiClient.post('/api/integrations/whatsapp/connect', data);
  return response.data;
};

export const apiDisconnectWhatsApp = async () => {
  const response = await apiClient.delete('/api/integrations/whatsapp/disconnect');
  return response.data;
};

export const apiGetGoogleWorkspaceConfig = async () => {
  const response = await apiClient.get('/api/integrations/google/config');
  return response.data;
};

export const apiSaveGoogleWorkspaceConfig = async (configData: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  gmailEnabled: boolean;
  calendarEnabled: boolean;
  doctorEmail?: string;
  doctorId?: string;
}) => {
  const response = await apiClient.post('/api/integrations/google/config', configData);
  return response.data;
};

export const apiGetWhatsAppConfig = async () => {
  const response = await apiClient.get('/api/integrations/whatsapp/config');
  return response.data;
};

export const apiSaveWhatsAppConfig = async (configData: {
  phoneNumber: string;
  metaAccessToken?: string;
  businessAccountId?: string;
  phoneNumberId?: string;
  enabled: boolean;
}) => {
  const response = await apiClient.post('/api/integrations/whatsapp/config', configData);
  return response.data;
};

export const apiGetPracticeDoctors = async () => {
  const response = await apiClient.get('/api/integrations/doctors');
  return response.data;
};

// ========================================================
// 6. DISPONIBILITÉS CENTRALISÉES & RÉSERVATION PUBLIQUE
// ========================================================

export const apiFetchDoctorAvailability = async (date: string, doctorId?: string) => {
  const url = doctorId 
    ? `/api/appointments/availability?date=${date}&doctorId=${doctorId}`
    : `/api/appointments/availability?date=${date}`;
  const response = await apiClient.get(url);
  return response.data;
};

export const apiFetchPublicDoctors = async () => {
  const response = await apiClient.get('/api/public/doctors');
  return response.data;
};

export const apiFetchPublicDoctorAvailability = async (doctorId: string, date: string) => {
  const response = await apiClient.get(`/api/public/doctors/${doctorId}/availability?date=${date}`);
  return response.data;
};

export const apiCreatePublicGuestBooking = async (bookingData: {
  doctorId: string;
  date: string;
  startTime: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason?: string;
  idempotencyKey?: string;
}) => {
  const response = await apiClient.post('/api/public/bookings', bookingData);
  return response.data;
};

export const apiGetPublicBookingByToken = async (token: string) => {
  const response = await apiClient.get(`/api/public/bookings/${token}`);
  return response.data;
};

export const apiCancelPublicBookingByToken = async (token: string) => {
  const response = await apiClient.post(`/api/public/bookings/${token}/cancel`);
  return response.data;
};

