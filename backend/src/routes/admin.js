import express from 'express';
import mongoose from 'mongoose';
import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Email from '../models/Email.js';
import Contact from '../models/Contact.js';
import AuditLog from '../models/AuditLog.js';
import InternalSchedule from '../models/InternalSchedule.js';
import { protect, authorize } from '../middleware/auth.js';
import { checkHealthAI } from '../services/aiClient.js';
import { getPollingStatus } from '../services/gmailPollingService.js';

/**
 * Console d'administration (données réelles uniquement).
 * SUPER_ADMIN : toute la plateforme. ADMIN : son cabinet.
 */
const router = express.Router();
router.use(protect, authorize('SUPER_ADMIN', 'ADMIN'));

const isSuper = (req) => req.user?.role === 'SUPER_ADMIN';
const clinicFilter = (req, field = 'clinicId') => (isSuper(req) ? {} : { [field]: req.clinicId });
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function n8nReachable() {
  const base = (process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook').replace(/\/webhook\/?$/, '');
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`${base}/healthz`, { signal: controller.signal });
    return { up: res.ok, url: base };
  } catch {
    return { up: false, url: base };
  } finally {
    clearTimeout(t);
  }
}

// État des services externes mis en cache 30 s : le tableau de bord ne doit pas
// attendre un service en panne à chaque affichage (performance, §6.2)
const HEALTH_TTL_MS = 30_000;
let healthCache = { at: 0, value: null };
let healthRefresh = null;
function refreshHealth() {
  healthRefresh ||= Promise.all([checkHealthAI(), n8nReachable()])
    .then(([ai, n8n]) => { healthCache = { at: Date.now(), value: { ai, n8n } }; return healthCache.value; })
    .finally(() => { healthRefresh = null; });
  return healthRefresh;
}
async function servicesHealth() {
  if (!healthCache.value) return refreshHealth(); // tout premier appel
  if (Date.now() - healthCache.at > HEALTH_TTL_MS) refreshHealth().catch(() => {}); // rafraîchi en arrière-plan
  return healthCache.value;
}
refreshHealth().catch(() => {}); // pré-chargement au démarrage du serveur

