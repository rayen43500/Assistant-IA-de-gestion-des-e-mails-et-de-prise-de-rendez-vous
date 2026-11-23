/**
 * Central Orchestrator & Production Runner - MediLawAI (Local 2026)
 * Lance et supervise l'ensemble des 4 services :
 * 1. Microservice IA (Port 8000)
 * 2. Moteur n8n (Port 5678)
 * 3. Backend Express (Port 5000)
 * 4. Frontend Vite (Port 5173)
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Synchronisation des workflows n8n dans la base SQLite locale
try {
  console.log('[Suite] Synchronisation des 5 workflows n8n (Master + 4 spécialisés)...');
  execSync('node --experimental-sqlite scripts/sync-n8n-db.js', { cwd: rootDir, stdio: 'ignore' });
  console.log('[Suite] ✅ Workflows n8n synchronisés sans erreur.');
} catch (e) {
  console.warn('[Suite] Avertissement sync n8n :', e.message);
}

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const nodeCmd = process.execPath;

console.log('=======================================================');
console.log('🚀 DÉMARRAGE DE LA SUITE COMPLÈTE MEDILAWAI (LOCAL 2026)');
console.log('=======================================================');

const services = [
  {
    name: 'Microservice IA (NLP & RAG)',
    port: 8000,
    cmd: nodeCmd,
    args: [path.join(rootDir, 'ai-service', 'server.js')],
    healthUrl: 'http://localhost:8000/health'
  },
  {
    name: 'Moteur d’Automatisation n8n (Interface Graphique & Canvas)',
    port: 5678,
    cmd: npxCmd,
    args: ['n8n', 'start'],
    healthUrl: 'http://localhost:5678'
  },
  {
    name: 'Backend API Express',
    port: 5000,
    cmd: nodeCmd,
    args: [path.join(rootDir, 'backend', 'src', 'index.js')],
    healthUrl: 'http://localhost:5000/health'
  },
  {
    name: 'Frontend Web React (Vite)',
    port: 5173,
    cmd: npmCmd,
    args: ['--prefix', path.join(rootDir, 'frontend'), 'run', 'dev', '--', '--host', '0.0.0.0'],
    healthUrl: 'http://localhost:5173'
  }
];

const processes = [];

services.forEach(svc => {
  console.log(`[Suite] Démarrage de ${svc.name} sur le port ${svc.port}...`);
  const proc = spawn(svc.cmd, svc.args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWindows,
    env: {
      ...process.env,
      N8N_AI_ASSISTANT_ENABLED: 'false',
      N8N_AI_ROUTER_ENABLED: 'false'
    }
  });

  proc.on('error', err => {
    console.error(`[${svc.name}] Erreur :`, err.message);
  });

  processes.push(proc);
});

// Arrêt propre lors de SIGINT / SIGTERM
process.on('SIGINT', () => {
  console.log('\n[Suite] Arrêt de tous les services...');
  processes.forEach(p => p.kill());
  process.exit(0);
});

process.on('SIGTERM', () => {
  processes.forEach(p => p.kill());
  process.exit(0);
});
