import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_cabinet_ai_2026', {
    expiresIn: '7d',
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, clinicName, clinicType } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé' });
    }

    let clinic;
    if (clinicName) {
      clinic = await Clinic.create({
        name: clinicName,
        type: clinicType || 'MEDICAL',
      });
    } else {
      clinic = await Clinic.findOne();
      if (!clinic) {
        clinic = await Clinic.create({
          name: 'Cabinet Médical Pilote Tunis',
          type: 'MEDICAL',
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'PRATICIEN',
      clinicId: clinic._id,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
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
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('clinicId');
    
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
  res.json(user);
});

export default router;
