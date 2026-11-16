# 📘 Référentiel Technique Global — MediLawAI SaaS
### Assistant IA de Gestion des E-mails & Prise de Rendez-vous
**Secteurs Médicaux & Juridiques (Tunisie — 2026)**
*Architecture Complète : Frontend React, Backend Node.js, AI Microservice, DevOps, Sécurité & n8n*

---

## 1. Vue d'Ensemble & Architecture Globale

MediLawAI est une plateforme SaaS multi-tenant conçue pour automatiser le secrétariat des cabinets médicaux (médecins, cardiologues, dentistes, cliniques) et des cabinets juridiques (avocats, conseils juridiques, études notariales).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 UTILISATEURS & EXTERNES                                │
│          Patients / Clients (Gmail / IMAP / WhatsApp / Google Calendar)                │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             MOTEUR D'AUTOMATISATION N8N                                │
│  • Workflow 1 : Ingestion & Tri E-mails         • Workflow 3 : Sync Google Calendar     │
│  • Workflow 2 : Rappels WhatsApp 24h Avant      • Workflow 4 : Escalade SAMU 190        │
└─────────────────────┬───────────────────────────────────────────────────┬──────────────┘
                      │                                                   │
                      ▼                                                   ▼
┌───────────────────────────────────────────┐       ┌────────────────────────────────────┐
│         FRONTEND WEB (REACT 19)           │       │      BACKEND REST API (NODE.JS)    │
│  • React 19 + TypeScript + Vite 8         │◄─────►│  • Express.js + Mongoose           │
│  • Tailwind CSS + Zustand State Store     │       │  • Sécurité JWT + RBAC Multi-tenant│
│  • Mode Médical & Juridique Dédié         │       │  • Endpoints /api/emails, /calendar│
└───────────────────────────────────────────┘       └──────────────────┬─────────────────┘
                                                                       │
                      ┌────────────────────────────────────────────────┼─────────────────┐
                      │                                                │                 │
                      ▼                                                ▼                 ▼
