/**
 * Tests d'intégration sur une vraie base MongoDB (base dédiée ai_cabinet_test, vidée à la fin).
 * Ignorés automatiquement si MongoDB n'est pas joignable.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Clinic from '../src/models/Clinic.js';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Appointment from '../src/models/Appointment.js';
import Email from '../src/models/Email.js';
import { processIncomingEmail } from '../src/services/centralEmailRouter.js';
import { getPractitionerScope } from '../src/middleware/practitionerScope.js';
import express from 'express';
import authRoutes from '../src/routes/auth.js';

process.env.EMAIL_SENDING_DISABLED = 'true';
process.env.N8N_NOTIFY_DISABLED = 'true';

const URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/ai_cabinet_test';
const NOW = new Date('2026-11-23T10:00:00Z'); // lundi 23/11/2026 11h Tunis

let connected = false;
let docA, docB, userA, userB, admin;

before(async () => {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 1500 });
    connected = true;
  } catch {
    return;
  }
  await mongoose.connection.db.dropDatabase();
  const clinic = await Clinic.create({ name: 'Cabinet Test', type: 'MEDICAL' });
  userA = await User.create({ name: 'Dr. Alpha Test', email: 'alpha@test.tn', password: 'Password123!', role: 'PRATICIEN', clinicId: clinic._id });
  userB = await User.create({ name: 'Dr. Beta Test', email: 'beta@test.tn', password: 'Password123!', role: 'PRATICIEN', clinicId: clinic._id });
  admin = await User.create({ name: 'Admin', email: 'admin@test.tn', password: 'Password123!', role: 'ADMIN', clinicId: clinic._id });
  docA = await Doctor.create({ tenantId: clinic._id, userId: userA._id, name: 'Dr. Alpha Test', professionalEmail: 'alpha@test.tn', specialty: 'Cardiologie' });
  docB = await Doctor.create({ tenantId: clinic._id, userId: userB._id, name: 'Dr. Beta Test', professionalEmail: 'beta@test.tn', specialty: 'Dermatologie' });
});

after(async () => {
  if (!connected) return;
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('Intégration MongoDB', () => {
  test('déplacement de RDV : le nouveau est confirmé ET l’ancien est annulé', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const threadId = 'thread-resched-' + Date.now();
    const first = await processIncomingEmail({
      senderEmail: 'resched@patient.tn', senderName: 'Patient Resched',
      subject: 'RDV', body: 'Bonjour, rendez-vous avec le Dr Alpha le 24/11/2026 à 10h00 svp',
      threadId, now: NOW,
    });
    assert.equal(first.decision, 'DIRECT_CONFIRMATION');
    const oldId = first.autoBooking.appointment._id;

    const move = await processIncomingEmail({
      senderEmail: 'resched@patient.tn', senderName: 'Patient Resched',
      subject: 'Re: RDV', body: 'Finalement je voudrais déplacer mon rendez-vous au 25/11/2026 à 15h',
      threadId, now: NOW,
    });
    assert.equal(move.decision, 'RESCHEDULED');
    assert.ok(move.email.draftReply.includes('a bien été annulé et remplacé'));

    const old = await Appointment.findById(oldId).lean();
    const active = await Appointment.find({ 'patient.email': 'resched@patient.tn', status: 'CONFIRMED' }).lean();
    assert.equal(old.status, 'CANCELLED');
    assert.equal(active.length, 1);
    assert.equal(active[0].date, '2026-11-25');
    assert.equal(active[0].timeSlot.start, '15:00');
  });

  test('déplacement en 2 temps (créneau occupé → choix) : un seul RDV actif à la fin', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    // Créneau 26/11 9h déjà pris par quelqu'un d'autre
    await processIncomingEmail({ senderEmail: 'autre@patient.tn', subject: 'RDV', body: 'RDV Dr Alpha le 26/11/2026 à 9h', now: NOW });

    const threadId = 'thread-resched2-' + Date.now();
    await processIncomingEmail({ senderEmail: 'resched2@patient.tn', subject: 'RDV', body: 'RDV avec Dr Alpha le 24/11/2026 à 11h', threadId, now: NOW });
    const busy = await processIncomingEmail({ senderEmail: 'resched2@patient.tn', subject: 'Re: RDV', body: 'Je dois décaler au 26/11/2026 à 9h', threadId, now: NOW });
    assert.equal(busy.decision, 'PROPOSE_ALTERNATIVES');
    // l'ancien RDV reste valable tant que rien n'est choisi
    assert.equal(await Appointment.countDocuments({ 'patient.email': 'resched2@patient.tn', status: 'CONFIRMED' }), 1);

    const pick = await processIncomingEmail({ senderEmail: 'resched2@patient.tn', subject: 'Re: RDV', body: 'Le premier créneau', threadId, now: NOW });
    assert.equal(pick.decision, 'RESCHEDULED');
    const active = await Appointment.find({ 'patient.email': 'resched2@patient.tn', status: 'CONFIRMED' }).lean();
    assert.equal(active.length, 1);
    assert.equal(active[0].date, '2026-11-26');
  });

  test('cloisonnement : chaque praticien ne voit que ses patients, l’admin voit tout', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    await processIncomingEmail({ senderEmail: 'pb@patient.tn', subject: 'RDV', body: 'RDV avec le Dr Beta le 27/11/2026 à 10h', now: NOW });

    const scopeA = await getPractitionerScope({ user: userA });
    const scopeB = await getPractitionerScope({ user: userB });
    const scopeAdmin = await getPractitionerScope({ user: admin });

    const aptsA = await Appointment.find(scopeA).lean();
    const aptsB = await Appointment.find(scopeB).lean();
    assert.ok(aptsA.length > 0 && aptsA.every(a => String(a.doctorId) === String(docA._id)));
    assert.ok(aptsB.length > 0 && aptsB.every(a => String(a.doctorId) === String(docB._id)));
    assert.equal(aptsA.some(a => a.patient.email === 'pb@patient.tn'), false);
    assert.deepEqual(scopeAdmin, {});

    const emailsB = await Email.find(scopeB).lean();
    assert.ok(emailsB.every(e => String(e.doctorId) === String(docB._id)));
  });

  test('praticien sans fiche Doctor : ne voit rien (jamais les patients des collègues)', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const orphan = await User.create({ name: 'Dr Orphelin', email: 'orphan@test.tn', password: 'Password123!', role: 'PRATICIEN', clinicId: docA.tenantId });
    const scope = await getPractitionerScope({ user: orphan });
    assert.equal(await Appointment.countDocuments(scope), 0);
  });

  test('inscription publique : impossible de devenir SUPER_ADMIN, mot de passe court refusé, mauvais mot de passe refusé', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    try {
      const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const r1 = await post('/register', { name: 'Pirate', email: 'pirate@test.tn', password: 'Password123!', role: 'SUPER_ADMIN' });
      assert.equal(r1.status, 201);
      assert.equal((await r1.json()).user.role, 'PRATICIEN');
      const r2 = await post('/register', { name: 'Court', email: 'court@test.tn', password: '123' });
      assert.equal(r2.status, 400);
      const r3 = await post('/login', { email: 'pirate@test.tn', password: 'mauvais' });
      assert.equal(r3.status, 401);
      const r4 = await post('/login', { email: 'PIRATE@test.tn', password: 'Password123!' });
      assert.equal(r4.status, 200);
    } finally {
      server.close();
    }
  });
});
