import express from 'express';
import Clinic from '../models/Clinic.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/clinics/current - Récupère les données du cabinet de l'utilisateur
router.get('/current', protect, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Cabinet non trouvé' });
    }
    res.json(clinic);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/clinics/settings - Mise à jour des réglages IA et horaires
router.put('/settings', protect, authorize('ADMIN', 'PRATICIEN'), async (req, res) => {
  try {
    const { aiSettings, openingHours, pricing, specialty, phone } = req.body;
    const clinic = await Clinic.findById(req.clinicId);

    if (!clinic) {
      return res.status(404).json({ message: 'Cabinet non trouvé' });
    }

    if (aiSettings) clinic.aiSettings = { ...clinic.aiSettings, ...aiSettings };
    if (openingHours) clinic.openingHours = openingHours;
    if (pricing) clinic.pricing = pricing;
    if (specialty) clinic.specialty = specialty;
    if (phone) clinic.phone = phone;

    await clinic.save();

    await AuditLog.create({
      clinicId: req.clinicId,
      userId: req.user._id,
      action: 'CLINIC_SETTINGS_UPDATED',
      resource: 'Clinic',
      resourceId: clinic._id.toString(),
      details: { aiAutonomy: clinic.aiSettings?.autonomyLevel },
    });

    res.json({ message: 'Paramètres mis à jour', clinic });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
});

// GET /api/clinics/audit-logs - Consulter l'historique d'audit DevSecOps
router.get('/audit-logs', protect, authorize('ADMIN', 'PRATICIEN'), async (req, res) => {
  try {
    const logs = await AuditLog.find({ clinicId: req.clinicId }).sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des logs', error: error.message });
  }
});

export default router;
