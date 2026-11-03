# Workflows et Moteur d'Automatisation n8n
### Assistant IA de Gestion des E-mails et Rendez-vous (Tunisie 2026)

Le moteur n8n assure l'orchestration événementielle et les liaisons externes (Gmail, WhatsApp Cloud API / Twilio, Google Calendar, SMS d'urgence).

---

## 1. Liste des Workflows Inclus

| Fichier Workflow | Déclencheur (Trigger) | Actions Principales |
| :--- | :--- | :--- |
| **`email-ingestion-workflow.json`** | Gmail Trigger (IMAP) + Webhook `POST /webhook/ingest-email` | Envoi au Backend `/api/emails/ingest`, classification Deep Learning, escalade WhatsApp si urgence. |
| **`appointment-reminder-24h-workflow.json`** | Cron quotidien (08h00 fuseau Tunis) + Webhook `POST /webhook/trigger-reminders` | Récupération des RDV de demain via `/api/appointments/reminders-due`, envoi du message WhatsApp personnalisé, marquage `reminderSent24h`. |
| **`calendar-sync-workflow.json`** | Webhook `POST /webhook/sync-calendar-event` | Création instantanée dans Google Calendar et retour de l'identifiant d'événement au backend. |
| **`emergency-samu-escalation-workflow.json`** | Webhook `POST /webhook/emergency-alert` | Déclenchement alerte rouge SMS au praticien d'astreinte (+216 98 111 222) et rappel du protocole SAMU 190. |

---

## 2. Démarrage et Accès à l'Interface

Avec Docker Compose :
```bash
docker compose up -d n8n
```
* **URL de l'interface** : `http://localhost:5678`
* **Identifiant par défaut** : `admin`
* **Mot de passe par défaut** : `CabinetAdmin2026!`

---

## 3. Importation des Workflows dans n8n

### Méthode A : Ligne de commande Docker (Recommandé)
```bash
docker compose exec n8n n8n import:workflow --input=/workflows/email-ingestion-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/appointment-reminder-24h-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/calendar-sync-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/emergency-samu-escalation-workflow.json
```

### Méthode B : Via l'Interface Web n8n
1. Ouvrez `http://localhost:5678`.
2. Cliquez sur **Workflows** > **Import from File**.
3. Sélectionnez les fichiers `.json` situés dans le répertoire `n8n/workflows/`.
4. Activez le bouton **Active** en haut à droite de chaque workflow.

---

## 4. Webhooks de Test Rapide

Vous pouvez déclencher les workflows directement avec `curl` ou Postman :

### Ingestion d'un e-mail :
```bash
curl -X POST http://localhost:5678/webhook-test/ingest-email \
  -H "Content-Type: application/json" \
  -d '{
    "sender": { "name": "Mohamed Ben Ali", "email": "m.benali@gmail.com" },
    "subject": "Demande de RDV cardiologie vendredi",
    "body": "Bonjour, je souhaite un rendez-vous ce vendredi à 14h pour une consultation."
  }'
```

### Déclenchement des Rappels WhatsApp 24h :
```bash
curl -X POST http://localhost:5678/webhook-test/trigger-reminders
```

