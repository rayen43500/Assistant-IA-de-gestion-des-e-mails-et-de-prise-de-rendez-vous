# Workflows n8n — MediLawAI

Le **backend** lit la boîte Gmail centrale, décide (praticien, créneau, réservation) et **répond au patient**.
**n8n** orchestre les actions autour : entrée e-mail externe, rappels, agenda Google, urgences, journal.

## Workflows

| # | Workflow | Déclencheur | Rôle |
|---|---|---|---|
| 0 | Test de bout en bout | Manuel | Santé backend + 4 scénarios simulés (aucun envoi) |
| 1 | Ingestion E-mail → IA → Réservation | `POST /webhook/ingest-email` | E-mail venant d'une autre source → `/api/emails/ingest` ; escalade si urgence |
| 2 | Rappels e-mail 24h | Cron 08h00 (Tunis) | RDV de demain → `/api/appointments/send-reminder` (Gmail réel) |
| 3 | RDV réservé → Google Calendar | `POST /webhook/sync-calendar-event` (envoyé par le backend) | Crée l'événement dans l'agenda du praticien |
| 4 | Escalade urgence vitale | `POST /webhook/emergency-alert` (envoyé par le backend) | Alerte du praticien d'astreinte |
| 5 | Journal des e-mails traités | `POST /webhook/medilawai-email-processed` (envoyé par le backend) | Une exécution par décision (confirmé / clarification / urgence / autre) |

Les URLs utilisent `$env.BACKEND_URL` (défaut `http://localhost:5000` ; en Docker `http://backend:5000`).
n8n doit tourner avec `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` (déjà configuré dans `docker-compose.yml`, `scripts/runner.js`, `demarrer-tout.bat`).

## Modifier / importer

```bash
node n8n/build-workflows.js        # régénère les JSON depuis le code (source de vérité)
node n8n/import-workflows.js       # importe + active via la CLI n8n (n8n arrêté)
node n8n/import-workflows.js --docker
```

`npm start` réimporte automatiquement si les fichiers ont changé.

## Test rapide

```bash
curl -X POST http://localhost:5678/webhook/ingest-email -H "Content-Type: application/json" \
  -d '{"senderEmail":"patient@example.tn","senderName":"Sami","subject":"RDV","body":"Bonjour, un rendez-vous avec le Dr Nadia lundi à 10h"}'
```

Ajoutez `"autoSend": true` pour que la réponse parte réellement par Gmail.
