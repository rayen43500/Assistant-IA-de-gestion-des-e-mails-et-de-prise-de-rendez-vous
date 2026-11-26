import Integration from '../models/Integration.js';
import Appointment from '../models/Appointment.js';
import { decryptData, encryptData } from './cryptoService.js';

/**
 * Récupère les tokens déchiffrés et rafraîchit le jeton d'accès si nécessaire
 */
async function getValidDoctorTokens(integration) {
  if (!integration || !integration.encryptedCredentialReference) {
    return null;
  }

  let tokens;
  try {
    tokens = decryptData(integration.encryptedCredentialReference, true);
  } catch (err) {
    console.error(`[GoogleCalendar] Erreur de déchiffrement des tokens pour intégration ${integration._id}:`, err.message);
    return null;
  }

  // Vérifier si le jeton est expiré et rafraîchir si refreshToken disponible
  const isExpired = tokens.expiryDate && Date.now() >= (tokens.expiryDate - 60000);
  if (isExpired && tokens.refreshToken) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json();
          tokens.accessToken = newTokens.access_token;
          tokens.expiryDate = Date.now() + (newTokens.expires_in * 1000);

          // Sauvegarder les nouveaux tokens chiffrés
          integration.encryptedCredentialReference = encryptData(tokens);
          integration.tokenExpiration = new Date(tokens.expiryDate);
          integration.connectionStatus = 'CONNECTED';
          await integration.save();
        }
      }
    } catch (refreshErr) {
      console.warn(`[GoogleCalendar] Échec du rafraîchissement automatique du token:`, refreshErr.message);
    }
  }

  return tokens;
}

/**
 * Interroge l'API Google Calendar FreeBusy pour un médecin donné à une date spécifique
 * @param {string} doctorId 
 * @param {string} dateStr Format YYYY-MM-DD
 * @returns {Promise<Array<{start: string, end: string}>>}
 */
export async function getDoctorGoogleBusySlots(doctorId, dateStr) {
  const integration = await Integration.findOne({
    doctorId,
    provider: 'GOOGLE',
    connectionStatus: 'CONNECTED',
  });

  if (!integration) {
    return []; // Pas d'intégration Google active pour ce praticien
  }

  const tokens = await getValidDoctorTokens(integration);
  if (!tokens || !tokens.accessToken) {
    return [];
  }

  const timeMin = `${dateStr}T00:00:00+01:00`; // Africa/Tunis (UTC+1, sans heure d'été)
  const timeMax = `${dateStr}T23:59:59+01:00`;

  try {
    const calendarId = integration.calendarId || 'primary';
    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        integration.connectionStatus = 'REVOKED';
        integration.lastError = { message: 'Jeton révoqué ou non autorisé', occurredAt: new Date(), code: 'UNAUTHORIZED' };
        await integration.save();
      }
      return [];
    }

    const data = await response.json();
    const busyList = data.calendars?.[calendarId]?.busy || [];

    // Convertir les timestamps ISO en HH:mm local (Africa/Tunis UTC+1)
    return busyList.map(item => {
      const startD = new Date(item.start);
      const endD = new Date(item.end);
      return {
        start: startD.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit' }),
        end: endD.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit' }),
      };
    });
  } catch (error) {
    console.error(`[GoogleCalendar] Erreur lors de l'appel FreeBusy:`, error.message);
    return [];
  }
}

/**
 * Synchronise un rendez-vous MediLawAI vers Google Calendar avec protection anti-boucle
 */
export async function syncAppointmentToGoogle(appointmentId) {
  const appointment = await Appointment.findById(appointmentId).populate('doctorId');
  if (!appointment || !appointment.doctorId) return null;

  const integration = await Integration.findOne({
    doctorId: appointment.doctorId._id,
    provider: 'GOOGLE',
    connectionStatus: 'CONNECTED',
  });

  if (!integration) {
    appointment.synchronizationStatus = 'DISABLED';
    await appointment.save();
    return null;
  }

  const tokens = await getValidDoctorTokens(integration);
  if (!tokens || !tokens.accessToken) {
    appointment.synchronizationStatus = 'FAILED';
    await appointment.save();
    return null;
  }

  const calendarId = integration.calendarId || 'primary';
  const startDateTime = `${appointment.date}T${appointment.timeSlot.start}:00+01:00`;
  const endDateTime = `${appointment.date}T${appointment.timeSlot.end}:00+01:00`;

  const eventPayload = {
    summary: `RDV MediLawAI : ${appointment.patient.name}`,
    description: `Motif : ${appointment.reason}\nPatient : ${appointment.patient.name} (${appointment.patient.phone})\nRéservé via MediLawAI.`,
    start: { dateTime: startDateTime, timeZone: 'Africa/Tunis' },
    end: { dateTime: endDateTime, timeZone: 'Africa/Tunis' },
    // Anti-loop protection: Tag privé identifiant MediLawAI
    extendedProperties: {
      private: {
        medilawai_appointment_id: String(appointment._id),
        medilawai_source: 'MEDILAWAI_HYBRID_ENGINE',
      },
    },
  };

  try {
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    let method = 'POST';

    if (appointment.googleEventId || appointment.googleCalendarEventId) {
      const eventId = appointment.googleEventId || appointment.googleCalendarEventId;
      url += `/${encodeURIComponent(eventId)}`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (res.ok) {
      const eventData = await res.json();
      appointment.googleEventId = eventData.id;
      appointment.googleCalendarEventId = eventData.id;
      appointment.synchronizationStatus = 'SYNCED';
      await appointment.save();
      return eventData;
    } else {
      appointment.synchronizationStatus = 'FAILED';
      await appointment.save();
      return null;
    }
  } catch (err) {
    console.error(`[GoogleCalendar] Erreur de synchronisation de l'événement:`, err.message);
    appointment.synchronizationStatus = 'FAILED';
    await appointment.save();
    return null;
  }
}
