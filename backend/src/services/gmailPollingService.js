/**
 * Gmail Polling Service — surveillance de la boîte centrale MediLawAI.
 *
 * Toutes les 30 s : lit les nouveaux e-mails non lus de la boîte de réception,
 * les transmet au moteur centralisé (identification praticien, IA, réservation)
 * qui répond automatiquement dans le même fil Gmail.
 *
 * Idempotence : identifiants Gmail traités conservés dans data/gmail_polling_state.json.
 */

import fs from 'fs';
import path from 'path';
import { getValidGmailAccessToken, readIntegrationsConfig, getCentralMailboxEmail } from './googleAuthService.js';
import { markGmailMessageAsRead } from './gmailSenderService.js';
import { processIncomingEmail } from './centralEmailRouter.js';

const POLLING_STATE_FILE = path.resolve('data/gmail_polling_state.json');
const POLL_INTERVAL_MS = Number(process.env.GMAIL_POLL_INTERVAL_MS) || 30 * 1000;
const SEARCH_QUERY = process.env.GMAIL_POLL_QUERY || 'in:inbox is:unread -from:me newer_than:3d';

let pollingTimer = null;
let isPolling = false;
let lastError = null;

function readPollingState() {
  try {
    if (fs.existsSync(POLLING_STATE_FILE)) return JSON.parse(fs.readFileSync(POLLING_STATE_FILE, 'utf8'));
  } catch {}
  return {};
}

function writePollingState(partial) {
  try {
    const state = { ...readPollingState(), ...partial };
    const dir = path.dirname(POLLING_STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POLLING_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Gmail Polling] Erreur écriture état:', e.message);
  }
}

function decodeBase64Url(data = '') {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function htmlToText(html = '') {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr)>/gi, '\n')
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/**
 * Extrait le corps texte (text/plain prioritaire, sinon text/html converti).
 */
export function extractBody(payload) {
  let plain = '';
  let html = '';
  const walk = (part) => {
    if (!part) return;
    if (part.mimeType === 'text/plain' && part.body?.data && !plain) plain = decodeBase64Url(part.body.data);
    else if (part.mimeType === 'text/html' && part.body?.data && !html) html = decodeBase64Url(part.body.data);
    (part.parts || []).forEach(walk);
  };
  walk(payload);
  if (!plain && !html && payload?.body?.data) plain = decodeBase64Url(payload.body.data);
  return { text: plain || htmlToText(html), html };
}

/**
 * Retire l'historique cité (« Le ... a écrit : », lignes « > ») pour n'analyser
 * que le nouveau message du patient.
 */
