/**
 * Importe et publie (active) les workflows MediLawAI dans n8n via la CLI officielle.
 * À lancer quand n8n est ARRÊTÉ (la CLI écrit dans la base n8n).
 *
 *   node n8n/import-workflows.js
 *   node n8n/import-workflows.js --docker   (dans le conteneur cabinet_n8n)
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WF_DIR = path.join(__dirname, 'workflows');
const docker = process.argv.includes('--docker');

// Anciens doublons créés par les versions précédentes du projet
const OBSOLETE_IDS = ['LQUNf7pxZQ9u6px7', 'h2gtLeQmmaLQL8gv', 'UHkIJJlqqXgeCHpg', 'XXcNXRysx0WF3kWO'];
// Workflows à activer (déclencheurs webhook / cron)
const PUBLISH = ['4d9McL2J7pagy5Df', 'w55mWLlk6GBvxuVQ', 'gHsvnnDjW4SBALov', 'p61YDYKHJlnFgNRN', 'EmailEvents00001'];

// Sous Windows, la CLI n8n peut planter À LA SORTIE (assertion libuv async.c) après avoir réussi.
const isExitCrash = (e) => /UV_HANDLE_CLOSING|async.c/.test(String(e.stderr || '') + String(e.message || ''));

const n8n = (args) => {
  const cmd = docker ? `docker compose exec -T n8n n8n ${args}` : `n8n ${args}`;
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', shell: true, env: { ...process.env, N8N_BLOCK_ENV_ACCESS_IN_NODE: 'false' } });
};

// 1. Supprimer les doublons obsolètes (base SQLite locale uniquement)
if (!docker) {
  const dbPath = path.join(process.env.N8N_USER_FOLDER || process.env.USERPROFILE || process.env.HOME, '.n8n', 'database.sqlite');
  if (fs.existsSync(dbPath)) {
    try {
      const { DatabaseSync } = await import('node:sqlite');
      const db = new DatabaseSync(dbPath);
      for (const id of OBSOLETE_IDS) {
        for (const table of ['shared_workflow', 'workflow_history', 'webhook_entity', 'workflow_statistics', 'workflows_tags']) {
          try { db.prepare(`DELETE FROM ${table} WHERE workflowId = ?`).run(id); } catch {}
        }
        const r = db.prepare('DELETE FROM workflow_entity WHERE id = ?').run(id);
        if (r.changes) console.log(`🗑  Doublon supprimé : ${id}`);
      }
      db.close();
    } catch (e) {
      console.warn('⚠️  Nettoyage des doublons ignoré :', e.message);
    }
  }
}

// 2. Importer chaque workflow (mise à jour si l'ID existe déjà)
for (const file of fs.readdirSync(WF_DIR).filter(f => f.endsWith('.json'))) {
  const input = docker ? `/workflows/${file}` : path.join(WF_DIR, file);
  try {
    n8n(`import:workflow --input="${input}"`);
    console.log(`✔ Importé : ${file}`);
  } catch (e) {
    if (isExitCrash(e)) { console.log(`✔ Importé : ${file}`); continue; }
    console.error(`✖ Import ${file} :`, (e.stderr || e.message).toString().split('\n').slice(-3).join(' '));
  }
}

// 3. Publier (activer) les workflows à déclencheur
for (const id of PUBLISH) {
  try {
    n8n(`publish:workflow --id=${id}`);
    console.log(`▶ Publié / actif : ${id}`);
  } catch (e) {
    if (isExitCrash(e)) { console.log(`▶ Publié / actif : ${id}`); continue; }
    console.error(`✖ Publication ${id} :`, (e.stderr || e.message).toString().split('\n').slice(-3).join(' '));
  }
}
console.log('\nTerminé. Démarrez n8n (n8n start) : les webhooks /webhook/* sont actifs.');
