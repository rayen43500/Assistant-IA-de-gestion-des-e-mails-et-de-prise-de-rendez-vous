/**
 * Notification des événements métier vers n8n (webhooks de production).
 *
 * Le backend reste la source de vérité (réservation, envoi des e-mails) ;
 * n8n orchestre les actions annexes : alertes urgence, synchro agenda, notifications.
 *
 * Variables :
 *   N8N_WEBHOOK_BASE_URL  ex: http://localhost:5678/webhook  (docker: http://n8n:5678/webhook)
 *   N8N_NOTIFY_DISABLED   "true" pour couper les notifications (tests)
 */

const DEFAULT_BASE = 'http://localhost:5678/webhook';

export const N8N_EVENTS = {
  EMAIL_PROCESSED: 'medilawai-email-processed',
  APPOINTMENT_BOOKED: 'sync-calendar-event',
  EMERGENCY: 'emergency-alert',
};

export async function notifyN8n(path, payload = {}) {
  if (process.env.N8N_NOTIFY_DISABLED === 'true' || process.env.NODE_ENV === 'test') {
    return { notified: false, reason: 'DISABLED' };
  }
  const base = (process.env.N8N_WEBHOOK_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${base}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: path, emittedAt: new Date().toISOString(), ...payload }),
      signal: controller.signal,
    });
    if (!res.ok) {
      // 404 = workflow n8n non activé : non bloquant
      console.warn(`[n8n] Webhook "${path}" a répondu ${res.status} (workflow actif ?)`);
      return { notified: false, status: res.status };
    }
    return { notified: true };
  } catch (e) {
    console.warn(`[n8n] Webhook "${path}" injoignable : ${e.message}`);
    return { notified: false, reason: e.message };
  } finally {
    clearTimeout(timer);
  }
}
