/**
 * Service d'authentification Google centralisé (boîte de réception MediLawAI).
 *
 * Source unique de vérité pour :
 *  - les identifiants OAuth (Client ID / Client Secret / Redirect URI)
 *  - les jetons chiffrés de la boîte Gmail centrale (lecture + envoi)
 *  - le rafraîchissement automatique de l'access token
 *
 * Persistance : backend/data/integrations_config.json (fonctionne même sans MongoDB).
 */

import fs from 'fs';
import path from 'path';
import { encryptData, decryptData } from './cryptoService.js';

export const CONFIG_FILE_PATH = path.resolve(process.env.INTEGRATIONS_CONFIG_PATH || 'data/integrations_config.json');

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

export function readIntegrationsConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    }
  } catch (e) {
    console.warn('[GoogleAuth] Lecture config impossible:', e.message);
  }
  return {};
}

export function writeIntegrationsConfig(partial = {}) {
  const current = readIntegrationsConfig();
  const updated = {
    ...current,
    ...partial,
    googleWorkspace: {
      ...(current.googleWorkspace || {}),
      ...(partial.googleWorkspace || {}),
    },
  };
  const dir = path.dirname(CONFIG_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

/**
 * Identifiants OAuth : variables d'environnement prioritaires, puis fichier de config.
 */
export function getGoogleClientCredentials(req = null) {
  const cfg = readIntegrationsConfig().googleWorkspace || {};
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  if (!clientSecret && cfg.encryptedClientSecret) {
    try {
      clientSecret = decryptData(cfg.encryptedClientSecret);
    } catch (e) {
      console.warn('[GoogleAuth] Déchiffrement du client secret impossible:', e.message);
    }
  }
  const fallbackRedirect = req
    ? `${req.protocol}://${req.get('host')}/api/integrations/google/callback`
    : 'http://localhost:5000/api/integrations/google/callback';

  return {
    clientId: process.env.GOOGLE_CLIENT_ID || cfg.clientId || '',
    clientSecret: typeof clientSecret === 'string' ? clientSecret : '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || cfg.redirectUri || fallbackRedirect,
  };
}

/**
 * Adresse de la boîte centrale connectée (celle qui reçoit les demandes des patients).
 */
export function getCentralMailboxEmail() {
  const cfg = readIntegrationsConfig().googleWorkspace || {};
  return (process.env.CENTRAL_INBOX_EMAIL || cfg.doctorEmail || 'contact@medilawai.com').toLowerCase().trim();
}

/**
 * Toutes les adresses considérées comme « boîte centrale » (aucun praticien ne peut
 * être déduit du simple fait que le patient a écrit à cette adresse).
 */
export function getCentralMailboxAddresses() {
  const set = new Set(['contact@medilawai.com']);
  set.add(getCentralMailboxEmail());
  for (const extra of (process.env.CENTRAL_INBOX_ALIASES || '').split(',')) {
    if (extra.trim()) set.add(extra.trim().toLowerCase());
  }
  return set;
}

export function hasStoredGmailTokens() {
  const cfg = readIntegrationsConfig().googleWorkspace || {};
  return Boolean(cfg.encryptedTokens);
}

export function storeGmailTokens({ accessToken, refreshToken, expiresIn, scope, accountEmail }) {
  const cfg = readIntegrationsConfig().googleWorkspace || {};
  let previous = {};
  if (cfg.encryptedTokens) {
    try { previous = decryptData(cfg.encryptedTokens, true) || {}; } catch {}
  }
  const tokens = {
    accessToken,
    // Google ne renvoie le refresh_token qu'au premier consentement : on conserve l'ancien.
    refreshToken: refreshToken || previous.refreshToken,
    expiryDate: Date.now() + (Number(expiresIn) || 3600) * 1000,
    scope: scope || previous.scope || '',
  };
  writeIntegrationsConfig({
    googleWorkspace: {
      doctorEmail: accountEmail || cfg.doctorEmail,
      connectionStatus: 'CONNECTED',
      isConfigured: true,
      encryptedTokens: encryptData(tokens),
      tokenExpiry: tokens.expiryDate,
      grantedScopes: tokens.scope ? tokens.scope.split(' ') : [],
      lastSyncAt: new Date().toISOString(),
    },
  });
  return tokens;
}

export function clearGmailTokens() {
  writeIntegrationsConfig({
    googleWorkspace: {
      encryptedTokens: null,
      tokenExpiry: null,
      connectionStatus: 'DISCONNECTED',
    },
  });
}

/**
 * Retourne un access token valide (rafraîchi si nécessaire) ou null.
 */
export async function getValidGmailAccessToken() {
  const cfg = readIntegrationsConfig().googleWorkspace || {};
  if (!cfg.encryptedTokens) return null;

  let tokens;
  try {
    tokens = decryptData(cfg.encryptedTokens, true);
  } catch (e) {
    console.warn('[GoogleAuth] Jetons illisibles (clé ENCRYPTION_MASTER_KEY modifiée ?):', e.message);
    return null;
  }
  if (!tokens?.accessToken) return null;

  if (tokens.expiryDate && Date.now() < tokens.expiryDate - 5 * 60 * 1000) {
    return tokens.accessToken;
  }
  if (!tokens.refreshToken) {
    console.warn('[GoogleAuth] Access token expiré et aucun refresh_token. Reconnectez Google OAuth.');
    return null;
  }

  const { clientId, clientSecret } = getGoogleClientCredentials();
  if (!clientId || !clientSecret) {
    console.warn('[GoogleAuth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants : rafraîchissement impossible.');
    return null;
  }

  try {
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
      const errText = await response.text();
      console.error('[GoogleAuth] Échec du rafraîchissement du jeton:', errText);
      if (/invalid_grant/.test(errText)) {
        writeIntegrationsConfig({ googleWorkspace: { connectionStatus: 'REVOKED' } });
      }
      return null;
    }
    const data = await response.json();
    storeGmailTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
      accountEmail: cfg.doctorEmail,
    });
    return data.access_token;
  } catch (e) {
    console.error('[GoogleAuth] Erreur réseau lors du rafraîchissement:', e.message);
    return null;
  }
}
