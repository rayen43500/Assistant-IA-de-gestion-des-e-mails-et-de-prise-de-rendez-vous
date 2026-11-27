/**
 * Sécurité (OWASP A06/CWE-1333) : les analyseurs de texte appliqués aux e-mails entrants
 * doivent rester linéaires face à des entrées forgées (pas de ReDoS / gel du serveur).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAddress } from '../src/services/gmailPollingService.js';
import { parseDateDetailed, parseTimeFromText, parsePhoneFromText, normalizeText } from '../src/services/smartBookingDecisionService.js';

const LIMIT_MS = 300;
function timed(fn) {
  const t0 = process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint() - t0) / 1e6;
}

test('parseAddress : résultat correct', () => {
  assert.deepEqual(parseAddress('"Amine Jaziri" <Amine@Gmail.com>'), { name: 'Amine Jaziri', email: 'amine@gmail.com' });
  assert.deepEqual(parseAddress('Dr X <x@y.tn>'), { name: 'Dr X', email: 'x@y.tn' });
  assert.deepEqual(parseAddress('seul@mail.tn'), { name: '', email: 'seul@mail.tn' });
});

test('parseAddress : en-tête From forgé de 100 000 caractères traité en temps linéaire', () => {
  for (const evil of [' '.repeat(100000) + 'x', '"'.repeat(100000), '<'.repeat(50000) + ' '.repeat(50000)]) {
    const ms = timed(() => parseAddress(evil));
    assert.ok(ms < LIMIT_MS, `parseAddress a pris ${ms.toFixed(1)} ms`);
  }
});

test('analyse date / heure / téléphone : entrées hostiles de 100 000 caractères < 300 ms', () => {
  const inputs = ['1/'.repeat(50000) + 'x', '216 '.repeat(25000) + '9', '9 '.repeat(50000), 'à '.repeat(50000) + '10h', '-'.repeat(100000)];
  for (const s of inputs) {
    for (const [name, fn] of [['date', () => parseDateDetailed(s, new Date('2026-11-23T10:00:00Z'))], ['heure', () => parseTimeFromText(s)], ['tel', () => parsePhoneFromText(s)], ['norm', () => normalizeText(s)]]) {
      const ms = timed(fn);
      assert.ok(ms < LIMIT_MS, `${name} a pris ${ms.toFixed(1)} ms sur « ${s.slice(0, 12)}… »`);
    }
  }
});