export function stripQuotedReply(text = '') {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  for (const line of lines) {
    if (/^\s*(le|on)\s.+(a écrit|a ecrit|wrote)\s*:?\s*$/i.test(line)) break;
    if (/^\s*-{2,}\s*(message d'origine|original message|forwarded message)/i.test(line)) break;
    if (/^\s*(de|from)\s*:\s*.+@/i.test(line) && out.length) break;
    if (/^\s*>/.test(line)) continue;
    out.push(line);
  }
  const result = out.join('\n').trim();
  return result || text.trim();
}

/**
 * « Nom <email> » → { name, email }. Analyse linéaire sans regex : l'ancienne expression
 * régulière était vulnérable au ReDoS (en-tête From forgé avec des milliers d'espaces).
 */
export function parseAddress(header = '') {
  const raw = String(header).slice(0, 1000);
  const lt = raw.lastIndexOf('<');
  const gt = lt === -1 ? -1 : raw.indexOf('>', lt);
  if (lt !== -1 && gt > lt && raw.slice(gt + 1).trim() === '') {
    let name = raw.slice(0, lt).trim();
    if (name.startsWith('"')) name = name.slice(1);
    if (name.endsWith('"')) name = name.slice(0, -1);
    return { name: name.trim(), email: raw.slice(lt + 1, gt).trim().toLowerCase() };
  }
  return { name: '', email: raw.trim().toLowerCase() };
}

async function gmailGet(url, accessToken) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Gmail API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function fetchNewEmails(accessToken) {
  const listData = await gmailGet(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(SEARCH_QUERY)}&maxResults=20`,
    accessToken
  );
  const messages = listData.messages || [];
  const state = readPollingState();
  const processedIds = new Set(state.processedMessageIds || []);
  const fresh = messages.filter(m => !processedIds.has(m.id)).reverse(); // plus ancien d'abord

  const mailbox = getCentralMailboxEmail();
  const emails = [];
  for (const msg of fresh) {
    try {
      const data = await gmailGet(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, accessToken);
      const headers = data.payload?.headers || [];
      const h = (name) => headers.find(x => x.name.toLowerCase() === name.toLowerCase())?.value || '';

      const from = parseAddress(h('From'));
      const autoSubmitted = h('Auto-Submitted');
      const precedence = h('Precedence').toLowerCase();
      const skip = from.email === mailbox
        || (autoSubmitted && autoSubmitted.toLowerCase() !== 'no')
        || ['bulk', 'list', 'junk'].includes(precedence)
        || Boolean(h('List-Unsubscribe'))
        || h('X-MediLawAI');

      if (skip) {
        emails.push({ gmailMessageId: msg.id, skip: true, reason: 'AUTOMATED_OR_SELF' });
        continue;
      }

      const { text, html } = extractBody(data.payload);
      emails.push({
        gmailMessageId: msg.id,
        threadId: data.threadId,
        rfcMessageId: h('Message-ID') || h('Message-Id'),
        references: h('References'),
        senderName: from.name,
        senderEmail: from.email,
        recipient: (parseAddress((h('Delivered-To') || h('To')).split(',')[0]).email) || mailbox,
        subject: h('Subject'),
        body: stripQuotedReply(text),
        bodyHtml: html,
        receivedAt: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : new Date().toISOString(),
      });
    } catch (e) {
      console.warn(`[Gmail Polling] Lecture message ${msg.id} impossible:`, e.message);
    }
  }
  return emails;
}

function markProcessed(id) {
  const state = readPollingState();
  const ids = [...(state.processedMessageIds || []), id].slice(-1000);
  writePollingState({ processedMessageIds: ids });
}

export async function pollGmailOnce() {
  if (isPolling) return { skipped: true };
  isPolling = true;
  const summary = { fetched: 0, processed: 0, replied: 0, skipped: 0 };
  try {
    const cfg = readIntegrationsConfig().googleWorkspace || {};
    if (!cfg.encryptedTokens) return { ...summary, connected: false };

    const accessToken = await getValidGmailAccessToken();
    if (!accessToken) {
      lastError = 'Access token indisponible : reconnectez Google OAuth.';
      console.warn(`[Gmail Polling] ⚠️ ${lastError}`);
      return { ...summary, connected: false, error: lastError };
    }

    const emails = await fetchNewEmails(accessToken);
    summary.fetched = emails.length;

    for (const email of emails) {
      if (email.skip) {
        markProcessed(email.gmailMessageId);
        summary.skipped++;
        continue;
      }
      try {
        const result = await processIncomingEmail({ ...email, autoSend: true });
        markProcessed(email.gmailMessageId);
        await markGmailMessageAsRead(email.gmailMessageId);
        summary.processed++;
        if (result.reply?.sent) summary.replied++;
        console.log(`[Gmail Polling] ✅ ${email.senderEmail} | "${email.subject}" → ${result.decision || result.reason} | réponse ${result.reply?.sent ? 'envoyée' : 'en brouillon (' + (result.reply?.reason || '-') + ')'}`);
      } catch (e) {
        // Non marqué comme traité : nouvel essai au prochain cycle
        console.error(`[Gmail Polling] Erreur traitement ${email.gmailMessageId}:`, e.message);
      }
    }

    lastError = null;
    writePollingState({ lastPollAt: new Date().toISOString(), lastSummary: summary });
    return { ...summary, connected: true };
  } catch (e) {
    lastError = e.message;
    console.error('[Gmail Polling] Erreur cycle:', e.message);
    return { ...summary, error: e.message };
  } finally {
    isPolling = false;
  }
}

export function startGmailPolling() {
  if (pollingTimer || process.env.GMAIL_POLLING_DISABLED === 'true') return;
  console.log(`[Gmail Polling] 🚀 Surveillance de la boîte centrale toutes les ${POLL_INTERVAL_MS / 1000}s`);
  setTimeout(pollGmailOnce, 3000); // laisser MongoDB se connecter
  pollingTimer = setInterval(pollGmailOnce, POLL_INTERVAL_MS);
}

export function stopGmailPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

export function getPollingStatus() {
  const cfg = readIntegrationsConfig().googleWorkspace || {};
  const state = readPollingState();
  return {
    active: pollingTimer !== null,
    connected: Boolean(cfg.encryptedTokens) && cfg.connectionStatus === 'CONNECTED',
    mailbox: getCentralMailboxEmail(),
    query: SEARCH_QUERY,
    lastPollAt: state.lastPollAt || null,
    lastSummary: state.lastSummary || null,
    processedCount: (state.processedMessageIds || []).length,
    intervalSeconds: POLL_INTERVAL_MS / 1000,
    lastError,
  };
}
