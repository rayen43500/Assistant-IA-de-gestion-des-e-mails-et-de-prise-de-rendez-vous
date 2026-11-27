/**
 * Test de performance (ISO 25010 §6.2) — autocannon, 20 utilisateurs simultanés.
 * Exigence : p97,5 < 500 ms et 0 erreur sur les parcours de lecture courants.
 * La connexion (bcrypt, volontairement coûteux) est mesurée à part, avec un seuil documenté.
 *
 *   node perf/load-test.js [baseUrl]     (stack de test démarré)
 */
import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || process.env.QA_BACKEND_URL || 'http://localhost:5050';
const CONNECTIONS = Number(process.env.PERF_CONNECTIONS || 20);
const DURATION = Number(process.env.PERF_DURATION || 15);

async function getToken() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.bensalem@cabinet-ai.tn', password: 'Password123!' }),
  });
  if (!r.ok) throw new Error(`Connexion impossible (${r.status})`);
  return (await r.json()).token;
}

function nextTuesday() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 2);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function run(opts) {
  return new Promise((resolve, reject) => {
    autocannon({ connections: CONNECTIONS, duration: DURATION, ...opts }, (err, res) => (err ? reject(err) : resolve(res)));
  });
}

const token = await getToken();
const doctors = await (await fetch(`${BASE}/api/public/doctors`)).json();
const doctorId = doctors[0]?._id;
const auth = { Authorization: `Bearer ${token}` };

const scenarios = [
  { name: 'GET /health', url: `${BASE}/health`, p975: 500 },
  { name: 'GET /api/public/doctors', url: `${BASE}/api/public/doctors`, p975: 500 },
  { name: 'GET disponibilités praticien', url: `${BASE}/api/public/doctors/${doctorId}/availability?date=${nextTuesday()}`, p975: 500 },
  { name: 'GET /api/appointments (authentifié)', url: `${BASE}/api/appointments`, headers: auth, p975: 500 },
  { name: 'GET /api/emails (authentifié)', url: `${BASE}/api/emails`, headers: auth, p975: 500 },
  { name: 'GET /api/contacts (authentifié)', url: `${BASE}/api/contacts`, headers: auth, p975: 500 },
  {
    name: 'POST /api/auth/login (bcrypt)', url: `${BASE}/api/auth/login`, method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.bensalem@cabinet-ai.tn', password: 'Password123!' }),
    p975: 2000, // hachage bcrypt coût 10 : coût CPU volontaire contre la force brute
  },
];

const results = [];
for (const s of scenarios) {
  const res = await run({ url: s.url, method: s.method || 'GET', headers: s.headers, body: s.body });
  const errors = res.errors + res.timeouts + (res.non2xx || 0);
  const row = {
    scenario: s.name,
    connexions: CONNECTIONS,
    dureeS: DURATION,
    requetes: res.requests.total,
    reqParSec: Math.round(res.requests.average),
    latenceMoyMs: res.latency.average,
    p50Ms: res.latency.p50,
    p90Ms: res.latency.p90,
    p975Ms: res.latency.p97_5,
    p99Ms: res.latency.p99,
    maxMs: res.latency.max,
    erreurs: errors,
    seuilP975Ms: s.p975,
  };
  row.ok = row.p975Ms < s.p975 && errors === 0;
  results.push(row);
  console.log(`${row.ok ? '✔' : '✖'} ${s.name.padEnd(40)} ${String(row.reqParSec).padStart(6)} req/s  p50 ${row.p50Ms} ms  p97.5 ${row.p975Ms} ms  (seuil ${s.p975})  erreurs ${errors}`);
}

const outDir = path.join(HERE, '..', 'reports');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'perf-results.json'), JSON.stringify({ date: new Date().toISOString(), base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `\n${failed.length} scénario(s) hors seuil` : '\nTous les scénarios respectent leur seuil');
process.exit(failed.length ? 1 : 0);