// ─── Vue d'ensemble ──────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const today = isoDay(now);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const cf = clinicFilter(req);
    const tf = clinicFilter(req, 'tenantId');

    const [clinics, doctorsActive, doctorsTotal, usersByRole, appointmentsTotal, upcoming, todayCount, cancelled,
      emailsTotal, emails7d, emergencies, pending, replied, autoBooked, clarifications, contacts, health] = await Promise.all([
      isSuper(req) ? Clinic.countDocuments() : Clinic.countDocuments({ _id: req.clinicId }),
      Doctor.countDocuments({ ...tf, status: 'ACTIVE' }),
      Doctor.countDocuments(tf),
      User.aggregate([{ $match: isSuper(req) ? {} : { clinicId: new mongoose.Types.ObjectId(String(req.clinicId)) } }, { $group: { _id: '$role', n: { $sum: 1 } } }]),
      Appointment.countDocuments(cf),
      Appointment.countDocuments({ ...cf, date: { $gte: today }, status: { $in: ['SCHEDULED', 'CONFIRMED'] } }),
      Appointment.countDocuments({ ...cf, date: today, status: { $in: ['SCHEDULED', 'CONFIRMED'] } }),
      Appointment.countDocuments({ ...cf, status: 'CANCELLED' }),
      Email.countDocuments(cf),
      Email.countDocuments({ ...cf, receivedAt: { $gte: weekAgo } }),
      Email.countDocuments({ ...cf, intent: 'EMERGENCY' }),
      Email.countDocuments({ ...cf, status: 'PENDING_VALIDATION' }),
      Email.countDocuments({ ...cf, replyStatus: 'SENT' }),
      Email.countDocuments({ ...cf, bookingDecision: { $in: ['DIRECT_CONFIRMATION', 'RESCHEDULED'] } }),
      Email.countDocuments({ ...cf, bookingDecision: 'NEEDS_CLARIFICATION' }),
      Contact.countDocuments(isSuper(req) ? {} : { tenantId: req.clinicId }),
      servicesHealth(),
    ]);
    const { ai, n8n } = health;

    // Activité des 7 derniers jours
    const days = Array.from({ length: 7 }, (_, i) => isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i)));
    const [emailsPerDay, aptsPerDay] = await Promise.all([
      Email.aggregate([
        { $match: { ...(isSuper(req) ? {} : { clinicId: new mongoose.Types.ObjectId(String(req.clinicId)) }), receivedAt: { $gte: new Date(`${days[0]}T00:00:00`) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt', timezone: process.env.CABINET_TIMEZONE || 'Africa/Tunis' } }, n: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $match: { ...(isSuper(req) ? {} : { clinicId: new mongoose.Types.ObjectId(String(req.clinicId)) }), createdAt: { $gte: new Date(`${days[0]}T00:00:00`) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: process.env.CABINET_TIMEZONE || 'Africa/Tunis' } }, n: { $sum: 1 } } },
      ]),
    ]);
    const em = Object.fromEntries(emailsPerDay.map(x => [x._id, x.n]));
    const ap = Object.fromEntries(aptsPerDay.map(x => [x._id, x.n]));

    const roles = Object.fromEntries(usersByRole.map(r => [r._id, r.n]));
    const polling = getPollingStatus();

    res.json({
      scope: isSuper(req) ? 'PLATFORM' : 'CLINIC',
      clinics,
      doctors: { active: doctorsActive, total: doctorsTotal },
      users: { total: Object.values(roles).reduce((a, b) => a + b, 0), byRole: roles },
      patients: contacts,
      appointments: { total: appointmentsTotal, upcoming, today: todayCount, cancelled },
      emails: { total: emailsTotal, last7Days: emails7d, emergencies, pendingValidation: pending, replied, autoBooked, clarifications },
      activity: days.map(d => ({ date: d, emails: em[d] || 0, appointments: ap[d] || 0 })),
      services: {
        backend: { up: true, uptimeSeconds: Math.round(process.uptime()), environment: process.env.NODE_ENV || 'development' },
        database: { up: mongoose.connection.readyState === 1 },
        ai: { up: ai?.status !== 'DEGRADED', detail: ai?.error || null },
        gmail: { up: polling.connected, mailbox: polling.mailbox, lastPollAt: polling.lastPollAt, lastError: polling.lastError },
        n8n,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de chargement de la vue d’ensemble', error: error.message });
  }
});

// ─── Cabinets ────────────────────────────────────────────────────────────────
router.get('/clinics', async (req, res) => {
  try {
    const clinics = await Clinic.find(isSuper(req) ? {} : { _id: req.clinicId }).select('name type specialty phone email address createdAt').lean();
    const ids = clinics.map(c => c._id);
    const [docs, users, apts, emails] = await Promise.all([
      Doctor.aggregate([{ $match: { tenantId: { $in: ids } } }, { $group: { _id: '$tenantId', n: { $sum: 1 } } }]),
      User.aggregate([{ $match: { clinicId: { $in: ids } } }, { $group: { _id: '$clinicId', n: { $sum: 1 } } }]),
      Appointment.aggregate([{ $match: { clinicId: { $in: ids } } }, { $group: { _id: '$clinicId', n: { $sum: 1 } } }]),
      Email.aggregate([{ $match: { clinicId: { $in: ids } } }, { $group: { _id: '$clinicId', n: { $sum: 1 } } }]),
    ]);
    const m = (arr) => Object.fromEntries(arr.map(x => [String(x._id), x.n]));
    const [md, mu, ma, me] = [m(docs), m(users), m(apts), m(emails)];
    res.json(clinics.map(c => ({
      ...c,
      id: String(c._id),
      doctors: md[String(c._id)] || 0,
      users: mu[String(c._id)] || 0,
      appointments: ma[String(c._id)] || 0,
      emails: me[String(c._id)] || 0,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/clinics', authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, type, phone, email, city } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Le nom du cabinet est obligatoire.' });
    const clinic = await Clinic.create({
      name: String(name).trim(),
      type: type === 'LEGAL' ? 'LEGAL' : 'MEDICAL',
      phone, email,
      address: city ? { city } : undefined,
    });
    await AuditLog.create({ clinicId: clinic._id, userId: req.user._id, action: 'CLINIC_CREATED', resource: 'Clinic', resourceId: String(clinic._id), details: { name: clinic.name } }).catch(() => {});
    res.status(201).json(clinic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Praticiens ──────────────────────────────────────────────────────────────
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find(clinicFilter(req, 'tenantId')).populate('tenantId', 'name').lean();
    const ids = doctors.map(d => d._id);
    const today = isoDay(new Date());
    const [apts, upcoming] = await Promise.all([
      Appointment.aggregate([{ $match: { doctorId: { $in: ids } } }, { $group: { _id: '$doctorId', n: { $sum: 1 } } }]),
      Appointment.aggregate([{ $match: { doctorId: { $in: ids }, date: { $gte: today }, status: { $in: ['SCHEDULED', 'CONFIRMED'] } } }, { $group: { _id: '$doctorId', n: { $sum: 1 } } }]),
    ]);
    const m = (arr) => Object.fromEntries(arr.map(x => [String(x._id), x.n]));
    const [ma, mu] = [m(apts), m(upcoming)];
    res.json(doctors.map(d => ({
      id: String(d._id),
      name: d.name,
      specialty: d.specialty,
      profession: d.profession,
      email: d.professionalEmail,
      phone: d.phone || '',
      status: d.status,
      clinic: d.tenantId?.name || '',
      clinicId: String(d.tenantId?._id || d.tenantId || ''),
      appointmentDuration: d.appointmentDuration,
      appointments: ma[String(d._id)] || 0,
      upcoming: mu[String(d._id)] || 0,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/doctors/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant invalide.' });
    const doctor = await Doctor.findOne({ _id: req.params.id, ...clinicFilter(req, 'tenantId') });
    if (!doctor) return res.status(404).json({ message: 'Praticien introuvable.' });
    const { status, specialty, phone } = req.body || {};
    if (status && ['ACTIVE', 'INACTIVE', 'ON_LEAVE'].includes(status)) doctor.status = status;
    if (specialty) doctor.specialty = String(specialty).trim();
    if (phone !== undefined) doctor.phone = String(phone).trim();
    await doctor.save();
    await AuditLog.create({ clinicId: doctor.tenantId, userId: req.user._id, action: 'DOCTOR_UPDATED', resource: 'Doctor', resourceId: String(doctor._id), details: req.body }).catch(() => {});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Utilisateurs ────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find(isSuper(req) ? {} : { clinicId: req.clinicId }).select('-password').populate('clinicId', 'name').lean();
    res.json(users.map(u => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'ACTIVE',
      clinic: u.clinicId?.name || '',
      clinicId: String(u.clinicId?._id || u.clinicId || ''),
      createdAt: u.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Création d'un compte. Pour un PRATICIEN, la fiche praticien (agenda) est créée aussi,
 * afin que l'IA puisse lui attribuer les e-mails et réserver dans son agenda.
 */
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, clinicId, specialty, profession } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Nom, e-mail et mot de passe sont obligatoires.' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Mot de passe : 8 caractères minimum.' });
    const allowedRoles = isSuper(req) ? ['SUPER_ADMIN', 'ADMIN', 'PRATICIEN', 'PATIENT'] : ['ADMIN', 'PRATICIEN'];
    const safeRole = allowedRoles.includes(role) ? role : 'PRATICIEN';
    const targetClinic = isSuper(req) && clinicId && mongoose.isValidObjectId(clinicId) ? clinicId : req.clinicId;
    const cleanEmail = String(email).toLowerCase().trim();
    if (await User.exists({ email: cleanEmail })) return res.status(409).json({ message: 'Cet e-mail est déjà utilisé.' });

    const user = await User.create({ name: String(name).trim(), email: cleanEmail, password, role: safeRole, clinicId: targetClinic });
    if (safeRole === 'PRATICIEN') {
      const doctor = await Doctor.create({
        tenantId: targetClinic,
        userId: user._id,
        name: user.name,
        professionalEmail: cleanEmail,
        specialty: specialty || 'Médecine Générale',
        profession: ['MEDECIN', 'AVOCAT', 'NOTAIRE', 'AUTRE'].includes(profession) ? profession : 'MEDECIN',
        status: 'ACTIVE',
      });
      await InternalSchedule.create({ tenantId: targetClinic, doctorId: doctor._id }).catch(() => {});
    }
    await AuditLog.create({ clinicId: targetClinic, userId: req.user._id, action: 'USER_CREATED', resource: 'User', resourceId: String(user._id), details: { email: cleanEmail, role: safeRole } }).catch(() => {});
    res.status(201).json({ id: String(user._id), name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant invalide.' });
    if (String(req.params.id) === String(req.user._id) && (req.body?.status === 'INACTIVE' || req.body?.role)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle ou désactiver votre compte.' });
    }
    const user = await User.findOne({ _id: req.params.id, ...(isSuper(req) ? {} : { clinicId: req.clinicId }) });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const { status, role } = req.body || {};
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) user.status = status;
    const allowedRoles = isSuper(req) ? ['SUPER_ADMIN', 'ADMIN', 'PRATICIEN', 'PATIENT'] : ['ADMIN', 'PRATICIEN'];
    if (role && allowedRoles.includes(role)) user.role = role;
    await user.save();
    await AuditLog.create({ clinicId: user.clinicId, userId: req.user._id, action: 'USER_UPDATED', resource: 'User', resourceId: String(user._id), details: { status, role } }).catch(() => {});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Journal d'audit ─────────────────────────────────────────────────────────
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find(clinicFilter(req)).sort({ timestamp: -1 }).limit(Math.min(Number(req.query.limit) || 100, 500)).populate('userId', 'name email').lean();
    res.json(logs.map(l => ({
      id: String(l._id),
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      user: l.userId?.name || l.userId?.email || 'Système',
      details: l.details || {},
      createdAt: l.timestamp || l.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
