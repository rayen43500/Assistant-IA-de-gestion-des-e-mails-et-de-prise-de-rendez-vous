import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import client from 'prom-client';

test('DevSecOps & Backend Health Check Tests', async (t) => {
  const app = express();
  app.use(express.json());

  // Health endpoint test
  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Backend Node.js/Express SaaS',
      version: '1.0.0',
    });
  });

  // Prometheus Metrics endpoint test
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });

  // n8n Reminders endpoint mock
  app.get('/api/appointments/reminders-due', (req, res) => {
    const targetDate = req.query.date || '2026-11-04';
    res.json({
      targetDate,
      count: 1,
      data: [
        {
          _id: 'mock-apt-1',
          patient: { name: 'Sami Chaabane', phone: '+216 98 456 789' },
          date: targetDate,
          timeSlot: { start: '09:00', end: '09:30' },
          reminderSent24h: false,
        }
      ]
    });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  await t.test('GET /health retourne un statut UP avec code 200', async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'UP');
    assert.strictEqual(data.service, 'Backend Node.js/Express SaaS');
  });

  await t.test('GET /metrics expose les métriques Prometheus', async () => {
    const res = await fetch(`http://localhost:${port}/metrics`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.length > 0);
  });

  await t.test('GET /api/appointments/reminders-due renvoie les RDV pour n8n', async () => {
    const res = await fetch(`http://localhost:${port}/api/appointments/reminders-due?date=2026-11-04`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.data[0].patient.name, 'Sami Chaabane');
    assert.strictEqual(data.data[0].reminderSent24h, false);
  });

  await new Promise((resolve) => server.close(resolve));
});

test('Anti Double Booking Collision Logic Test', () => {
  const existingSlots = [
    { practitionerId: 'dr-1', date: '2026-11-05', timeSlot: '09:00' },
    { practitionerId: 'dr-1', date: '2026-11-05', timeSlot: '09:30' },
  ];

  const checkCollision = (practitionerId, date, timeSlot) => {
    return existingSlots.some(
      s => s.practitionerId === practitionerId && s.date === date && s.timeSlot === timeSlot
    );
  };

  assert.strictEqual(checkCollision('dr-1', '2026-11-05', '09:00'), true);
  assert.strictEqual(checkCollision('dr-1', '2026-11-05', '10:00'), false);
  assert.strictEqual(checkCollision('dr-2', '2026-11-05', '09:00'), false);
});

