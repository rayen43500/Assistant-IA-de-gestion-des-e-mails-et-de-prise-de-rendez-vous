import crypto from 'crypto';

/**
 * Protège les routes appelées par n8n / services internes (ingestion, rappels, synchro agenda).
 *
 * Si INTERNAL_API_KEY est défini, l'en-tête `x-internal-key` doit correspondre.
 * En production, INTERNAL_API_KEY est obligatoire (sinon 503) : ces routes déclenchent
 * des envois d'e-mails et des réservations.
 */
export function internalOnly(req, res, next) {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ message: 'INTERNAL_API_KEY non configurée sur le serveur.' });
    }
    return next(); // développement local
  }
  const given = String(req.headers['x-internal-key'] || '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Clé interne invalide.' });
  }
  next();
}

/**
 * Accès autorisé soit par la clé interne (n8n), soit par un utilisateur connecté.
 */
export async function internalOrUser(req, res, next) {
  const expected = process.env.INTERNAL_API_KEY;
  if (expected && req.headers['x-internal-key']) return internalOnly(req, res, next);
  if (!expected && process.env.NODE_ENV !== 'production' && !req.headers.authorization) return next();
  const { protect } = await import('./auth.js');
  return protect(req, res, next);
}
