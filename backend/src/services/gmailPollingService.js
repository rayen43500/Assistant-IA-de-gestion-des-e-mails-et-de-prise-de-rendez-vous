/**
 * Gmail Polling Service - Surveillance automatique de la boîte Gmail du médecin
 * 
 * Ce service surveille en temps réel la boîte Gmail du Dr. Rayen B. (rayen.9b7@gmail.com)
 * et transmet automatiquement chaque nouveau message entrant à l'IA pour traitement.
 * 
 * Polling toutes les 30 secondes.
 * Stockage du lastHistoryId en fichier pour reprendre après redémarrage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decryptData } from './cryptoService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE_PATH = path.resolve('data/integrations_config.json');
const POLLING_STATE_FILE = path.resolve('data/gmail_polling_state.json');

const POLL_INTERVAL_MS = 30 * 1000; // 30 secondes
let pollingTimer = null;
let isPolling = false;

// ─── Helpers fichier ─────────────────────────────────────────────────────────

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    }
  } catch {}
  return {};
}

function readPollingState() {
  try {
    if (fs.existsSync(POLLING_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(POLLING_STATE_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function writePollingState(state) {
  try {
    const dir = path.dirname(POLLING_STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POLLING_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Gmail Polling] Erreur écriture état:', e.message);
  }
}

// ─── Gestion des tokens OAuth2 ───────────────────────────────────────────────

async function getValidAccessToken(googleCfg) {
  const { encryptedTokens, tokenExpiry } = googleCfg;
  if (!encryptedTokens) return null;

  let tokens;
  try {
    tokens = decryptData(encryptedTokens);
  } catch (e) {
    console.warn('[Gmail Polling] Impossible de déchiffrer les tokens:', e.message);
    return null;
  }

  // Si token encore valide (5 min de marge)
  if (tokens.expiryDate && Date.now() < tokens.expiryDate - 300000) {
    return tokens.accessToken;
  }

  // Rafraîchir le token avec le refresh_token
  if (!tokens.refreshToken) {
    console.warn('[Gmail Polling] Pas de refresh_token disponible.');
    return null;
  }

  try {
    const clientId = googleCfg.clientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      console.warn('[Gmail Polling] GOOGLE_CLIENT_SECRET manquant dans .env');
      return null;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Gmail Polling] Échec refresh token:', err);
      return null;
    }

    const newTokenData = await response.json();
    const newTokens = {
      ...tokens,
      accessToken: newTokenData.access_token,
      expiryDate: Date.now() + (newTokenData.expires_in * 1000),
    };

    // Sauvegarder les tokens rafraîchis
    const { encryptData } = await import('./cryptoService.js');
    const newEncrypted = encryptData(newTokens);
    const config = readConfig();
    config.googleWorkspace = {
      ...(config.googleWorkspace || {}),
      encryptedTokens: newEncrypted,
      tokenExpiry: newTokens.expiryDate,
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');

    console.log('[Gmail Polling] Token rafraîchi avec succès.');
    return newTokenData.access_token;
  } catch (e) {
    console.error('[Gmail Polling] Erreur refresh token:', e.message);
    return null;
  }
}

// ─── Lecture des nouveaux e-mails Gmail ──────────────────────────────────────

async function fetchNewEmails(accessToken, doctorEmail) {
  try {
    // Récupérer les messages non lus récents (moins de 2 minutes pour éviter les doublons)
    const twoMinutesAgo = Math.floor((Date.now() - 2 * 60 * 1000) / 1000);
    const query = `is:unread after:${twoMinutesAgo}`;
    
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      console.error('[Gmail Polling] Erreur liste messages:', err);
      return [];
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];
    
    // Lire l'état pour éviter les doublons
    const state = readPollingState();
    const processedIds = new Set(state.processedMessageIds || []);
    
    const newMessages = messages.filter(m => !processedIds.has(m.id));
    if (newMessages.length === 0) return [];

    console.log(`[Gmail Polling] ${newMessages.length} nouveau(x) e-mail(s) détecté(s) pour ${doctorEmail}`);

    const emails = [];
    for (const msg of newMessages) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgRes.ok) continue;
        
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
        
        const fromHeader = getHeader('From');
        const toHeader = getHeader('To');
        const subject = getHeader('Subject');
        const date = getHeader('Date');
        
        // Extraire email et nom de l'expéditeur
        const fromMatch = fromHeader.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/);
        const senderName = fromMatch?.[1]?.trim() || fromHeader;
        const senderEmail = fromMatch?.[2]?.trim() || fromHeader;
        
        // Extraire le corps du message
        let body = '';
        const getBody = (payload) => {
          if (payload.body?.data) {
            return Buffer.from(payload.body.data, 'base64').toString('utf8');
          }
          if (payload.parts) {
            for (const part of payload.parts) {
              if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                if (part.body?.data) {
                  return Buffer.from(part.body.data, 'base64').toString('utf8');
                }
              }
              if (part.parts) {
                const nested = getBody(part);
                if (nested) return nested;
              }
            }
          }
          return '';
        };
        
        body = getBody(msgData.payload).replace(/<[^>]+>/g, ' ').trim(); // Supprimer HTML tags
        
        emails.push({
          gmailMessageId: msg.id,
          senderName,
          senderEmail,
          toEmail: doctorEmail,
          subject,
          body,
          receivedAt: new Date(date || Date.now()).toISOString(),
        });
      } catch (e) {
        console.warn(`[Gmail Polling] Erreur lecture message ${msg.id}:`, e.message);
      }
    }

    // Marquer comme traités
    const updatedIds = [...processedIds, ...newMessages.map(m => m.id)].slice(-500); // Garder max 500
    writePollingState({ processedMessageIds: updatedIds, lastPollAt: new Date().toISOString() });

    return emails;
  } catch (e) {
    console.error('[Gmail Polling] Erreur fetchNewEmails:', e.message);
    return [];
  }
}

// ─── Envoyer les e-mails à l'IA pour traitement ──────────────────────────────

async function processEmailWithAI(email) {
  try {
    const response = await fetch('http://localhost:5000/api/emails/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: email.senderName,
        senderEmail: email.senderEmail,
        toEmail: email.toEmail,
        subject: email.subject,
        body: email.body,
        receivedAt: email.receivedAt,
        source: 'GMAIL_REAL',
        gmailMessageId: email.gmailMessageId,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Gmail Polling] ✅ E-mail de "${email.senderName} <${email.senderEmail}>" traité par l'IA. Intent: ${result.email?.intent || 'UNKNOWN'}`);
    } else {
      console.warn(`[Gmail Polling] ⚠️ Erreur traitement IA pour ${email.senderEmail}:`, response.status);
    }
  } catch (e) {
    console.error('[Gmail Polling] Erreur appel API emails/ingest:', e.message);
  }
}

// ─── Boucle principale de polling ────────────────────────────────────────────

async function pollGmail() {
  if (isPolling) return; // Éviter les chevauchements
  isPolling = true;
  
  try {
    const config = readConfig();
    const googleCfg = config.googleWorkspace || {};
    
    // Vérifier que la connexion OAuth est active
    if (googleCfg.connectionStatus !== 'CONNECTED' || !googleCfg.encryptedTokens) {
      // Mode silencieux : pas encore connecté
      return;
    }
    
    const doctorEmail = googleCfg.doctorEmail || 'rayen.9b7@gmail.com';
    const accessToken = await getValidAccessToken(googleCfg);
    
    if (!accessToken) {
      console.warn('[Gmail Polling] ⚠️ Impossible d\'obtenir un access token valide. Reconnexion OAuth requise.');
      return;
    }
    
    const newEmails = await fetchNewEmails(accessToken, doctorEmail);
    
    for (const email of newEmails) {
      await processEmailWithAI(email);
    }
    
    if (newEmails.length === 0) {
      // Log discret toutes les 5 minutes seulement
      const state = readPollingState();
      const lastLog = state.lastQuietLog || 0;
      if (Date.now() - lastLog > 5 * 60 * 1000) {
        console.log(`[Gmail Polling] 📭 Aucun nouveau message pour ${doctorEmail}`);
        writePollingState({ ...state, lastQuietLog: Date.now() });
      }
    }
  } catch (e) {
    console.error('[Gmail Polling] Erreur cycle polling:', e.message);
  } finally {
    isPolling = false;
  }
}

// ─── API publique ────────────────────────────────────────────────────────────

export function startGmailPolling() {
  if (pollingTimer) return; // Déjà démarré
  
  console.log(`[Gmail Polling] 🚀 Service démarré - surveillance toutes les ${POLL_INTERVAL_MS / 1000}s`);
  
  // Premier poll immédiat
  pollGmail();
  
  // Poll périodique
  pollingTimer = setInterval(pollGmail, POLL_INTERVAL_MS);
}

export function stopGmailPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    console.log('[Gmail Polling] ⏹ Service arrêté.');
  }
}

export function getPollingStatus() {
  const config = readConfig();
  const googleCfg = config.googleWorkspace || {};
  const state = readPollingState();
  
  return {
    active: pollingTimer !== null,
    connected: googleCfg.connectionStatus === 'CONNECTED' && !!googleCfg.encryptedTokens,
    doctorEmail: googleCfg.doctorEmail || 'rayen.9b7@gmail.com',
    lastPollAt: state.lastPollAt || null,
    processedCount: (state.processedMessageIds || []).length,
    intervalSeconds: POLL_INTERVAL_MS / 1000,
  };
}
