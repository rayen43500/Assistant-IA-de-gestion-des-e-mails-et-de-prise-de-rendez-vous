import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, aucun jeton fourni' });
  }

  // Support transparent des jetons de session démo / développement local
  if (token.startsWith('demo_') || token.includes('demo')) {
    try {
      let demoClinic = await Clinic.findOne({ name: /Cabinet.*Ben Salem/i });
      if (!demoClinic) {
        demoClinic = await Clinic.findOne() || await Clinic.create({
          name: 'Cabinet Médical Dr. Ben Salem',
          type: 'MEDICAL',
          contactEmail: 'contact@cabinet-bensalem.tn',
          subscriptionPlan: 'ENTERPRISE'
        });
      }

      let demoUser = await User.findOne({ email: /bensalem|rayen/i });
      if (!demoUser) {
        demoUser = await User.findOne({ role: 'PRATICIEN' }) || await User.create({
          name: 'Dr. Youssef Ben Salem',
          email: 'dr.bensalem@cabinet-ai.tn',
          password: 'Password123!',
          role: 'PRATICIEN',
          clinicId: demoClinic._id
        });
      }

      req.user = demoUser;
      req.clinicId = demoUser.clinicId || demoClinic._id;
      return next();
    } catch (demoErr) {
      console.warn('Erreur résolution session demo:', demoErr.message);
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_cabinet_ai_2026');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }
    // Injecter clinicId pour l'isolation multi-tenant
    req.clinicId = req.user.clinicId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Jeton invalide ou expiré', error: error.message });
  }
};

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
