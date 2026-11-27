import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import Doctor from '../models/Doctor.js';
import InternalSchedule from '../models/InternalSchedule.js';
import { protect, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, clinicName, clinicType } = req.body || {};
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email || !password) {
      return res.status(400).json({ message: 'Nom, e-mail et mot de passe sont obligatoires.' });
    }
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(email.trim())) {
      return res.status(400).json({ message: 'Adresse e-mail invalide.' });
    }
    if (password.length > 200) {
      return res.status(400).json({ message: 'Mot de passe trop long.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }
    // Inscription publique : seuls les rôles praticien et patient sont autorisés
    const safeRole = role === 'PATIENT' ? 'PATIENT' : 'PRATICIEN';

    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé' });
    }

    // Un praticien qui s'inscrit crée toujours son propre cabinet (jamais de rattachement
    // à un cabinet existant). Un patient est rattaché au cabinet public : il n'a accès
    // qu'à ses propres rendez-vous (voir practitionerScope).
    const clinic = safeRole === 'PATIENT'
      ? (await Clinic.findOne().sort({ createdAt: 1 })) || await Clinic.create({ name: 'Cabinet', type: 'MEDICAL' })
      : await Clinic.create({
        name: String(clinicName || `Cabinet de ${name}`).trim().slice(0, 150),
        type: clinicType === 'LEGAL' ? 'LEGAL' : 'MEDICAL',
      });

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password,
      role: safeRole,
      clinicId: clinic._id,
    });

    // Praticien : fiche + agenda pour recevoir des rendez-vous (e-mail, portail patient)
    if (safeRole === 'PRATICIEN') {
      const doctor = await Doctor.create({
        tenantId: clinic._id,
        userId: user._id,
        name: user.name,
        professionalEmail: user.email,
        profession: clinicType === 'LEGAL' ? 'AVOCAT' : 'MEDECIN',
        specialty: clinicType === 'LEGAL' ? 'Conseil juridique' : 'Médecine Générale',
        status: 'ACTIVE',
      });
      await InternalSchedule.create({ tenantId: clinic._id, doctorId: doctor._id }).catch(() => {});
    }

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        clinic: { _id: clinic._id, name: clinic.name, type: clinic.type },
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’inscription', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    // Types stricts : bloque les injections d'opérateurs MongoDB ({ "$ne": null }, { "$gt": "" })
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 200) {
      return res.status(400).json({ message: 'E-mail et mot de passe requis.' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).populate('clinicId');
    
    if (user && user.status === 'INACTIVE' && (await user.matchPassword(password))) {
      return res.status(403).json({ message: 'Ce compte est désactivé. Contactez l’administrateur.' });
    }
    if (user && (await user.matchPassword(password))) {
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinic: user.clinicId,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Identifiants invalides' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur d’authentification', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('clinicId').select('-password');
  if (!user) return res.status(401).json({ message: 'Compte introuvable.' });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    clinic: user.clinicId ? { _id: user.clinicId._id, name: user.clinicId.name, type: user.clinicId.type } : null,
  });
});

export default router;
