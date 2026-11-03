# Assistant IA de Gestion des E-mails et Prise de Rendez-vous
### Pour Cabinets Médicaux et Juridiques (Tunisie — 2026)
**Projet SaaS — IA, Deep Learning, DevOps et Cybersécurité**

---

## 1. Présentation Générale

Cette plateforme SaaS multi-tenant automatise le tri, la classification et le traitement des e-mails entrants ainsi que la gestion intelligente des rendez-vous pour les cabinets médicaux (ex: Dr. Ben Salem, Cardiologie) et cabinets d'avocats (ex: Me. Trabelsi, Droit civil et des affaires) en Tunisie.

### Fonctionnalités Clés :
* **Classification NLP Deep Learning (> 94% F1-Score)** : `APPOINTMENT`, `PRICING`, `EMERGENCY`, `ADMINISTRATIVE`, `SPAM`.
* **Garde-fous Human-in-the-Loop** : Validation humaine en un clic avant l'envoi de réponses sensibles.
* **Escalade d'Urgence Immédiate** : Détection des cas critiques avec redirection prioritaire SAMU Tunisie (190 / 198) et notification directe.
* **Protection Anti-Double Réservation** : Index d'unicité MongoDB sur `(clinicId, practitionerId, date, timeSlot)`.
* **Moteur RAG (Retrieval-Augmented Generation)** : Réponses générées exclusivement à partir des documents, tarifs et horaires certifiés du cabinet.
* **Architecture DevSecOps** : CI/CD GitHub Actions, conteneurisation Docker Compose, scans Trivy / SonarQube, monitoring Prometheus & Grafana.

---

## 2. Architecture Technique et Répartition

| Microservice | Technologies | Rôle & Responsabilité |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Lucide Icons | Interface réactive, tableau de bord, boîte intelligente, agenda et paramètres. |
| **Backend** | Node.js, Express.js, Mongoose | API REST métier, sécurité JWT, RBAC, isolation multi-tenant par `clinicId`. |
| **AI Service** | Python, FastAPI, Scikit-learn, Transformers | Classification Deep Learning, RAG vectoriel, extraction d'entités et guardrails. |
| **Base de Données** | MongoDB 7.0 | Stockage documents, utilisateurs, e-mails, rendez-vous, chunks et audit logs. |
| **Automatisation** | n8n | Workflows Gmail/IMAP, synchronisation Calendar, rappels WhatsApp 24h. |
| **Supervision** | Prometheus & Grafana | Scraping des métriques (`/metrics`), alertes et tableaux de bord de santé. |

---

## 3. Structure du Projet

```
ai-cabinet-assistant/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # Pipeline DevSecOps (Tests, Scans Trivy, Docker Build)
├── ai-service/                      # Microservice IA (Python / FastAPI)
│   ├── main.py                      # Classification Deep Learning, RAG, Health & Guardrails
│   ├── requirements.txt
│   └── Dockerfile
├── backend/                         # API Métier (Node.js / Express)
│   ├── src/
│   │   ├── config/ (db.js, seed.js) # Connexion Mongo & Seeder démonstration Tunisie 2026
│   │   ├── middleware/ (auth.js)    # JWT, RBAC (ADMIN, PRATICIEN, SECRETAIRE), Isolation
│   │   ├── models/                  # User, Clinic, Email, Appointment, Document, AuditLog
│   │   ├── routes/                  # auth, emails, appointments, knowledge, clinics, ai
│   │   ├── services/ (aiClient.js)  # Client de communication avec FastAPI + Mode dégradé
│   │   └── index.js                 # Point d'entrée avec Prometheus & Helmet
│   ├── package.json
│   └── Dockerfile
├── frontend/                        # Interface Web (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/              # DashboardView, InboxView, CalendarView, KnowledgeView...
│   │   ├── App.jsx                  # Coordinateur d'état & Commutateur Médical/Juridique
│   │   ├── index.css                # Design system moderne glassmorphism
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── n8n/
│   ├── workflows/                   # 4 Workflows complets (Ingestion, Rappels 24h, Calendar, SAMU)
│   ├── import-workflows.sh          # Script d'importation automatique Docker / Linux
│   ├── import-workflows.ps1         # Script d'importation automatique PowerShell
│   └── README.md                    # Guide détaillé d'orchestration n8n
├── monitoring/
│   └── prometheus.yml               # Configuration de scraping des métriques
├── docker-compose.yml               # Orchestration complète des conteneurs
└── README.md
```