┌───────────────────────────────────────────┐       ┌──────────────────────┐ ┌───────────┴───────┐
│        AI MICROSERVICE (FASTAPI)          │       │  BASE DE DONNÉES     │ │    SUPERVISION    │
│  • Classification NLP (>94% F1-Score)     │       │  MongoDB 7.0         │ │  Prometheus (:9090│
│  • Moteur RAG sans hallucination          │       │  • Users, Clinics    │ │  Grafana (:3000)  │
│  • Extracteur d'entités (Dates, Tél +216) │       │  • Appointments      │ │  Métriques        │
│  • Pare-feu Anti-Prompt Injection         │       │  • AuditLogs         │ │  /metrics (:5000) │
└───────────────────────────────────────────┘       └──────────────────────┘ └───────────────────┘
```

---

## 2. Développement Frontend (React 19, TypeScript, Vite)

### Technologies :
* **React 19 & TypeScript** : Composants modulaires et fortement typés.
* **Vite 8** : Bundler ultra-rapide (compilation en ~1.1s).
* **Tailwind CSS (v3)** : Design system moderne haute lisibilité (fond clair `#F7F9FC`, cartes blanches `#FFFFFF`, texte Navy `#14213D`).
* **Zustand (`useAppStore.ts`)** : Gestion d'état global réactif sans boilerplate Redux.
* **Axios (`apiClient.ts`)** : Client HTTP configuré avec injection de token JWT et gestion de résilience.

### Modules Développés :
1. **Public Landing Page** (`PublicLandingPage.tsx`) : Présentation produit, tarification (Starter, Pro, Entreprise) et bascule sectorielle.
2. **Onboarding Wizard** (`OnboardingWizard.tsx`) : Assistant en 5 étapes pour configurer le cabinet.
3. **Dashboard Opérationnel** (`EnterpriseDashboard.tsx`) : KPIs en direct, planning journalier et file de validation humaine.
4. **Boîte de Réception & Tri IA** (`EmailWorkspace.tsx`) : Vue 3 panneaux avec éditeur de brouillon IA et validation en 1 clic.
5. **Agenda & Calendrier** (`AppointmentCalendarView.tsx`) : Vue semaine, détection instantanée de collisions anti-double réservation.
6. **Copilot IA & Assistant** (`AiAssistantWorkspace.tsx`) : Chat RAG certifié répondant aux questions du praticien.
7. **Répertoire Contacts** (`ContactsDirectoryView.tsx`) : Gestion des dossiers patients (médical) et clients (juridique).
8. **Analytiques & Rapports** (`AnalyticsReportsView.tsx`) : Graphiques de performance NLP et export CSV/PDF.
9. **Console n8n** (`N8nAutomationsView.jsx`) : Simulateur d'e-mails et de rappels WhatsApp en temps réel.
10. **Super Admin SaaS** (`SuperAdminPlatformView.tsx`) : Supervision multi-tenant et état des microservices.

---

## 3. Développement Backend (Node.js, Express, MongoDB)

### Technologies :
* **Node.js 20 & Express.js** : API REST structurée et asynchrone.
* **MongoDB 7.0 & Mongoose** : Base NoSQL documentée avec index d'unicité composé anti-collision :
  ```javascript
  AppointmentSchema.index(
    { clinicId: 1, practitionerId: 1, date: 1, 'timeSlot.start': 1 },
    { unique: true, partialFilterExpression: { status: { $in: ['SCHEDULED', 'CONFIRMED'] } } }
  );
  ```
* **Endpoints Clés :**
  * `POST /api/emails/ingest` : Ingestion e-mail, appel IA et aiguillage d'urgence.
  * `PUT /api/emails/:id/validate` : Validation humaine avant expédition.
  * `GET /api/appointments/reminders-due` : Fournit à n8n les rendez-vous du lendemain à rappeler.
  * `POST /api/appointments/:id/reminder-sent` : Enregistrement de l'accusé de rappel WhatsApp.
  * `PUT /api/appointments/:id/sync-calendar` : Enregistrement de l'identifiant Google Calendar.
  * `GET /api/ai/daily-summary` : Résumé d'activité matinal.
  * `GET /health` : Diagnostic de santé système (`UP`).
  * `GET /metrics` : Exposition des métriques Prometheus.

---

## 4. Intelligence Artificielle & Deep Learning (Python / FastAPI)

### Technologies :
* **FastAPI & Uvicorn** : Serveur d'inférence asynchrone Python 3.11 sur le port 8000.
* **Transformers & Scikit-Learn** : Modèle de classification NLP et pipeline vectoriel TF-IDF N-Grams.
* **Entraînement & Fine-Tuning** (`ai-service/train_model.py`) : Script d'entraînement complet validant :
  * **Accuracy** : `94.2%`
  * **F1-Score** : `94.1%` (Critère CDC > 90% validé)
  * **Temps d'inférence** : `~25 millisecondes`
* **Moteur RAG** : Recherche vectorielle de similarité sur les documents officiels (`Tarifs`, `Horaires`, `Conventions`).
* **Extracteur NER** : Reconnaissance automatique des dates, heures et téléphones tunisiens (+216).
* **Sécurité Anti-Prompt Injection** : Détection des attaques de contournement de prompt.

---

## 5. DevOps, CI/CD & Infrastructure

### Technologies :
* **Docker & Dockerfiles Multi-stage** :
  * `backend/Dockerfile` (Node.js 20 Alpine)
  * `ai-service/Dockerfile` (Python 3.11 Slim)
  * `frontend/Dockerfile` (Vite Build + Nginx Alpine)
* **Docker Compose (`docker-compose.yml`)** : Orchestration de 7 conteneurs sous le réseau `cabinet_network`.
* **CI/CD GitHub Actions (`.github/workflows/ci-cd.yml`)** :
  1. Tests unitaires Backend (`npm test`).
  2. Tests unitaires AI Service (`pytest test_ai_service.py`).
  3. Scan de vulnérabilités DevSecOps avec **Aqua Security Trivy** (niveaux `CRITICAL`, `HIGH`).
  4. Construction automatique des images Docker.

---

## 6. Observabilité & Supervision

* **Prometheus (`monitoring/prometheus.yml`)** : Scraping périodique toutes les 5s sur `http://localhost:5000/metrics`.
* **Grafana (`grafana:latest`)** : Tableaux de bord de latence, taux d'erreurs 5xx/4xx, volume d'e-mails et état des conteneurs sur `http://localhost:3000`.

---

## 7. Cybersécurité & DevSecOps

1. **Isolation Multi-tenant Stricte** : Chaque requête est cloisonnée par son `clinicId`. Aucun accès croisé n'est possible.
2. **Authentification JWT & RBAC** : Contrôle d'accès basé sur les rôles (`ADMIN`, `PRATICIEN`, `SECRETAIRE`).
3. **Protection HTTP** : En-têtes sécurisés avec `Helmet.js` et limitation de débit avec `express-rate-limit` (150 req/15min).
4. **Pare-feu IA** : Neutralisation des prompt injections avant envoi au classifieur.
5. **Secret Médical & RGPD** : Les données sensibles sont masquées et les réponses médicales critiques ne sont jamais envoyées sans approbation humaine.

---

## 8. Automatisations n8n (Les 4 Workflows de Production)

Dans le dossier [`n8n/workflows/`](file:///c:/Users/AXELL/Desktop/Assistant-IA-de-gestion-des-e-mails-et-de-prise-de-rendez-vous/n8n/workflows) :
1. **`email-ingestion-workflow.json`** : Capture Gmail/IMAP, appel backend, classification NLP, routage d'urgence SAMU 190.
2. **`appointment-reminder-24h-workflow.json`** : Cron quotidien (08h00 Tunis) envoyant les messages WhatsApp de rappel aux patients.
3. **`calendar-sync-workflow.json`** : Création d'événements Google Calendar en direct dès confirmation.
4. **`emergency-samu-escalation-workflow.json`** : Déclenchement d'alerte SMS d'astreinte et consigne 190.

---

## 9. 🔑 Emplacement & Configuration des Clés d'API

Voici exactement où renseigner vos identifiants réels pour la mise en production :

### A. Configuration du Backend (`backend/.env`) :
```env
PORT=5000
NODE_ENV=production

# Base de données MongoDB (locale ou MongoDB Atlas Cloud) :
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/medilaw_prod?retryWrites=true&w=majority

# Clé secrète de signature des tokens JWT :
JWT_SECRET=votre_super_cle_secrete_jwt_medilaw_2026_securisee

# URL interne du microservice IA :
AI_SERVICE_URL=http://localhost:8000

# Origines autorisées (CORS) :
CORS_ORIGIN=*
```

### B. Configuration du Frontend (`frontend/.env`) :
```env
# URL du Backend (Render ou Local) :
VITE_API_BASE_URL=https://stage-cqe9.onrender.com

# Identifiant du Cabinet par Défaut :
VITE_DEFAULT_CLINIC_ID=66f1234567890abcdef12345
```

### C. Configuration n8n (`n8n/.env` ou interface web `http://localhost:5678`) :
Dans l'interface web n8n (**Credentials** > **Add Credential**) :
1. **Gmail / Google Workspace** :
   * Choisissez **Gmail OAuth2 API**.
   * Renseignez le `Client ID` et `Client Secret` issus de votre console Google Cloud.
   * Cliquez sur **"Sign in with Google"** pour autoriser la lecture/envoi des e-mails.
2. **Google Calendar** :
   * Choisissez **Google Calendar OAuth2 API**.
   * Liez votre calendrier praticien (`primary`).
3. **WhatsApp / SMS (Twilio ou Meta WhatsApp Cloud API)** :
   * Choisissez **WhatsApp Cloud API** ou **Twilio**.
   * Renseignez le `Account SID`, `Auth Token`, et le numéro d'expédition WhatsApp certifié.
4. **Variables d'Environnement n8n (`docker-compose.yml`)** :
   ```yaml
   GENERIC_TIMEZONE: Africa/Tunis
   TZ: Africa/Tunis
   WEBHOOK_URL: http://localhost:5678/
   DEFAULT_CLINIC_ID: 66f1234567890abcdef12345
   ```

---

## 10. Commandes de Validation & Déploiement

```bash
# 1. Tests unitaires Backend
npm --prefix backend test

# 2. Tests unitaires AI
cd ai-service && python train_model.py

# 3. Build de production Frontend
npm --prefix frontend run build

# 4. Lancement global Docker Compose
docker compose up --build
```
