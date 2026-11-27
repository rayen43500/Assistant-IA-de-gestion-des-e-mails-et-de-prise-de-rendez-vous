/**
 * Analyse dynamique ciblée (ISO 25010 §6.6) sur l'application en cours d'exécution.
 * Complète OWASP ZAP (exécuté dans le pipeline CI via Docker) par des sondes OWASP Top 10
 * spécifiques au métier, exécutables sans Docker :
 *   A01 contrôle d'accès (IDOR, escalade)   A02 jetons            A03 injections NoSQL
 *   A05 en-têtes / CORS / fuite d'erreurs   A07 authentification  A04 limitation de débit
 *
 *   node dast/security-probe.js [baseUrl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || process.env.QA_BACKEND_URL || 'http://localhost:5050';
const checks = [];

async function check(owasp, name, fn) {
  try {
    const detail = await fn();
    checks.push({ owasp, name, ok: true, detail: detail || '' });
    console.log(`✔ [${owasp}] ${name}`);
  } catch (e) {
    checks.push({ owasp, name, ok: false, detail: e.message });
    console.log(`✖ [${owasp}] ${name} — ${e.message}`);
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const api = (p, opts = {}) => fetch(BASE + p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
const post = (p, body, headers) => api(p, { method: 'POST', body: JSON.stringify(body), headers });

async function token(email) {
  const r = await post('/api/auth/login', { email, password: 'Password123!' });
  return (await r.json()).token;
}

const prac = await token('dr.bensalem@cabinet-ai.tn');
const prac2 = await token('dr.nadia@cabinet-ai.tn');
const H = (t) => ({ Authorization: `Bearer ${t}` });

// ---------- A05 Mauvaise configuration de sécurité ----------
await check('A05', 'En-têtes de sécurité HTTP (helmet)', async () => {
  const r = await api('/health');
  const h = r.headers;
  const missing = ['x-content-type-options', 'x-frame-options', 'strict-transport-security', 'content-security-policy', 'referrer-policy']
    .filter((k) => !h.get(k));
  assert(!missing.length, `en-têtes absents : ${missing.join(', ')}`);
  assert(!h.get('x-powered-by'), 'X-Powered-By divulgue la technologie');
});
await check('A05', 'CORS : une origine inconnue n’est pas autorisée', async () => {
  const r = await api('/api/public/doctors', { headers: { Origin: 'https://site-malveillant.example' } });
  const allow = r.headers.get('access-control-allow-origin');
  assert(allow !== '*' && allow !== 'https://site-malveillant.example', `Access-Control-Allow-Origin = ${allow}`);
});
await check('A05', 'Route inconnue : pas de pile d’exécution divulguée', async () => {
  const r = await api('/api/route-inexistante-xyz');
  const t = await r.text();
  assert(r.status === 404, `statut ${r.status}`);
  assert(!/at .*\.js:\d+/.test(t), 'stack trace dans la réponse');
});
await check('A05', 'JSON malformé : erreur 400 sans stack trace', async () => {
  const r = await api('/api/auth/login', { method: 'POST', body: '{"email":' });
  const t = await r.text();
  assert(r.status === 400, `statut ${r.status}`);
  assert(!/node_modules|at .*\.js:\d+/.test(t), 'détails internes divulgués');
});
await check('A05', 'Charge utile volumineuse (> 2 Mo) refusée', async () => {
  const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'x'.repeat(3 * 1024 * 1024), password: 'y' }) });
  assert(r.status === 413, `statut ${r.status}`);
});

// ---------- A03 Injection ----------
await check('A03', 'Injection NoSQL ($ne / $gt) à la connexion', async () => {
  for (const body of [{ email: { $ne: null }, password: { $ne: null } }, { email: 'admin@medilaw.ai', password: { $gt: '' } }]) {
    const r = await post('/api/auth/login', body);
    assert(r.status !== 200, `connexion obtenue par injection : ${JSON.stringify(body)}`);
    assert(r.status < 500, `erreur serveur ${r.status}`);
  }
});
await check('A03', 'Injection NoSQL dans le jeton de gestion public', async () => {
  const r = await api('/api/public/bookings/' + encodeURIComponent('{"$ne":null}'));
  assert(r.status === 404, `statut ${r.status}`);
});
await check('A03', 'Identifiant MongoDB invalide : pas d’erreur 500', async () => {
  for (const p of ['/api/public/doctors/abc/availability?date=2026-12-01', '/api/public/doctors/%7B%22%24ne%22%3A1%7D/availability?date=2026-12-01']) {
    const r = await api(p);
    const t = await r.text();
    assert(r.status < 500, `${p} → ${r.status} ${t.slice(0, 80)}`);
  }
});

// ---------- A07 Authentification ----------
await check('A07', 'Routes protégées sans jeton → 401', async () => {
  for (const p of ['/api/appointments', '/api/emails', '/api/contacts', '/api/admin/overview', '/api/schedule/me', '/api/auth/me']) {
    const r = await api(p);
    assert(r.status === 401, `${p} → ${r.status}`);
  }
});
await check('A02', 'Jeton alg=none ou signature falsifiée refusé', async () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const [, payload] = prac.split('.');
  for (const t of [`${b64({ alg: 'none', typ: 'JWT' })}.${payload}.`, `${prac.split('.')[0]}.${b64({ id: '000000000000000000000000' })}.${prac.split('.')[2]}`]) {
    const r = await api('/api/auth/me', { headers: H(t) });
    assert(r.status === 401, `statut ${r.status}`);
  }
});
await check('A07', 'Énumération de comptes : même réponse pour e-mail inconnu et mauvais mot de passe', async () => {
  const a = await post('/api/auth/login', { email: 'inconnu.zz@test.tn', password: 'Password123!' });
  const b = await post('/api/auth/login', { email: 'dr.bensalem@cabinet-ai.tn', password: 'mauvais' });
  assert(a.status === b.status, `${a.status} vs ${b.status}`);
  assert((await a.json()).message === (await b.json()).message, 'messages différents');
});

// ---------- A01 Contrôle d'accès ----------
await check('A01', 'Escalade de privilèges à l’inscription impossible', async () => {
  const r = await post('/api/auth/register', { name: 'Pirate', email: `pirate.${Date.now()}@test.tn`, password: 'Password123!', role: 'SUPER_ADMIN' });
  const j = await r.json();
  assert(j.user?.role !== 'SUPER_ADMIN' && j.user?.role !== 'ADMIN', `rôle obtenu : ${j.user?.role}`);
});
await check('A01', 'Un praticien ne peut pas accéder à l’administration', async () => {
  for (const p of ['/api/admin/overview', '/api/admin/users', '/api/admin/audit-logs']) {
    const r = await api(p, { headers: H(prac) });
    assert(r.status === 403, `${p} → ${r.status}`);
  }
});
await check('A01', 'IDOR : un praticien ne peut ni lire ni annuler le RDV d’un confrère', async () => {
  const list = await (await api('/api/appointments', { headers: H(prac) })).json();
  const mine = (Array.isArray(list) ? list : list.data || []).find((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status));
  assert(mine, 'aucun RDV actif pour le test');
  const others = await (await api('/api/appointments', { headers: H(prac2) })).json();
  assert(!(Array.isArray(others) ? others : others.data || []).some((a) => (a._id || a.id) === (mine._id || mine.id)), 'RDV visible chez le confrère');
  const r = await api(`/api/appointments/${mine._id || mine.id}/cancel`, { method: 'PUT', headers: H(prac2) });
  assert(r.status === 404 || r.status === 403, `annulation par un confrère → ${r.status}`);
  return `RDV ${mine._id || mine.id} protégé`;
});
await check('A01', 'Routes internes n8n refusées sans clé ou avec une fausse clé', async () => {
  for (const headers of [{}, { 'x-internal-key': 'mauvaise-cle' }]) {
    const r = await api('/api/appointments/reminders-due', { headers });
    assert([401, 403].includes(r.status), `statut ${r.status}`);
  }
});
await check('A01', 'Annuaire public : aucune donnée personnelle des praticiens (e-mail)', async () => {
  const t = await (await api('/api/public/doctors')).text();
  assert(!/professionalEmail|@cabinet-ai\.tn/.test(t), 'e-mails exposés');
});

// ---------- A04 Conception : limitation de débit ----------
await check('A04', 'Limiteur de débit actif sur /api (en-têtes RateLimit)', async () => {
  const r = await api('/api/public/doctors');
  const has = r.headers.get('ratelimit-limit') || r.headers.get('ratelimit') || r.headers.get('x-ratelimit-limit') || r.headers.get('ratelimit-policy');
  assert(has, 'aucun en-tête RateLimit');
  return `limite configurée : ${has}`;
});

const outDir = path.join(HERE, '..', 'reports');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'dast-probe.json'), JSON.stringify({ date: new Date().toISOString(), base: BASE, checks }, null, 2));
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} contrôles conformes`);
process.exit(failed.length ? 1 : 0);
