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
