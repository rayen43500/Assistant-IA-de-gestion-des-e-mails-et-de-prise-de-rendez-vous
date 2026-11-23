import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const dbPath = path.join(process.env.USERPROFILE, '.n8n', 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  console.error('n8n database not found at:', dbPath);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);

const workflowsDir = path.join(process.cwd(), 'n8n', 'workflows');
const emailWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'email-ingestion-workflow.json'), 'utf8'));
const reminderWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'appointment-reminder-24h-workflow.json'), 'utf8'));
const calendarWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'calendar-sync-workflow.json'), 'utf8'));
const emergencyWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'emergency-samu-escalation-workflow.json'), 'utf8'));
const masterWf = JSON.parse(fs.readFileSync(path.join(workflowsDir, 'master-orchestrator-run-all-workflow.json'), 'utf8'));

const now = new Date().toISOString();

// Update existing specific IDs to guarantee that whichever the user opens, it has 0 missing parameters!
const updates = [
  // 1. Email Ingestion
  { id: '4d9McL2J7pagy5Df', wf: emailWf },
  { id: 'LQUNf7pxZQ9u6px7', wf: emailWf },
  // 2. Appointment Reminder
  { id: 'w55mWLlk6GBvxuVQ', wf: reminderWf },
  { id: 'h2gtLeQmmaLQL8gv', wf: reminderWf },
  // 3. Calendar Sync
  { id: 'gHsvnnDjW4SBALov', wf: calendarWf },
  { id: 'UHkIJJlqqXgeCHpg', wf: calendarWf },
  // 4. Emergency Escalation
  { id: 'p61YDYKHJlnFgNRN', wf: emergencyWf },
  { id: 'XXcNXRysx0WF3kWO', wf: emergencyWf },
];

for (const item of updates) {
  const existing = db.prepare('SELECT id FROM workflow_entity WHERE id = ?').get(item.id);
  if (existing) {
    db.prepare(`
      UPDATE workflow_entity 
      SET name = ?, nodes = ?, connections = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      item.wf.name,
      JSON.stringify(item.wf.nodes),
      JSON.stringify(item.wf.connections),
      now,
      item.id
    );
    console.log(`Updated workflow ${item.id} -> ${item.wf.name}`);
  }
}

// Ensure Master Orchestrator workflow exists
const masterId = 'MasterRunAll0001';
const existingMaster = db.prepare('SELECT id FROM workflow_entity WHERE id = ?').get(masterId);
if (existingMaster) {
  db.prepare(`
    UPDATE workflow_entity 
    SET name = ?, nodes = ?, connections = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    masterWf.name,
    JSON.stringify(masterWf.nodes),
    JSON.stringify(masterWf.connections),
    now,
    masterId
  );
  console.log(`Updated Master workflow ${masterId}`);
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
    'v1',
    0,
    JSON.stringify({}),
    now,
    now,
    0,
    1
  );
  console.log(`Inserted Master workflow ${masterId}`);
}

// Ensure all workflows are in shared_workflow
const defaultProject = db.prepare('SELECT id FROM project LIMIT 1').get();
const projectId = defaultProject ? defaultProject.id : 'cO8YzGq4VQ0cDfSS';
const allIds = [masterId, ...updates.map(u => u.id)];
for (const wId of allIds) {
  db.prepare(`
    INSERT OR REPLACE INTO shared_workflow (workflowId, projectId, role, createdAt, updatedAt)
    VALUES (?, ?, 'workflow:owner', ?, ?)
  `).run(wId, projectId, now, now);
}

const all = db.prepare('SELECT id, name, updatedAt FROM workflow_entity').all();
console.log('All workflows in n8n database:', all);
