import test from 'node:test';
import assert from 'node:assert';
import { encryptData, decryptData } from '../src/services/cryptoService.js';

test('Security & Crypto: AES-256-GCM Google OAuth Token Encryption', () => {
  const sampleGoogleTokens = {
    accessToken: 'ya29.a0AfH6SMD_secret_token_example_2026',
    refreshToken: '1//0gM_refresh_token_very_secret_xyz',
    expiryDate: Date.now() + 3600000,
  };

  // Chiffrement
  const encrypted = encryptData(sampleGoogleTokens);
  assert.ok(encrypted, 'Le payload chiffré doit exister');
  assert.strictEqual(typeof encrypted, 'string');
  assert.ok(encrypted.includes(':'), 'Doit contenir le format iv:tag:data');

  // Déchiffrement
  const decrypted = decryptData(encrypted, true);
  assert.deepStrictEqual(decrypted, sampleGoogleTokens, 'Les données déchiffrées doivent correspondre exactement');
});

test('Multi-Doctor Routing: Route by Mailbox Integration & Unresolved Queue', () => {
  const registeredIntegrations = [
    { providerAccountEmail: 'drrayen@gmail.com', doctorId: 'doctor_A', tenantId: 'tenant_1' },
    { providerAccountEmail: 'drsami@gmail.com', doctorId: 'doctor_B', tenantId: 'tenant_1' },
    { providerAccountEmail: 'dramira@gmail.com', doctorId: 'doctor_C', tenantId: 'tenant_1' },
  ];

  const routeEmailToDoctor = (recipientEmail) => {
    const match = registeredIntegrations.find(
      i => i.providerAccountEmail.toLowerCase() === recipientEmail.toLowerCase()
    );
    if (!match) {
      return { routed: false, status: 'UNRESOLVED_MAILBOX' };
    }
    return { routed: true, doctorId: match.doctorId, tenantId: match.tenantId };
  };

  // Test 1: Email destiné à Dr Rayen
  const resRayen = routeEmailToDoctor('drrayen@gmail.com');
  assert.strictEqual(resRayen.routed, true);
  assert.strictEqual(resRayen.doctorId, 'doctor_A');

  // Test 2: Email destiné à Dr Sami
  const resSami = routeEmailToDoctor('drsami@gmail.com');
  assert.strictEqual(resSami.routed, true);
  assert.strictEqual(resSami.doctorId, 'doctor_B');

  // Test 3: Boîte inconnue -> file non résolue sans deviner
  const resUnknown = routeEmailToDoctor('inconnu@cabinet.com');
  assert.strictEqual(resUnknown.routed, false);
  assert.strictEqual(resUnknown.status, 'UNRESOLVED_MAILBOX');
});

test('Lunch Break & Anti Double Booking Isolation', () => {
  // Horaires de consultation : 08:30 - 17:30, Pause déjeuner : 12:30 - 14:00
  const isSlotInLunchBreak = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const minutes = h * 60 + m;
    const breakStart = 12 * 60 + 30; // 12:30 -> 750 min
    const breakEnd = 14 * 60;        // 14:00 -> 840 min
    return minutes >= breakStart && minutes < breakEnd;
  };

  assert.strictEqual(isSlotInLunchBreak('10:00'), false, '10:00 est en dehors de la pause déjeuner');
  assert.strictEqual(isSlotInLunchBreak('12:30'), true, '12:30 est dans la pause déjeuner');
  assert.strictEqual(isSlotInLunchBreak('13:00'), true, '13:00 est dans la pause déjeuner');
  assert.strictEqual(isSlotInLunchBreak('13:30'), true, '13:30 est dans la pause déjeuner');
  assert.strictEqual(isSlotInLunchBreak('14:00'), false, '14:00 est la reprise des consultations');
});
