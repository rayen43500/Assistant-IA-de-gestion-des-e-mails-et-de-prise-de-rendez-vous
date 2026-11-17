import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Obtenir la clé secrète de chiffrement depuis les variables d'environnement
 * ou fallback déterministe sécurisé pour l'environnement de développement.
 */
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_MASTER_KEY || 'medilawai_master_encryption_key_32bytes_sec!';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Chiffre une chaîne de caractères ou un objet JSON (ex: tokens Google OAuth)
 * @param {string|object} data Données à chiffrer
 * @returns {string} Données chiffrées au format iv:authTag:encryptedHex
 */
export function encryptData(data) {
  if (!data) return null;
  const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Déchiffre une chaîne chiffrée au format iv:authTag:encryptedHex
 * @param {string} encryptedString Chaîne chiffrée
 * @param {boolean} parseJson Si vrai, parse la chaîne déchiffrée en JSON
 * @returns {string|object|null} Données en clair
 */
export function decryptData(encryptedString, parseJson = false) {
  if (!encryptedString) return null;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Format de données chiffrées invalide');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  if (parseJson) {
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }

  return decrypted;
}
