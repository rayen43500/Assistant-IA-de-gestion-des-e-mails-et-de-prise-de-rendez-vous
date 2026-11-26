import express from 'express';
import mongoose from 'mongoose';
import Contact from '../models/Contact.js';
import Appointment from '../models/Appointment.js';
import Email from '../models/Email.js';
import { protect, authorize } from '../middleware/auth.js';
import { getPractitionerScope } from '../middleware/practitionerScope.js';

const router = express.Router();

/**
 * Annuaire patients / clients, construit à partir des données réelles :
 * rendez-vous + e-mails du cabinet (filtrés par praticien), enrichis par les fiches Contact.
 */
router.get('/', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const scope = await getPractitionerScope(req);
    const base = { clinicId: req.clinicId, ...scope };
    const [appointments, emails] = await Promise.all([
      Appointment.find(base).select('patient date timeSlot reason status createdAt').lean(),
      Email.find(base).select('sender intent receivedAt').lean(),
    ]);

    const byEmail = new Map();
    const touch = (email, patch) => {
      const key = (email || '').toLowerCase().trim();
      if (!key || key === 'non-renseigne@medilawai.com') return;
      const cur = byEmail.get(key) || { email: key, name: '', phone: '', totalAppointments: 0, last: null, lastReason: '' };
      Object.assign(cur, Object.fromEntries(Object.entries(patch).filter(([k, v]) => v && !['last', 'count'].includes(k) && !cur[k])));
      if (patch.count) cur.totalAppointments += patch.count;
      if (patch.last && (!cur.last || patch.last > cur.last)) {
        cur.last = patch.last;
        if (patch.lastReason) cur.lastReason = patch.lastReason;
      }
      byEmail.set(key, cur);
    };

    for (const a of appointments) {
      touch(a.patient?.email, {
        name: a.patient?.name,
        phone: a.patient?.phone !== 'Non renseigné' ? a.patient?.phone : '',
        count: a.status === 'CANCELLED' ? 0 : 1,
        last: new Date(`${a.date}T${a.timeSlot?.start || '00:00'}:00`),
        lastReason: a.reason,
      });
    }
    for (const e of emails) {
      touch(e.sender?.email, { name: e.sender?.name, phone: e.sender?.phone, last: e.receivedAt ? new Date(e.receivedAt) : null });
    }

    const emailsList = [...byEmail.keys()];
    const fiches = emailsList.length
      ? await Contact.find({ email: { $in: emailsList } }).lean()
      : [];
    const ficheByEmail = new Map(fiches.map(f => [f.email, f]));

    // Fiches créées manuellement (sans RDV ni e-mail) : visibles par l'admin et par le praticien qui les a créées
    const manual = await Contact.find({
      tenantId: req.clinicId,
      email: { $nin: emailsList },
      ...(scope.doctorId ? { createdByDoctorId: scope.doctorId } : {}),
    }).lean().catch(() => []);
    for (const m of manual) {
      byEmail.set(m.email, { email: m.email, name: m.name, phone: m.phone, totalAppointments: 0, last: m.lastContactAt, lastReason: '' });
      ficheByEmail.set(m.email, m);
    }

    const list = [...byEmail.values()].map((c) => {
      const fiche = ficheByEmail.get(c.email);
      return {
        id: fiche ? String(fiche._id) : `email:${c.email}`,
        name: fiche?.name || c.name || c.email.split('@')[0],
        email: c.email,
        phone: fiche?.phone || c.phone || '',
        identifier: fiche ? `PAT-${String(fiche._id).slice(-6).toUpperCase()}` : '—',
        category: c.lastReason || (fiche?.isRegistered ? 'Patient inscrit' : 'Contact e-mail'),
        lastInteraction: c.last ? new Date(c.last).toISOString() : '',
        totalAppointments: c.totalAppointments,
        notes: fiche?.notes || '',
      };
    }).sort((a, b) => (b.lastInteraction || '').localeCompare(a.lastInteraction || ''));

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des patients', error: error.message });
  }
});

async function upsertFiche(req, { name, email, phone, notes }) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!cleanEmail || !/@/.test(cleanEmail)) throw Object.assign(new Error('Adresse e-mail valide requise.'), { status: 400 });
  const scope = await getPractitionerScope(req);
  const update = {
    ...(name ? { name: String(name).trim() } : {}),
    ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
    ...(notes !== undefined ? { notes: String(notes).slice(0, 5000) } : {}),
    lastContactAt: new Date(),
  };
  return Contact.findOneAndUpdate(
    { email: cleanEmail },
    {
      $set: update,
      $setOnInsert: {
        email: cleanEmail,
        tenantId: mongoose.isValidObjectId(String(req.clinicId)) ? req.clinicId : undefined,
        type: 'EXTERNAL_CONTACT',
        isRegistered: false,
        firstContactAt: new Date(),
        ...(scope.doctorId ? { createdByDoctorId: scope.doctorId } : {}),
      },
    },
    { upsert: true, new: true, strict: false }
  ).lean();
}

router.post('/', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    if (!req.body?.name) return res.status(400).json({ message: 'Le nom est obligatoire.' });
    const fiche = await upsertFiche(req, req.body);
    res.status(201).json(fiche);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

router.put('/:id', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let email = req.body?.email;
    if (!email && mongoose.isValidObjectId(req.params.id)) {
      email = (await Contact.findById(req.params.id).select('email').lean())?.email;
    }
    if (!email && req.params.id.startsWith('email:')) email = req.params.id.slice(6);
    const fiche = await upsertFiche(req, { ...req.body, email });
    res.json(fiche);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

// Supprime la fiche (notes, coordonnées). L'historique des RDV et e-mails est conservé.
router.delete('/:id', protect, authorize('PRATICIEN', 'ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Fiche introuvable.' });
    await Contact.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
