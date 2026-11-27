/**
 * Hachage / vérification bcrypt dans un pool de worker threads.
 *
 * bcryptjs est du JavaScript pur : exécuté sur le thread principal, chaque vérification (~65 ms
 * au coût 10) bloque toutes les autres requêtes. Sous 20 connexions simultanées, les connexions
 * s'empilaient (p97,5 > 2 s, mesuré par quality/perf/load-test.js). Le pool répartit le calcul
 * sur plusieurs cœurs sans dépendance native (portable Windows / Linux / Alpine).
 */
import { Worker } from 'worker_threads';
import { createRequire } from 'module';
import os from 'os';
import bcrypt from 'bcryptjs';

export const BCRYPT_COST = 10;

const WORKER_SOURCE = `
const { parentPort } = require('worker_threads');
const bcrypt = require(${JSON.stringify(createRequire(import.meta.url).resolve('bcryptjs'))});
parentPort.on('message', ({ id, op, a, b }) => {
  try {
    const result = op === 'hash' ? bcrypt.hashSync(a, b) : bcrypt.compareSync(a, b);
    parentPort.postMessage({ id, result });
  } catch (e) {
    parentPort.postMessage({ id, error: e.message });
  }
});`;

const SIZE = Math.max(1, Math.min(Number(process.env.BCRYPT_WORKERS) || Math.floor(os.cpus().length / 2), 8));
let workers = null;
let next = 0;
let seq = 0;
const pending = new Map();
const IDLE_MS = 2000;
let idleTimer = null;

/** Pool inactif : les workers sont arrêtés (recréés à la demande) pour ne jamais retenir le processus */
function scheduleIdleShutdown() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (pending.size || !workers) return;
    const ws = workers;
    workers = null;
    for (const w of ws) w.terminate().catch(() => {});
  }, IDLE_MS);
  idleTimer.unref();
}

function pool() {
  if (workers) return workers;
  try {
    workers = Array.from({ length: SIZE }, () => {
      const w = new Worker(WORKER_SOURCE, { eval: true });
      w.busy = 0;
      w.unref(); // inactif : n'empêche pas l'arrêt du processus
      w.on('message', ({ id, result, error }) => {
        const p = pending.get(id);
        if (!p) return;
        pending.delete(id);
        if (--w.busy === 0) w.unref();
        if (!pending.size) scheduleIdleShutdown();
        error ? p.reject(new Error(error)) : p.resolve(result);
      });
      w.on('error', () => { workers = null; }); // repli sur le thread principal
      return w;
    });
  } catch {
    workers = [];
  }
  return workers;
}

function run(op, a, b) {
  const ws = pool();
  if (!ws.length) return op === 'hash' ? bcrypt.hash(a, b) : bcrypt.compare(a, b);
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    const w = ws[next++ % ws.length];
    if (w.busy++ === 0) w.ref(); // tâche en cours : le processus attend le résultat
    w.postMessage({ id, op, a, b });
  });
}

export const hashPassword = (plain) => run('hash', String(plain), BCRYPT_COST);
export const verifyPassword = (plain, hash) => {
  if (typeof plain !== 'string' || typeof hash !== 'string' || !hash) return Promise.resolve(false);
  return run('compare', plain, hash);
};
