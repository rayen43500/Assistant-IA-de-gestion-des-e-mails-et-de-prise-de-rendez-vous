/**
 * Tests unitaires des règles métier explicites (RM-01 … RM-08) — sans base de données.
 * Référencées dans docs/QUALITE_ISO25010.md (matrice de traçabilité).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword } from '../src/services/passwordHasher.js';
import { canTransition, applyTransition, isPastAppointment, APPOINTMENT_TRANSITIONS } from '../src/services/appointmentWorkflow.js';
import { computeDaySlots, checkTimeInDay, timeToMinutes, minutesToTime, getFrenchDayName } from '../src/services/availabilityService.js';

const NOW = new Date('2026-11-23T08:00:00Z'); // lundi 23/11/2026 09:00 Tunis

describe('RM-03 Workflow des statuts de rendez-vous', () => {
  test('transitions autorisées', () => {
    assert.ok(canTransition('SCHEDULED', 'CONFIRMED'));
    assert.ok(canTransition('CONFIRMED', 'COMPLETED'));
    assert.ok(canTransition('CONFIRMED', 'NO_SHOW'));
    assert.ok(canTransition('CONFIRMED', 'CANCELLED'));
  });

  test('les états terminaux sont définitifs', () => {
    for (const terminal of ['CANCELLED', 'COMPLETED', 'NO_SHOW', 'REJECTED', 'RESCHEDULED']) {
      assert.deepEqual(APPOINTMENT_TRANSITIONS[terminal], [], `${terminal} doit être terminal`);
      for (const to of Object.keys(APPOINTMENT_TRANSITIONS)) assert.equal(canTransition(terminal, to), false);
    }
  });

  test('transition interdite → erreur INVALID_TRANSITION et statut inchangé', () => {
    const apt = { status: 'COMPLETED' };
    assert.throws(() => applyTransition(apt, 'CANCELLED'), (e) => e.code === 'INVALID_TRANSITION');
    assert.equal(apt.status, 'COMPLETED');
    assert.equal(canTransition('SCHEDULED', 'COMPLETED'), false, 'on ne clôture pas un RDV non confirmé');
    assert.equal(canTransition('INCONNU', 'CONFIRMED'), false);
  });

  test('clôture possible seulement après l’heure de début', () => {
    assert.equal(isPastAppointment({ date: '2026-11-23', timeSlot: { start: '10:00' } }, NOW), false);
    assert.equal(isPastAppointment({ date: '2026-11-23', timeSlot: { start: '08:30' } }, NOW), true);
    assert.equal(isPastAppointment({ startAt: '2026-11-22T10:00:00Z' }, NOW), true);
  });
});

describe('RM-02 Respect du planning (horaires, pause, fermeture, passé)', () => {
  const day = (date, extra = {}) => computeDaySlots({ date, now: NOW, ...extra });

  test('jour fermé (dimanche) → aucun créneau', () => {
    assert.equal(getFrenchDayName('2026-11-29'), 'Dimanche');
    const d = day('2026-11-29');
    assert.equal(d.closed, true);
    assert.equal(checkTimeInDay(d, '10:00').free, false);
  });

  test('date passée refusée', () => {
    const d = day('2026-11-20');
    assert.equal(d.closed, true);
    assert.equal(d.past, true);
  });

  test('pause déjeuner et hors horaires refusés', () => {
    const d = day('2026-11-24');
    assert.match(checkTimeInDay(d, '13:00').reason, /Pause/);
    assert.match(checkTimeInDay(d, '07:00').reason, /horaires/);
    assert.match(checkTimeInDay(d, '17:15').reason, /horaires/, 'un RDV de 30 min ne déborde pas après la fermeture');
    assert.equal(checkTimeInDay(d, '09:00').free, true);
  });

  test('délai de prévenance d’1h le jour même', () => {
    const d = day('2026-11-23'); // il est 9h00
    assert.equal(checkTimeInDay(d, '09:30').free, false);
    assert.equal(checkTimeInDay(d, '10:30').free, true);
  });

  test('congés du praticien', () => {
    const d = day('2026-11-25', { holidays: [{ start: '2026-11-25', end: '2026-11-27' }] });
    assert.equal(d.closed, true);
    assert.match(d.reason, /congé/);
  });
});

describe('RM-01 Pas de double réservation (calcul de disponibilité)', () => {
  test('un créneau réservé n’est plus proposé, tampon inclus', () => {
    const d = computeDaySlots({
      date: '2026-11-24', now: NOW, durationMinutes: 30, bufferMinutes: 5,
      appointments: [{ timeSlot: { start: '10:00', end: '10:30' } }],
    });
    assert.match(checkTimeInDay(d, '10:00').reason, /déjà réservé/);
    assert.equal(checkTimeInDay(d, '10:15').free, false, 'chevauchement partiel interdit');
    assert.equal(checkTimeInDay(d, '10:30').free, false, 'tampon de 5 min après le RDV');
    assert.equal(checkTimeInDay(d, '10:35').free, true);
    const slot = d.slots.find((s) => s.start === '10:00');
    assert.equal(slot.available, false);
  });

  test('indisponibilité Google Calendar prise en compte', () => {
    const d = computeDaySlots({ date: '2026-11-24', now: NOW, externalBusy: [{ start: '15:00', end: '16:00' }] });
    assert.match(checkTimeInDay(d, '15:30').reason, /indisponible/);
  });
});

describe('Utilitaires horaires', () => {
  test('conversion minutes ↔ HH:MM réversible', () => {
    for (const t of ['00:00', '08:30', '12:05', '23:59']) assert.equal(minutesToTime(timeToMinutes(t)), t);
  });
});

describe('RM-05 Sécurité des comptes (unitaires)', () => {
  test('mot de passe haché (bcrypt coût 10, pool de workers), jamais stocké en clair', async () => {
    const hash = await hashPassword('Password123!');
    assert.match(hash, /^\$2[aby]\$10\$/);
    assert.ok(await verifyPassword('Password123!', hash));
    assert.equal(await verifyPassword('password123!', hash), false);
    assert.equal(await verifyPassword({ $ne: null }, hash), false, 'objet (injection) refusé sans exception');
  });

  test('vérifications concurrentes : calcul réparti hors du thread principal', async () => {
    const hash = await hashPassword('Password123!');
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => verifyPassword(i % 2 ? 'Password123!' : 'faux', hash)));
    assert.deepEqual(results, Array.from({ length: 12 }, (_, i) => i % 2 === 1));
  });

  test('un jeton JWT falsifié ou signé avec une autre clé est rejeté', () => {
    const token = jwt.sign({ id: 'abc' }, 'cle-serveur', { expiresIn: '1h' });
    assert.equal(jwt.verify(token, 'cle-serveur').id, 'abc');
    assert.throws(() => jwt.verify(token, 'autre-cle'));
    const [h, , s] = token.split('.');
    const forged = `${h}.${Buffer.from(JSON.stringify({ id: 'admin' })).toString('base64url')}.${s}`;
    assert.throws(() => jwt.verify(forged, 'cle-serveur'));
    const none = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"id":"x"}').toString('base64url')}.`;
    assert.throws(() => jwt.verify(none, 'cle-serveur'));
  });

  test('un jeton expiré est rejeté', () => {
    const expired = jwt.sign({ id: 'abc', exp: Math.floor(Date.now() / 1000) - 10 }, 'k');
    assert.throws(() => jwt.verify(expired, 'k'), /expired/);
  });
});
