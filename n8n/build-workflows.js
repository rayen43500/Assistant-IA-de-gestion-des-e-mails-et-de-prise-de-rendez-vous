/**
 * Génère les workflows n8n (format d'import officiel) dans n8n/workflows/.
 *
 *   node n8n/build-workflows.js
 *
 * Toutes les URLs backend utilisent $env.BACKEND_URL (défaut http://localhost:5000) :
 * n8n doit être lancé avec N8N_BLOCK_ENV_ACCESS_IN_NODE=false (déjà fait dans
 * docker-compose.yml, scripts/runner.js et demarrer-tout.bat).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'workflows');
const B = "{{ $env.BACKEND_URL || 'http://localhost:5000' }}";

const webhook = (name, pathName, webhookId, position) => ({
  parameters: { httpMethod: 'POST', path: pathName, responseMode: 'lastNode', options: {} },
  name, type: 'n8n-nodes-base.webhook', typeVersion: 2, position, webhookId,
});
const manual = (position) => ({ parameters: {}, name: 'Test manuel', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position });
const http = (name, { method = 'POST', url, body = null, position, continueOnFail = true }) => ({
  parameters: {
    method,
    url: `=${url}`,
    // Clé partagée avec le backend (routes internes protégées par INTERNAL_API_KEY)
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'x-internal-key', value: "={{ $env.INTERNAL_API_KEY || '' }}" }] },
    ...(body ? { sendBody: true, specifyBody: 'json', jsonBody: `={{ JSON.stringify(${body}) }}` } : {}),
    options: { timeout: 30000 },
  },
  name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position,
  ...(continueOnFail ? { onError: 'continueRegularOutput' } : {}),
});
const ifBool = (name, expr, position) => ({
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: `${name}-c1`, leftValue: `={{ ${expr} }}`, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and',
    },
    options: {},
  },
  name, type: 'n8n-nodes-base.if', typeVersion: 2, position,
});
const setFields = (name, fields, position) => ({
  parameters: {
    assignments: { assignments: fields.map(([n, v, t = 'string'], i) => ({ id: `${name}-${i}`, name: n, value: v, type: t })) },
    options: {},
  },
  name, type: 'n8n-nodes-base.set', typeVersion: 3.4, position,
});
const link = (...pairs) => {
  const c = {};
  for (const [from, to, output = 0] of pairs) {
    c[from] ??= { main: [] };
    while (c[from].main.length <= output) c[from].main.push([]);
    c[from].main[output].push({ node: to, type: 'main', index: 0 });
  }
  return c;
};
const wf = (id, name, nodes, connections, description) => ({
  id, name, nodes, connections, active: false,
  settings: { executionOrder: 'v1', timezone: 'Africa/Tunis', saveManualExecutions: true },
  pinData: {}, meta: { templateCredsSetupCompleted: true, description },
});

const SAMPLE_EMAIL = `$json.body?.subject ? $json.body : {
  senderName: 'Sami Chaabane',
  senderEmail: 'sami.chaabane@example.tn',
  subject: 'Demande de rendez-vous',
  body: 'Bonjour, je souhaite un rendez-vous avec le Dr Ben Salem jeudi à 10h00 pour une consultation de suivi.'
}`;

const workflows = [
  wf('4d9McL2J7pagy5Df', '1. Ingestion E-mail → IA → Réservation automatique', [
    manual([0, 0]),
    webhook('Webhook ingest-email', 'ingest-email', '7b3b6a52-1d7e-4c51-9a0e-ingest000001', [0, 200]),
    setFields('Normaliser l\'e-mail', [
      ['email', `={{ ${SAMPLE_EMAIL} }}`, 'object'],
    ], [220, 100]),
    http('Backend : analyse IA + décision RDV', {
      url: `${B}/api/emails/ingest`,
      body: `{
        senderName: $json.email.senderName || $json.email.sender?.name || '',
        senderEmail: $json.email.senderEmail || $json.email.sender?.email || $json.email.from,
        recipient: $json.email.recipient || $json.email.to || 'contact@medilawai.com',
        subject: $json.email.subject || '',
        body: $json.email.body || $json.email.text || '',
        threadId: $json.email.threadId || null,
        rfcMessageId: $json.email.messageId || null,
        autoSend: $json.email.autoSend === true
      }`,
      position: [460, 100],
    }),
    ifBool('Urgence vitale ?', '$json.isEmergency === true', [700, 100]),
    http('Déclencher escalade urgence', {
      url: "={{ ($env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook') }}/emergency-alert".slice(1),
      body: `{ emailId: $json._id, patient: $json.sender, subject: $json.subject, excerpt: ($json.body || '').slice(0, 300) }`,
      position: [940, 0],
    }),
    setFields('Résultat', [
      ['decision', '={{ $json.decision }}'],
      ['statut', '={{ $json.status }}'],
      ['praticien', "={{ $json.practitioner?.name || 'à préciser par le patient' }}"],
      ['reponseEnvoyee', '={{ $json.reply?.sent === true }}', 'boolean'],
      ['brouillon', '={{ $json.draftReply }}'],
    ], [940, 200]),
  ], link(
    ['Test manuel', 'Normaliser l\'e-mail'],
    ['Webhook ingest-email', 'Normaliser l\'e-mail'],
    ['Normaliser l\'e-mail', 'Backend : analyse IA + décision RDV'],
    ['Backend : analyse IA + décision RDV', 'Urgence vitale ?'],
    ['Urgence vitale ?', 'Déclencher escalade urgence', 0],
    ['Urgence vitale ?', 'Résultat', 1],
  ), 'Point d\'entrée e-mail externe (formulaire, autre boîte, Make/Zapier). La boîte Gmail centrale est lue directement par le backend.'),

  wf('w55mWLlk6GBvxuVQ', '2. Rappels e-mail 24h avant RDV', [
    manual([0, 0]),
    { parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * *' }] } }, name: 'Chaque jour 08h00 (Tunis)', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, 200] },
    http('RDV de demain non rappelés', { method: 'GET', url: `${B}/api/appointments/reminders-due`, position: [240, 100], continueOnFail: false }),
    { parameters: { fieldToSplitOut: 'data', options: {} }, name: 'Un élément par RDV', type: 'n8n-nodes-base.splitOut', typeVersion: 1, position: [480, 100] },
    http('Envoyer le rappel (Gmail)', { url: `${B}/api/appointments/send-reminder`, body: '{ appointmentId: $json._id }', position: [720, 100] }),
  ], link(
    ['Test manuel', 'RDV de demain non rappelés'],
    ['Chaque jour 08h00 (Tunis)', 'RDV de demain non rappelés'],
    ['RDV de demain non rappelés', 'Un élément par RDV'],
    ['Un élément par RDV', 'Envoyer le rappel (Gmail)'],
  ), 'Envoie un rappel e-mail réel la veille de chaque rendez-vous confirmé.'),

  wf('gHsvnnDjW4SBALov', '3. RDV réservé → Google Calendar', [
    webhook('Webhook sync-calendar-event', 'sync-calendar-event', '7b3b6a52-1d7e-4c51-9a0e-calsync00001', [0, 100]),
    ifBool('RDV identifié ?', '!!$json.body?.appointmentId', [220, 100]),
    http('Créer l\'événement Google Calendar', { url: `${B}/api/appointments/{{ $json.body.appointmentId }}/sync-google`, body: '{}', position: [460, 0] }),
  ], link(
    ['Webhook sync-calendar-event', 'RDV identifié ?'],
    ['RDV identifié ?', 'Créer l\'événement Google Calendar', 0],
  ), 'Appelé par le backend à chaque réservation automatique : crée l\'événement dans l\'agenda Google du praticien.'),

  wf('p61YDYKHJlnFgNRN', "4. Escalade d'urgence vitale (SAMU 190 / 198)", [
    webhook('Webhook emergency-alert', 'emergency-alert', '7b3b6a52-1d7e-4c51-9a0e-emergency001', [0, 100]),
    http('Alerte praticien d\'astreinte', {
      url: `${B}/api/integrations/whatsapp/send-notification`,
      body: "{ type: 'EMERGENCY', message: '🚨 URGENCE : message de ' + ($json.body.patient?.name || $json.body.patient?.email || 'patient') + ' — ' + ($json.body.subject || '') + ' — ' + ($json.body.excerpt || '') }",
      position: [240, 100],
    }),
  ], link(['Webhook emergency-alert', 'Alerte praticien d\'astreinte']),
  'Déclenché par le backend quand un e-mail décrit des symptômes vitaux. Le patient a déjà reçu les consignes SAMU.'),

  wf('EmailEvents00001', '5. Journal des e-mails traités (événements backend)', [
    webhook('Webhook medilawai-email-processed', 'medilawai-email-processed', '7b3b6a52-1d7e-4c51-9a0e-events000001', [0, 100]),
    {
      parameters: {
        rules: {
          values: [
            ['DIRECT_CONFIRMATION', 'RDV confirmé'],
            ['NEEDS_CLARIFICATION', 'Praticien à préciser'],
            ['EMERGENCY', 'Urgence'],
          ].map(([v, key]) => ({
            conditions: {
              options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
              conditions: [{ leftValue: '={{ $json.body.decision }}', rightValue: v, operator: { type: 'string', operation: 'equals' } }],
              combinator: 'and',
            },
            renameOutput: true,
            outputKey: key,
          })),
        },
        options: { fallbackOutput: 'extra', renameFallbackOutput: 'Autre' },
      },
      name: 'Selon la décision', type: 'n8n-nodes-base.switch', typeVersion: 3.2, position: [240, 100],
    },
    setFields('RDV confirmé', [['resume', "={{ '✅ ' + $json.body.patient.email + ' → ' + ($json.body.practitioner?.name || '') + ' | réponse envoyée : ' + $json.body.replySent }}"]], [500, -60]),
    setFields('Clarification', [['resume', "={{ '❓ ' + $json.body.patient.email + ' : praticien demandé au patient | envoyé : ' + $json.body.replySent }}"]], [500, 60]),
    setFields('Urgence', [['resume', "={{ '🚨 ' + $json.body.patient.email }}"]], [500, 180]),
    setFields('Autre', [['resume', "={{ 'ℹ️ ' + $json.body.decision + ' — ' + $json.body.patient.email }}"]], [500, 300]),
  ], link(
    ['Webhook medilawai-email-processed', 'Selon la décision'],
    ['Selon la décision', 'RDV confirmé', 0],
    ['Selon la décision', 'Clarification', 1],
    ['Selon la décision', 'Urgence', 2],
    ['Selon la décision', 'Autre', 3],
  ), 'Reçoit chaque décision du moteur e-mail (visible dans Exécutions). Branchez ici Slack, Sheets, SMS…'),

  wf('MasterRunAll0001', '0. Test de bout en bout (santé + 4 scénarios)', [
    manual([0, 100]),
    http('Santé backend', { method: 'GET', url: `${B}/health`, position: [220, 100], continueOnFail: false }),
    setFields('Scénarios', [['scenarios', '={{ [1, 2, 3, 4] }}', 'array']], [440, 100]),
    { parameters: { fieldToSplitOut: 'scenarios', options: {} }, name: 'Un scénario', type: 'n8n-nodes-base.splitOut', typeVersion: 1, position: [660, 100] },
    http('Simuler le scénario', { url: `${B}/api/emails/simulate-scenario`, body: '{ scenarioNumber: $json.scenarios }', position: [880, 100] }),
    setFields('Bilan', [
      ['scenario', '={{ $json.scenarioDescription }}'],
      ['decision', '={{ $json.decision }}'],
      ['praticien', "={{ $json.practitioner?.name || '—' }}"],
    ], [1100, 100]),
  ], link(
    ['Test manuel', 'Santé backend'],
    ['Santé backend', 'Scénarios'],
    ['Scénarios', 'Un scénario'],
    ['Un scénario', 'Simuler le scénario'],
    ['Simuler le scénario', 'Bilan'],
  ), 'Vérifie que le backend répond et exécute les 4 scénarios (sans envoi réel).'),
];

// Corrige l'URL du nœud d'escalade (expression complète)
const ingestion = workflows[0];
ingestion.nodes.find(n => n.name === 'Déclencher escalade urgence').parameters.url =
  "={{ ($env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook') + '/emergency-alert' }}";

const files = {
  '4d9McL2J7pagy5Df': 'email-ingestion-workflow.json',
  'w55mWLlk6GBvxuVQ': 'appointment-reminder-24h-workflow.json',
  'gHsvnnDjW4SBALov': 'calendar-sync-workflow.json',
  'p61YDYKHJlnFgNRN': 'emergency-samu-escalation-workflow.json',
  'EmailEvents00001': 'email-events-workflow.json',
  'MasterRunAll0001': 'master-orchestrator-run-all-workflow.json',
};
for (const w of workflows) {
  fs.writeFileSync(path.join(OUT, files[w.id]), JSON.stringify(w, null, 2) + '\n', 'utf8');
  console.log('✔', files[w.id]);
}