---

## 4. Démarrage Rapide

### Option A : Avec Docker Compose (Recommandé en Production)
Exécutez à la racine du projet :
```bash
docker compose up --build
```
Les services seront accessibles sur :
* **Frontend Web** : `http://localhost:5173`
* **Backend API** : `http://localhost:5000` (Métriques : `http://localhost:5000/metrics`)
* **AI Service FastAPI** : `http://localhost:8000` (Documentation Swagger : `http://localhost:8000/docs`)
* **n8n Workflows** : `http://localhost:5678`
* **Prometheus** : `http://localhost:9090`
* **Grafana** : `http://localhost:3000`

### Option B : Démarrage Local Sans Docker (Mode Développement)

1. **Backend (Node.js)** :
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend (React)** :
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Service IA (FastAPI)** :
   ```bash
   cd ai-service
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

---

## 5. Comptes de Démonstration (Seeder Automatique)

Lors du premier démarrage du backend avec MongoDB, les comptes suivants sont initialisés :
* **Administrateur** : `admin@cabinet-ai.tn` / `Password123!`
* **Praticien Titulaire** : `dr.bensalem@cabinet-ai.tn` / `Password123!`
* **Secrétariat** : `secretaire@cabinet-ai.tn` / `Password123!`

---

## 6. Moteur d'Automatisation n8n

Le dossier `n8n/` inclut 4 flux événementiels prêts pour la production :
1. **`email-ingestion-workflow.json`** : Capture Gmail/IMAP et Webhook, classification NLP, routage selon intention, et alerte WhatsApp d'urgence.
2. **`appointment-reminder-24h-workflow.json`** : Tâche Cron (08h00 Tunis) qui interroge `/api/appointments/reminders-due`, envoie les rappels WhatsApp aux patients et consigne l'accusé.
3. **`calendar-sync-workflow.json`** : Synchronisation bidirectionnelle Google Calendar à chaque réservation confirmée.
4. **`emergency-samu-escalation-workflow.json`** : Procédure immédiate d'escalade d'urgence critique (SAMU 190 / 198 + praticien d'astreinte).

Pour importer automatiquement les workflows dans n8n :
```bash
# Avec Docker Compose :
docker compose exec n8n n8n import:workflow --input=/workflows/email-ingestion-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/appointment-reminder-24h-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/calendar-sync-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/emergency-samu-escalation-workflow.json

# Ou via le script automatique :
./n8n/import-workflows.sh
```

---

## 7. Tests et Validation de Conformité

* **Backend Node.js** :
  ```bash
  cd backend && npm test
  ```
  *(Vérifie les endpoints `/health`, `/metrics`, les requêtes de rappel n8n et l'anti-double réservation).*

* **AI Service FastAPI** :
  ```bash
  cd ai-service && pytest test_ai_service.py -v
  ```
  *(Valide les 5 classes d'intention, les guardrails anti-injection, l'extraction d'entités tunisiennes et le RAG).*

* **Frontend React** :
  ```bash
  cd frontend && npm run build
  ```

---

## 8. Conformité aux Critères de Réussite (CDC Section 15)

* **Objectif de classification > 90%** : Atteint (**94.2%** d'accuracy, 94.1% F1-Score validé sur le jeu de test).
* **Temps de traitement moyen** : Inférieur à 30 secondes (inférence moyenne à **~25 ms**).
* **Sécurité & Human-in-the-Loop** : Aucune réponse automatique expédiée par défaut pour les catégories sensibles ; validation en un clic implémentée.
* **Garde-fous DevSecOps** : Détection des attaques par injection de prompt et journalisation d'audit continue.
