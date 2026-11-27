/**
 * Démarre un environnement de test isolé (n'utilise jamais la base de travail) :
 *   - MongoDB   : celui déjà lancé (CI : conteneur de service) ou mongod.exe local
 *   - Backend   : port 5050, base ai_cabinet_qa, e-mails / n8n / polling désactivés
 *   - Frontend  : build Vite + preview sur le port 4173, branché sur le backend de test
 *
 * Utilisation autonome :  node stack.js   (Ctrl+C pour tout arrêter)
 * Utilisation par run-all.js : import { startStack } from './stack.js'
 */
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

export const QA = {
  mongoUri: process.env.QA_MONGO_URI || 'mongodb://127.0.0.1:27017/ai_cabinet_qa',
  backendPort: Number(process.env.QA_BACKEND_PORT || 5050),
  frontendPort: Number(process.env.QA_FRONTEND_PORT || 4173),
  internalKey: 'qa-internal-key-0123456789',
  jwtSecret: 'qa-jwt-secret-0123456789-abcdefghijklmnop',
};
QA.backendUrl = `http://localhost:${QA.backendPort}`;
QA.frontendUrl = `http://localhost:${QA.frontendPort}`;

const children = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function portOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const s = net.connect(port, host);
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('error', () => resolve(false));
    s.setTimeout(800, () => { s.destroy(); resolve(false); });
  });
}

async function waitFor(check, label, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await check()) return; } catch { /* pas encore prêt */ }
    await wait(500);
  }
  throw new Error(`${label} n'a pas démarré en ${timeoutMs / 1000}s`);
}

function launch(name, cmd, args, opts) {
  const logFile = path.join(HERE, 'reports', `${name}.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const out = fs.openSync(logFile, 'w');
  const isWin = process.platform === 'win32';
  const proc = isWin
    ? spawn([cmd, ...args].join(' '), { stdio: ['ignore', out, out], shell: true, ...opts })
    : spawn(cmd, args, { stdio: ['ignore', out, out], ...opts });
  children.push(proc);
  return proc;
}

function findLocalMongod() {
  if (process.platform !== 'win32') return 'mongod';
  const base = 'C:/Program Files/MongoDB/Server';
  if (!fs.existsSync(base)) return null;
  const versions = fs.readdirSync(base).sort().reverse();
  for (const v of versions) {
    const exe = path.join(base, v, 'bin', 'mongod.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

async function ensureMongo() {
  if (await portOpen(27017)) return 'déjà actif';
  const mongod = findLocalMongod();
  if (!mongod) throw new Error('MongoDB injoignable sur 27017 et mongod introuvable. Installez MongoDB ou lancez-le.');
  const dbPath = path.join(HERE, '.mongo-data');
  fs.mkdirSync(dbPath, { recursive: true });
  launch('mongod', `"${mongod}"`, ['--dbpath', `"${dbPath}"`, '--port', '27017', '--bind_ip', '127.0.0.1']);
  await waitFor(() => portOpen(27017), 'MongoDB', 30000);
  return 'démarré (quality/.mongo-data)';
}

export function backendEnv(extra = {}) {
  return {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(QA.backendPort),
    MONGO_URI: QA.mongoUri,
    JWT_SECRET: QA.jwtSecret,
    INTERNAL_API_KEY: QA.internalKey,
    CORS_ORIGIN: `${QA.frontendUrl},http://127.0.0.1:${QA.frontendPort}`,
    FRONTEND_URL: QA.frontendUrl,
    RATE_LIMIT_MAX: '100000',
    EMAIL_SENDING_DISABLED: 'true',
    N8N_NOTIFY_DISABLED: 'true',
    GMAIL_POLLING_DISABLED: 'true',
    AI_SERVICE_URL: 'http://127.0.0.1:9', // IA externe absente : le backend doit rester fiable
    ...extra,
  };
}

async function backendHealthy() {
  const r = await fetch(`${QA.backendUrl}/health`);
  return r.ok;
}

async function seedReady() {
  // Le seed s'exécute de façon asynchrone après le démarrage : attendre un compte connu
  const r = await fetch(`${QA.backendUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@medilaw.ai', password: 'Password123!' }),
  });
  return r.status === 200;
}

export async function resetQaDatabase() {
  // Base de test vidée à chaque campagne pour des résultats reproductibles
  const { default: mongoose } = await import('../backend/node_modules/mongoose/index.js');
  const conn = await mongoose.createConnection(QA.mongoUri, { serverSelectionTimeoutMS: 3000 }).asPromise();
  await conn.dropDatabase();
  await conn.close();
}

export async function startBackend() {
  if (await portOpen(QA.backendPort)) throw new Error(`Le port ${QA.backendPort} est déjà utilisé : arrêtez l'ancien backend de test.`);
  launch('backend', 'node', ['src/index.js'], { cwd: path.join(ROOT, 'backend'), env: backendEnv() });
  await waitFor(backendHealthy, 'Backend', 45000);
  await waitFor(seedReady, 'Seed de la base de test', 45000);
}

export async function startFrontend() {
  if (await portOpen(QA.frontendPort)) throw new Error(`Le port ${QA.frontendPort} est déjà utilisé.`);
  const env = { ...process.env, VITE_API_BASE_URL: QA.backendUrl, VITE_DEMO_MODE: 'false' };
  const build = spawnSync('npm', ['run', 'build'], { cwd: path.join(ROOT, 'frontend'), env, shell: true, encoding: 'utf8' });
  if (build.status !== 0) throw new Error('Build frontend en échec :\n' + (build.stdout || '') + (build.stderr || ''));
  launch('frontend', 'npx', ['vite', 'preview', '--port', String(QA.frontendPort), '--strictPort'], { cwd: path.join(ROOT, 'frontend'), env });
  await waitFor(() => portOpen(QA.frontendPort), 'Frontend', 30000);
}

export async function startStack({ frontend = true } = {}) {
  const mongo = await ensureMongo();
  await resetQaDatabase();
  await startBackend();
  if (frontend) await startFrontend();
  return { mongo };
}

export function stopStack() {
  for (const c of children.reverse()) {
    if (c.exitCode !== null) continue;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(c.pid), '/T', '/F'], { stdio: 'ignore' });
    else c.kill('SIGTERM');
  }
  children.length = 0;
}


if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startStack()
    .then((s) => {
      console.log(`MongoDB : ${s.mongo}\nBackend de test : ${QA.backendUrl}\nFrontend de test : ${QA.frontendUrl}\nCtrl+C pour arrêter.`);
    })
    .catch((e) => { console.error(e.message); stopStack(); process.exit(1); });
  process.on('SIGINT', () => { stopStack(); process.exit(0); });
}
