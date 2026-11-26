import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';

// Les sessions démo utilisent un clinicId fictif : on le rattache au cabinet réel en base.
const clinicCache = new Map();
async function resolveClinicId(clinicId) {
  try {
    if (Clinic.db?.readyState !== 1) return clinicId;
    if (clinicCache.has(String(clinicId))) return clinicCache.get(String(clinicId));
    let resolved = clinicId;
    const exists = /^[0-9a-f]{24}$/i.test(String(clinicId)) && await Clinic.exists({ _id: clinicId });
    if (!exists) {
      const first = await Clinic.findOne().select('_id').lean();
      if (first) resolved = String(first._id);
    }
    clinicCache.set(String(clinicId), resolved);
    return resolved;
  } catch {
    return clinicId;
  }
}

const withClinic = (handler) => async (req, res, next) => handler(req, res, async () => {
  req.clinicId = await resolveClinicId(req.clinicId);
  if (req.user) req.user.clinicId = req.clinicId;
  next();
});

const IS_PROD = process.env.NODE_ENV === 'production';
// Jetons « démo » : uniquement en développement (jamais en production)
const DEMO_TOKENS_ALLOWED = !IS_PROD && process.env.ALLOW_DEMO_TOKENS !== 'false';
export const JWT_SECRET = process.env.JWT_SECRET || (IS_PROD ? null : 'dev_only_jwt_secret_change_me');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET doit être défini en production.');
}

const DEMO_USER = {
  _id: '66f1234567890abcdef12346',
  name: 'Session démo',
  email: 'demo@medilawai.local',
  role: 'PRATICIEN',
  clinicId: '66f1234567890abcdef12345',
};

export const protect = withClinic(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, aucun jeton fourni' });
  }

  if (DEMO_TOKENS_ALLOWED && token.startsWith('demo_')) {
    req.user = { ...DEMO_USER };
    req.clinicId = DEMO_USER.clinicId;
    return next();
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: 'Session expirée ou invalide, veuillez vous reconnecter.' });
  }

  if (User.db?.readyState === 1) {
    try {
      req.user = await User.findById(decoded.id).select('-password');
    } catch {}
    if (!req.user || req.user.status === 'INACTIVE') {
      return res.status(401).json({ message: 'Compte introuvable ou désactivé.' });
    }
  } else {
    return res.status(503).json({ message: 'Base de données indisponible, réessayez dans un instant.' });
  }

  req.clinicId = req.user.clinicId ? String(req.user.clinicId) : null;
  next();
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès interdit : Le rôle ${req.user ? req.user.role : 'anonyme'} n'est pas autorisé pour cette ressource`
      });
    }
    next();
  };
};
