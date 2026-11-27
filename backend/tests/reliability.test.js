/**
 * Tests de fiabilité (ISO 25010 §6.5) sur une vraie base MongoDB (ai_cabinet_reliability, vidée à la fin).
 *  - concurrence : 10 réservations simultanées du même créneau → 1 seule acceptée
 *  - idempotence : une requête rejouée ne crée pas de doublon
 *  - panne de la base : réponses 503/500 propres, aucun crash, reprise automatique
 *  - corps de requête invalide : erreur 400 sans arrêt du serveur
 * Ignorés automatiquement si MongoDB n'est pas joignable.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import Clinic from '../src/models/Clinic.js';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Appointment from '../src/models/Appointment.js';
import publicRoutes from '../src/routes/publicBooking.js';
import authRoutes from '../src/routes/auth.js';
import appointmentRoutes from '../src/routes/appointments.js';

process.env.EMAIL_SENDING_DISABLED = 'true';
process.env.N8N_NOTIFY_DISABLED = 'true';

const URI = process.env.MONGO_RELIABILITY_URI || 'mongodb://127.0.0.1:27017/ai_cabinet_reliability';
let connected = false;
let server, base, doctor;

/** Prochain mardi (jour ouvré) à au moins 2 jours d'aujourd'hui, format AAAA-MM-JJ */
function nextTuesday() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 2);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
const DATE = nextTuesday();

const post = (url, body, headers = {}) => fetch(base + url, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
});
const booking = (overrides = {}) => ({
  doctorId: String(doctor._id), date: DATE, startTime: '10:00',
  patientName: 'Patient Fiabilité', patientEmail: 'fiabilite@test.tn', patientPhone: '+216 20 000 000', ...overrides,
});

before(async () => {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 1500 });
    connected = true;
  } catch {
    return;
  }
  await mongoose.connection.db.dropDatabase();
  await Appointment.syncIndexes(); // index unique anti-double réservation
  const clinic = await Clinic.create({ name: 'Cabinet Fiabilité', type: 'MEDICAL' });
  const user = await User.create({ name: 'Dr Fiable', email: 'fiable@test.tn', password: 'Password123!', role: 'PRATICIEN', clinicId: clinic._id });
  doctor = await Doctor.create({ tenantId: clinic._id, userId: user._id, name: 'Dr Fiable', professionalEmail: 'fiable@test.tn', specialty: 'Généraliste', status: 'ACTIVE' });

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/appointments', appointmentRoutes);
  // même gestionnaire d'erreurs que src/index.js
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(err.status || 500).json({ message: err.message }));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  if (!connected) return;
  if (mongoose.connection.readyState !== 1) await mongoose.connect(URI);
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('Fiabilité', () => {
  test('RM-01 concurrence : 10 réservations simultanées du même créneau → une seule réussit', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) =>
      post('/api/public/bookings', booking({ startTime: '09:00', patientEmail: `concurrent${i}@test.tn` })).then((r) => r.status)));
    assert.equal(results.filter((s) => s === 201).length, 1, `statuts reçus : ${results.join(',')}`);
    assert.ok(results.filter((s) => s !== 201).every((s) => s === 409), `les autres doivent être 409 : ${results.join(',')}`);
    const active = await Appointment.countDocuments({ doctorId: doctor._id, date: DATE, 'timeSlot.start': '09:00', status: { $in: ['SCHEDULED', 'CONFIRMED'] } });
    assert.equal(active, 1, 'aucune double réservation en base');
  });

  test('RM-07 idempotence : la même requête rejouée 3 fois ne crée qu’un rendez-vous', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const key = `idem-${Date.now()}`;
    const body = booking({ startTime: '11:00', idempotencyKey: key });
    const r1 = await post('/api/public/bookings', body);
    const r2 = await post('/api/public/bookings', body);
    const r3 = await post('/api/public/bookings', body);
    assert.equal(r1.status, 201);
    const [j1, j2, j3] = [await r1.json(), await r2.json(), await r3.json()];
    assert.equal(j2.idempotentReplay, true);
    assert.equal(j1.managementToken, j2.managementToken);
    assert.equal(j1.managementToken, j3.managementToken);
    assert.equal(await Appointment.countDocuments({ idempotencyKey: key }), 1);
  });

  test('annulation rejouée : pas d’erreur, statut stable, créneau libéré puis réservable', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const r = await post('/api/public/bookings', booking({ startTime: '15:00', patientEmail: 'annule@test.tn' }));
    const { managementToken } = await r.json();
    const c1 = await post(`/api/public/bookings/${managementToken}/cancel`, {});
    const c2 = await post(`/api/public/bookings/${managementToken}/cancel`, {});
    assert.equal(c1.status, 200);
    assert.equal(c2.status, 200);
    const again = await post('/api/public/bookings', booking({ startTime: '15:00', patientEmail: 'autre@test.tn' }));
    assert.equal(again.status, 201, 'le créneau libéré doit être de nouveau réservable');
  });

  test('corps JSON invalide → 400, le serveur reste disponible', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const bad = await post('/api/public/bookings', '{"doctorId": ');
    assert.equal(bad.status, 400);
    const ok = await fetch(base + '/api/public/doctors');
    assert.equal(ok.status, 200);
  });

  test('panne MongoDB : erreurs propres (503/500 JSON), aucun crash, puis reprise sans perte de données', async (t) => {
    if (!connected) return t.skip('MongoDB indisponible');
    const login = await post('/api/auth/login', { email: 'fiable@test.tn', password: 'Password123!' });
    const { token } = await login.json();
    const before = await Appointment.countDocuments();

    await mongoose.disconnect(); // panne simulée de la base
    const protectedRes = await fetch(base + '/api/appointments', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(protectedRes.status, 503);
    assert.match((await protectedRes.json()).message, /indisponible/i);
    const publicRes = await post('/api/public/bookings', booking({ startTime: '16:00', patientEmail: 'panne@test.tn' }));
    assert.ok([500, 503].includes(publicRes.status), `statut pendant la panne : ${publicRes.status}`);
    assert.ok((await publicRes.json()).message, 'réponse JSON exploitable pendant la panne');

    await mongoose.connect(URI, { serverSelectionTimeoutMS: 1500 }); // reprise
    const after = await fetch(base + '/api/appointments', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(after.status, 200, 'le service reprend sans redémarrage');
    assert.equal(await Appointment.countDocuments(), before, 'aucune donnée perdue ni créée pendant la panne');
    const retry = await post('/api/public/bookings', booking({ startTime: '16:00', patientEmail: 'panne@test.tn' }));
    assert.equal(retry.status, 201, 'la réservation refusée pendant la panne aboutit après reprise');
  });
});
