import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const dbPath = path.join(process.env.USERPROFILE, '.n8n', 'database.sqlite');
const db = new DatabaseSync(dbPath);

console.log('--- PURGING OLD WORKFLOW HISTORY AND CORRUPT ENTRIES ---');

// 1. Check all tables for whatsApp
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
for (const t of tables) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${t.name})`).all().map(c => c.name);
    for (const c of cols) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}" WHERE "${c}" LIKE '%whatsApp%'`).get();
        if (count && count.c > 0) {
          console.log(`Found in table: ${t.name}, column: ${c}, count: ${count.c}`);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

// 2. Load the clean workflows
const workflowsDir = path.join(process.cwd(), 'n8n', 'workflows');
const emailWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'email-ingestion-workflow.json'), 'utf8'));
const reminderWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'appointment-reminder-24h-workflow.json'), 'utf8'));
const calendarWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'calendar-sync-workflow.json'), 'utf8'));
const emergencyWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'emergency-samu-escalation-workflow.json'), 'utf8'));
const masterWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'master-orchestrator-run-all-workflow.json'), 'utf8'));

// Delete all old history and old executions so n8n doesn't restore obsolete versions!
db.prepare('DELETE FROM workflow_history').run();
try { db.prepare('DELETE FROM execution_data').run(); } catch (e) {}
try { db.prepare('DELETE FROM execution_entity').run(); } catch (e) {}
console.log('Purged workflow_history and old executions completely.');

// Delete any draft temporary sessions
try {
  db.prepare('DELETE FROM workflow_builder_session').run();
  console.log('Purged workflow_builder_session table.');
} catch (e) {}
try {
  db.prepare('DELETE FROM ai_builder_temporary_workflow').run();
  console.log('Purged ai_builder_temporary_workflow table.');
} catch (e) {}

const now = new Date().toISOString();
const newVersionId = 'clean-v2-' + Date.now();

import crypto from 'crypto';

// Clean up workflow_entity: update all workflows and set new versionId
const mappings = [
  { id: '4d9McL2J7pagy5Df', wf: emailWf },
  { id: 'LQUNf7pxZQ9u6px7', wf: emailWf },
  { id: 'w55mWLlk6GBvxuVQ', wf: reminderWf },
  { id: 'h2gtLeQmmaLQL8gv', wf: reminderWf },
  { id: 'gHsvnnDjW4SBALov', wf: calendarWf },
  { id: 'UHkIJJlqqXgeCHpg', wf: calendarWf },
  { id: 'p61YDYKHJlnFgNRN', wf: emergencyWf },
  { id: 'XXcNXRysx0WF3kWO', wf: emergencyWf },
];

for (const m of mappings) {
  const versionId = crypto.randomUUID();
  db.prepare(`
    UPDATE workflow_entity 
    SET name = ?, nodes = ?, connections = ?, versionId = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    m.wf.name,
    JSON.stringify(m.wf.nodes),
    JSON.stringify(m.wf.connections),
    versionId,
    now,
    m.id
  );
  
  // Re-insert clean version in workflow_history so history matches current nodes exactly
  db.prepare(`
    INSERT INTO workflow_history (versionId, workflowId, nodes, connections, authors, autosaved, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, '[]', 0, ?, ?)
  `).run(
    versionId,
    m.id,
    JSON.stringify(m.wf.nodes),
    JSON.stringify(m.wf.connections),
    now,
    now
  );
  console.log(`Cleaned and re-versioned workflow: ${m.id} (${m.wf.name})`);
}

// Master workflow
const masterId = 'MasterRunAll0001';
const masterVersionId = crypto.randomUUID();
const masterExists = db.prepare('SELECT id FROM workflow_entity WHERE id = ?').get(masterId);
if (masterExists) {
  db.prepare(`
    UPDATE workflow_entity 
    SET name = ?, nodes = ?, connections = ?, versionId = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    masterWf.name,
    JSON.stringify(masterWf.nodes),
    JSON.stringify(masterWf.connections),
    masterVersionId,
    now,
    masterId
  );
} else {
  db.prepare(`
    INSERT INTO workflow_entity (
      id, name, active, nodes, connections, settings, staticData, pinData,
      versionId, triggerCount, meta, createdAt, updatedAt, isArchived, versionCounter
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    masterId,
    masterWf.name,
    0,
    JSON.stringify(masterWf.nodes),
    JSON.stringify(masterWf.connections),
    JSON.stringify({}),
    null,
    JSON.stringify({}),
    masterVersionId,
    0,
    JSON.stringify({}),
    now,
    now,
    0,
    1
  );
}

db.prepare(`
  INSERT INTO workflow_history (versionId, workflowId, nodes, connections, authors, autosaved, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, '[]', 0, ?, ?)
`).run(
  masterVersionId,
  masterId,
  JSON.stringify(masterWf.nodes),
  JSON.stringify(masterWf.connections),
  now,
  now
);

// Link all workflows to default project in shared_workflow so n8n UI finds them!
const defaultProject = db.prepare('SELECT id FROM project LIMIT 1').get();
const projectId = defaultProject ? defaultProject.id : 'cO8YzGq4VQ0cDfSS';

const allWfIds = [
  masterId,
  '4d9McL2J7pagy5Df',
  'LQUNf7pxZQ9u6px7',
  'w55mWLlk6GBvxuVQ',
  'h2gtLeQmmaLQL8gv',
  'gHsvnnDjW4SBALov',
  'UHkIJJlqqXgeCHpg',
  'p61YDYKHJlnFgNRN',
  'XXcNXRysx0WF3kWO'
];

for (const wId of allWfIds) {
  db.prepare(`
    INSERT OR REPLACE INTO shared_workflow (workflowId, projectId, role, createdAt, updatedAt)
    VALUES (?, ?, 'workflow:owner', ?, ?)
  `).run(wId, projectId, now, now);
}

console.log(`✅ All workflows linked to project ${projectId} in shared_workflow.`);
console.log('✅ All workflows cleaned, old autosaves purged, and SQLite synchronized.');
