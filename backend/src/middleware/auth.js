import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, aucun jeton fourni' });
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
