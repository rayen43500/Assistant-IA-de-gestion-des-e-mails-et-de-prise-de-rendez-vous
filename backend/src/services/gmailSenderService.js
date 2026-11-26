/**
 * Envoi réel des e-mails via l'API Gmail de la boîte centrale MediLawAI.
 *
 * - Répond dans le même fil Gmail (threadId + In-Reply-To + References)
 *   afin que le patient voie une conversation continue.
 * - Encodage UTF-8 complet (sujet RFC 2047 + corps base64).
 * - Mode « dry-run » automatique si Gmail n'est pas connecté (aucune exception).
 */

import { getValidGmailAccessToken, getCentralMailboxEmail } from './googleAuthService.js';

function encodeHeaderUtf8(value = '') {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function sanitizeHeader(value = '') {
  return String(value).replace(/[\r\n]+/g, ' ').trim();
}

function toBase64Url(str) {
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildReplySubject(subject = '') {
  const clean = sanitizeHeader(subject) || 'Votre demande de rendez-vous';
  return /^(re|tr|fwd?)\s*:/i.test(clean) ? clean : `Re: ${clean}`;
}

/**
 * Construit le message MIME brut (exporté pour les tests).
 */
export function buildMimeMessage({ from, to, subject, body, inReplyTo, references }) {
  const headers = [
    `From: ${encodeHeaderUtf8('Secrétariat MediLawAI')} <${sanitizeHeader(from)}>`,
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${encodeHeaderUtf8(sanitizeHeader(subject))}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-replied',
    'X-MediLawAI: auto-reply',
  ];
  if (inReplyTo) headers.push(`In-Reply-To: ${sanitizeHeader(inReplyTo)}`);
  if (references || inReplyTo) headers.push(`References: ${sanitizeHeader([references, inReplyTo].filter(Boolean).join(' '))}`);

  const encodedBody = Buffer.from(String(body || ''), 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
  return `${headers.join('\r\n')}\r\n\r\n${encodedBody}`;
}

/**
 * Envoie un e-mail. Retourne { sent, messageId, threadId } ou { sent:false, reason }.
 */
export async function sendGmailMessage({ to, subject, body, threadId = null, inReplyTo = null, references = null }) {
  if (!to || !/@/.test(to)) {
    return { sent: false, reason: 'INVALID_RECIPIENT' };
  }
  if (process.env.EMAIL_SENDING_DISABLED === 'true') {
    console.log(`[GmailSender] (désactivé) E-mail non envoyé à ${to} : "${subject}"`);
    return { sent: false, reason: 'SENDING_DISABLED' };
  }

  const accessToken = await getValidGmailAccessToken();
  if (!accessToken) {
    console.warn(`[GmailSender] Gmail non connecté : réponse à ${to} conservée en brouillon.`);
    return { sent: false, reason: 'GMAIL_NOT_CONNECTED' };
  }

  const raw = toBase64Url(buildMimeMessage({
    from: getCentralMailboxEmail(),
    to,
    subject,
    body,
    inReplyTo,
    references,
  }));

  const payload = { raw };
  // Un threadId Gmail est hexadécimal ; on ignore les identifiants internes ("thread-...")
  if (threadId && /^[0-9a-f]{10,}$/i.test(threadId)) payload.threadId = threadId;

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[GmailSender] Échec envoi à ${to} (${res.status}):`, errText.slice(0, 300));
      return { sent: false, reason: `GMAIL_API_${res.status}`, error: errText.slice(0, 300) };
    }
    const data = await res.json();
    console.log(`[GmailSender] ✅ E-mail envoyé à ${to} : "${subject}"`);
    return { sent: true, messageId: data.id, threadId: data.threadId };
  } catch (e) {
    console.error('[GmailSender] Erreur réseau:', e.message);
    return { sent: false, reason: 'NETWORK_ERROR', error: e.message };
  }
}

/**
 * Marque un message Gmail comme lu (nécessite le scope gmail.modify, sinon ignoré).
 */
export async function markGmailMessageAsRead(gmailMessageId) {
  if (!gmailMessageId) return false;
  const accessToken = await getValidGmailAccessToken();
  if (!accessToken) return false;
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}/modify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
