/**
 * Génère la collection Postman v2.1 « MediLawAI – contrat API » (quality/api/medilaw.postman_collection.json).
 * La collection est importable dans Postman et exécutée en ligne de commande par Newman.
 *   node api/build-collection.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const json = (obj) => ({ mode: 'raw', raw: JSON.stringify(obj, null, 2), options: { raw: { language: 'json' } } });
const auth = (tokenVar) => [{ key: 'Authorization', value: `Bearer {{${tokenVar}}}` }];

function req(name, method, url, { body, headers = [], tests = [], pre = [] } = {}) {
  const item = {
    name,
    request: {
      method,
      header: [{ key: 'Content-Type', value: 'application/json' }, ...headers],
      url: { raw: `{{baseUrl}}${url}`, host: ['{{baseUrl}}'], path: url.replace(/^\//, '').split('?')[0].split('/') },
    },
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }],
  };
  const qs = url.split('?')[1];
  if (qs) item.request.url.query = qs.split('&').map((p) => { const [key, value] = p.split('='); return { key, value }; });
  if (body !== undefined) item.request.body = typeof body === 'string' ? { mode: 'raw', raw: body } : json(body);
  if (pre.length) item.event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } });
  return item;
}

const status = (code) => `pm.test('HTTP ${code}', () => pm.response.to.have.status(${code}));`;
const statusIn = (codes) => `pm.test('HTTP ∈ [${codes}]', () => pm.expect([${codes}]).to.include(pm.response.code));`;
const isJson = `pm.test('Réponse JSON', () => pm.response.to.be.json);`;
const fast = `pm.test('Temps de réponse < 1000 ms', () => pm.expect(pm.response.responseTime).to.be.below(1000));`;

const login = (name, email, password, tokenVar, role) => req(name, 'POST', '/api/auth/login', {
  body: { email, password },
  tests: [status(200), isJson, fast,
    `const j = pm.response.json();`,
    `pm.test('Jeton JWT présent', () => pm.expect(j.token).to.match(/^[\\w-]+\\.[\\w-]+\\.[\\w-]+$/));`,
    `pm.test('Rôle ${role}', () => pm.expect(j.user.role).to.eql('${role}'));`,
    `pm.test('Mot de passe jamais renvoyé', () => pm.expect(JSON.stringify(j)).to.not.include('password'));`,
    `pm.collectionVariables.set('${tokenVar}', j.token);`],
});

const nextWorkingDayScript = [
  // Prochain mardi ≥ J+2 : jour ouvré, hors délai de prévenance
  `const d = new Date(); d.setUTCDate(d.getUTCDate() + 2);`,
  `while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);`,
  `pm.collectionVariables.set('bookingDate', d.toISOString().slice(0, 10));`,
  `pm.collectionVariables.set('runId', String(Date.now()));`,
];

const folders = [
  {
    name: '01 Santé et disponibilité',
    item: [
      req('Health check', 'GET', '/health', {
        tests: [status(200), isJson, fast,
          `pm.test('Service UP et base connectée', () => { const j = pm.response.json(); pm.expect(j.status).to.eql('UP'); pm.expect(j.database).to.eql('UP'); });`],
      }),
      req('En-têtes de sécurité (helmet)', 'GET', '/health', {
        tests: [
          `pm.test('X-Content-Type-Options nosniff', () => pm.expect(pm.response.headers.get('X-Content-Type-Options')).to.eql('nosniff'));`,
          `pm.test('X-Frame-Options présent', () => pm.expect(pm.response.headers.has('X-Frame-Options')).to.be.true);`,
          `pm.test('Strict-Transport-Security présent', () => pm.expect(pm.response.headers.has('Strict-Transport-Security')).to.be.true);`,
          `pm.test('X-Powered-By masqué', () => pm.expect(pm.response.headers.has('X-Powered-By')).to.be.false);`],
      }),
    ],
  },
  {
    name: '02 Authentification et rôles',
    item: [
      req('Login – mauvais mot de passe → 401', 'POST', '/api/auth/login', { body: { email: 'admin@medilaw.ai', password: 'mauvais' }, tests: [status(401), isJson] }),
      req('Login – champs manquants → 400', 'POST', '/api/auth/login', { body: { email: 'admin@medilaw.ai' }, tests: [status(400)] }),
      req('Login – injection NoSQL refusée', 'POST', '/api/auth/login', {
        body: { email: { $ne: null }, password: { $ne: null } },
        tests: [`pm.test('Pas de connexion par injection', () => pm.expect(pm.response.code).to.not.eql(200));`, `pm.test('Pas d’erreur serveur', () => pm.expect(pm.response.code).to.be.below(500));`],
      }),
      login('Login SUPER_ADMIN', 'admin@medilaw.ai', 'Password123!', 'adminToken', 'SUPER_ADMIN'),
      login('Login PRATICIEN (Dr Ben Salem)', 'dr.bensalem@cabinet-ai.tn', 'Password123!', 'pracToken', 'PRATICIEN'),
      login('Login PRATICIEN (Dr Nadia)', 'dr.nadia@cabinet-ai.tn', 'Password123!', 'prac2Token', 'PRATICIEN'),
      req('Inscription – rôle SUPER_ADMIN demandé → créé PRATICIEN (pas d’escalade)', 'POST', '/api/auth/register', {
        pre: [`pm.collectionVariables.set('regEmail', 'newman.' + Date.now() + '@test.tn');`],
        body: { name: 'Dr Newman', email: '{{regEmail}}', password: 'Password123!', role: 'SUPER_ADMIN' },
        tests: [status(201), `pm.test('Rôle forcé à PRATICIEN', () => pm.expect(pm.response.json().user.role).to.eql('PRATICIEN'));`],
      }),
      req('Inscription – e-mail déjà utilisé → 400 (RM-06 unicité)', 'POST', '/api/auth/register', {
        body: { name: 'Doublon', email: '{{regEmail}}', password: 'Password123!' }, tests: [status(400)],
      }),
      req('Inscription – mot de passe < 8 caractères → 400', 'POST', '/api/auth/register', {
        body: { name: 'Court', email: 'court.{{$timestamp}}@test.tn', password: '123' }, tests: [status(400)],
      }),
      req('Inscription PATIENT → 201', 'POST', '/api/auth/register', {
        pre: [`pm.collectionVariables.set('patientEmail', 'patient.' + Date.now() + '@test.tn');`],
        body: { name: 'Patient Newman', email: '{{patientEmail}}', password: 'Password123!', role: 'PATIENT' },
        tests: [status(201), `pm.test('Rôle PATIENT', () => pm.expect(pm.response.json().user.role).to.eql('PATIENT'));`],
      }),
      login('Login PATIENT', '{{patientEmail}}', 'Password123!', 'patientToken', 'PATIENT'),
      req('/me sans jeton → 401', 'GET', '/api/auth/me', { tests: [status(401)] }),
      req('/me avec jeton falsifié → 401', 'GET', '/api/auth/me', { headers: [{ key: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFkbWluIn0.signature' }], tests: [status(401)] }),
      req('/me avec jeton valide → profil', 'GET', '/api/auth/me', {
        headers: auth('pracToken'),
        tests: [status(200), `pm.test('Profil sans mot de passe', () => { const j = pm.response.json(); pm.expect(j.email).to.eql('dr.bensalem@cabinet-ai.tn'); pm.expect(j).to.not.have.property('password'); });`],
      }),
    ],
  },
  {
    name: '03 Contrôle d’accès (RBAC)',
    item: [
      req('Praticien → /api/admin/overview interdit (403)', 'GET', '/api/admin/overview', { headers: auth('pracToken'), tests: [status(403)] }),
      req('Patient → /api/contacts interdit (403)', 'GET', '/api/contacts', { headers: auth('patientToken'), tests: [status(403)] }),
      req('Patient → ne voit aucun RDV du cabinet', 'GET', '/api/appointments', {
        headers: auth('patientToken'),
        tests: [status(200), `pm.test('Aucun RDV d’un autre patient', () => { const j = pm.response.json(); const list = Array.isArray(j) ? j : (j.data || j.appointments || []); pm.expect(list.every(a => (a.patient?.email || '') === pm.collectionVariables.get('patientEmail'))).to.be.true; });`],
      }),
      req('Admin → tableau de bord global (indicateurs agrégés)', 'GET', '/api/admin/overview', {
        headers: auth('adminToken'),
        tests: [status(200), isJson, fast, `pm.test('Indicateurs présents', () => pm.expect(Object.keys(pm.response.json()).length).to.be.above(0));`],
      }),
      req('Route interne sans clé → refusée', 'GET', '/api/appointments/reminders-due', { tests: [statusIn([401, 403])] }),
      req('Route interne avec clé n8n → 200', 'GET', '/api/appointments/reminders-due', {
        headers: [{ key: 'x-internal-key', value: '{{internalKey}}' }], tests: [status(200)],
      }),
    ],
  },
  {
    name: '04 Réservation publique et workflow',
    item: [
      req('Liste publique des praticiens (sans e-mails exposés)', 'GET', '/api/public/doctors', {
        pre: nextWorkingDayScript,
        tests: [status(200), isJson, fast,
          `const list = pm.response.json();`,
          `pm.test('Au moins un praticien', () => pm.expect(list.length).to.be.above(0));`,
          `pm.test('Aucune adresse e-mail professionnelle exposée', () => pm.expect(JSON.stringify(list)).to.not.include('professionalEmail'));`,
          `const doc = list.find(d => d.bookingSettings?.onlineBookingEnabled !== false) || list[0];`,
          `pm.collectionVariables.set('doctorId', doc._id);`],
      }),
      req('Disponibilités du praticien (date ouvrée)', 'GET', '/api/public/doctors/{{doctorId}}/availability?date={{bookingDate}}', {
        tests: [status(200), fast,
          `const j = pm.response.json();`,
          `pm.test('Créneaux calculés', () => pm.expect(j.slots).to.be.an('array').that.is.not.empty);`,
          `const free = j.slots.filter(s => s.available);`,
          `pm.test('Créneaux libres disponibles', () => pm.expect(free.length).to.be.above(4));`,
          `pm.collectionVariables.set('slot1', free[0].start);`,
          `pm.collectionVariables.set('slot2', free[Math.min(4, free.length - 1)].start);`,
          `pm.test('Pause déjeuner jamais proposée', () => pm.expect(j.slots.filter(s => s.isBreak).every(s => !s.available)).to.be.true);`],
      }),
      req('Réservation – champs manquants → 400', 'POST', '/api/public/bookings', { body: { doctorId: '{{doctorId}}' }, tests: [status(400)] }),
      req('Réservation – date invalide → 400', 'POST', '/api/public/bookings', {
        body: { doctorId: '{{doctorId}}', date: '27/11/2026', startTime: '10:00', patientName: 'X', patientEmail: 'x@test.tn', patientPhone: '20000000' }, tests: [status(400)],
      }),
      req('Réservation – dimanche (cabinet fermé) → 409 (RM-02)', 'POST', '/api/public/bookings', {
        pre: [`const d = new Date(); d.setUTCDate(d.getUTCDate() + 1); while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + 1); pm.collectionVariables.set('sunday', d.toISOString().slice(0, 10));`],
        body: { doctorId: '{{doctorId}}', date: '{{sunday}}', startTime: '10:00', patientName: 'X', patientEmail: 'x@test.tn', patientPhone: '20000000' }, tests: [status(409)],
      }),
      req('Réservation valide → 201 + jeton de gestion', 'POST', '/api/public/bookings', {
        body: { doctorId: '{{doctorId}}', date: '{{bookingDate}}', startTime: '{{slot1}}', patientName: 'Patient Newman', patientEmail: 'newman.{{runId}}@test.tn', patientPhone: '+216 20 111 222', reason: 'Contrôle' },
        tests: [status(201), fast, `const j = pm.response.json();`,
          `pm.test('Jeton de gestion 64 hex', () => pm.expect(j.managementToken).to.match(/^[0-9a-f]{64}$/));`,
          `pm.collectionVariables.set('mgmtToken', j.managementToken);`,
          `pm.collectionVariables.set('appointmentId', j.appointment.id);`],
      }),
      req('Double réservation du même créneau → 409 (RM-01)', 'POST', '/api/public/bookings', {
        body: { doctorId: '{{doctorId}}', date: '{{bookingDate}}', startTime: '{{slot1}}', patientName: 'Autre', patientEmail: 'autre.{{runId}}@test.tn', patientPhone: '+216 20 333 444' },
        tests: [status(409), `pm.test('Signalé comme conflit', () => pm.expect(pm.response.json().conflict).to.be.true);`],
      }),
      req('Consultation par jeton → CONFIRMED', 'GET', '/api/public/bookings/{{mgmtToken}}', {
        tests: [status(200), `pm.test('Statut CONFIRMED annulable', () => { const j = pm.response.json(); pm.expect(j.status).to.eql('CONFIRMED'); pm.expect(j.canCancel).to.be.true; });`],
      }),
      req('Jeton inconnu → 404', 'GET', '/api/public/bookings/' + '0'.repeat(64), { tests: [status(404)] }),
      req('Annulation par le patient (jeton) → 200', 'POST', '/api/public/bookings/{{mgmtToken}}/cancel', { tests: [status(200)] }),
      req('Après annulation → CANCELLED, plus annulable', 'GET', '/api/public/bookings/{{mgmtToken}}', {
        tests: [status(200), `pm.test('Statut terminal', () => { const j = pm.response.json(); pm.expect(j.status).to.eql('CANCELLED'); pm.expect(j.canCancel).to.be.false; });`],
      }),
      req('Créneau libéré → de nouveau réservable', 'POST', '/api/public/bookings', {
        body: { doctorId: '{{doctorId}}', date: '{{bookingDate}}', startTime: '{{slot1}}', patientName: 'Patient Suivant', patientEmail: 'suivant.{{runId}}@test.tn', patientPhone: '+216 20 555 666' },
        tests: [status(201)],
      }),
    ],
  },
  {
    name: '05 Gestion interne (praticien)',
    item: [
      req('Praticien crée un RDV dans son agenda → 201', 'POST', '/api/appointments', {
        headers: auth('pracToken'),
        body: { patient: { name: 'Patient Cabinet', email: 'cabinet.{{runId}}@test.tn', phone: '+216 21 000 000' }, date: '{{bookingDate}}', timeSlot: { start: '{{slot2}}' }, reason: 'Suivi' },
        tests: [status(201), `const j = pm.response.json(); pm.collectionVariables.set('staffAptId', (j.appointment || j)._id || (j.appointment || j).id);`],
      }),
      req('Le RDV apparaît dans l’agenda du praticien', 'GET', '/api/appointments', {
        headers: auth('pracToken'),
        tests: [status(200), `const j = pm.response.json(); const list = Array.isArray(j) ? j : (j.data || j.appointments || []);`,
          `pm.test('RDV présent', () => pm.expect(list.some(a => (a._id || a.id) === pm.collectionVariables.get('staffAptId'))).to.be.true);`],
      }),
      req('Il n’apparaît pas chez un autre praticien (RM-04)', 'GET', '/api/appointments', {
        headers: auth('prac2Token'),
        tests: [status(200), `const j = pm.response.json(); const list = Array.isArray(j) ? j : (j.data || j.appointments || []);`,
          `pm.test('RDV absent', () => pm.expect(list.some(a => (a._id || a.id) === pm.collectionVariables.get('staffAptId'))).to.be.false);`],
      }),
      req('Clôturer un RDV futur → 409 (RM-03)', 'PATCH', '/api/appointments/{{staffAptId}}/status', {
        headers: auth('pracToken'), body: { status: 'COMPLETED' },
        tests: [status(409), `pm.test('Code NOT_YET_STARTED', () => pm.expect(pm.response.json().code).to.eql('NOT_YET_STARTED'));`],
      }),
      req('Statut cible invalide → 400', 'PATCH', '/api/appointments/{{staffAptId}}/status', {
        headers: auth('pracToken'), body: { status: 'PIRATE' }, tests: [status(400)],
      }),
      req('Un autre praticien ne peut pas l’annuler (cloisonnement) → 404', 'PUT', '/api/appointments/{{staffAptId}}/cancel', {
        headers: auth('prac2Token'), tests: [statusIn([403, 404])],
      }),
      req('Le praticien l’annule → 200', 'PUT', '/api/appointments/{{staffAptId}}/cancel', { headers: auth('pracToken'), tests: [status(200)] }),
      req('Annuler un RDV déjà annulé → 409 (transition interdite)', 'PUT', '/api/appointments/{{staffAptId}}/cancel', { headers: auth('pracToken'), tests: [status(409)] }),
      req('Recherche / liste des patients du praticien', 'GET', '/api/contacts', {
        headers: auth('pracToken'), tests: [status(200), fast, `pm.test('Liste', () => pm.expect(pm.response.json()).to.be.an('array'));`],
      }),
      req('Création de fiche patient → 201', 'POST', '/api/contacts', {
        headers: auth('pracToken'), body: { name: 'Fiche Newman', email: 'fiche.{{runId}}@test.tn', phone: '+216 22 000 000' }, tests: [status(201)],
      }),
      req('Statistiques e-mails', 'GET', '/api/emails/stats', { headers: auth('pracToken'), tests: [status(200), fast] }),
      req('Journal d’audit (admin) – contient l’annulation', 'GET', '/api/admin/audit-logs', {
        headers: auth('adminToken'),
        tests: [status(200), `pm.test('Action APPOINTMENT_CANCELLED_SLOT_FREED tracée', () => pm.expect(JSON.stringify(pm.response.json())).to.include('APPOINTMENT_CANCELLED_SLOT_FREED'));`],
      }),
    ],
  },
];

const collection = {
  info: {
    name: 'MediLawAI – contrat API',
    description: 'Tests de contrat de l’API REST (codes HTTP, structure, rôles, règles métier). Exécution : npm run api (dossier quality).',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5050' },
    { key: 'internalKey', value: 'qa-internal-key-0123456789' },
  ],
  item: folders,
};

fs.writeFileSync(path.join(HERE, 'medilaw.postman_collection.json'), JSON.stringify(collection, null, 2));
console.log('Collection générée :', folders.reduce((n, f) => n + f.item.length, 0), 'requêtes');
