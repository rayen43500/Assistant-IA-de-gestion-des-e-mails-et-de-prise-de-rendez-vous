# 🚀 Guide Complet d'Activation — MediLawAI SaaS
### Assistant IA de Gestion des E-mails & Prise de Rendez-vous (Tunisie 2026)

Ce guide vous explique pas à pas comment démarrer et tester l'intégralité du projet en local ou avec le serveur cloud distant.

---

## 📌 Résumé de l'Architecture & URLs

| Service | Rôle & Port Local | URL Déployée / Cloud |
| :--- | :--- | :--- |
| **Frontend Web** | React 19 + Vite 8 (`http://localhost:5173`) | Interface utilisateur interactive |
| **Backend REST API** | Node.js + Express (`http://localhost:5000`) | **`https://stage-cqe9.onrender.com`** |
| **Microservice IA** | Python FastAPI (`http://localhost:8000`) | Classification NLP & RAG |
| **Automatisation n8n** | n8n Engine (`http://localhost:5678`) | Orchestration Gmail/Calendar/WhatsApp |
| **Base de Données** | MongoDB 7.0 (`mongodb://localhost:27017`) | Stockage & Isolation multi-tenant |
| **Supervision** | Prometheus (`:9090`) & Grafana (`:3000`) | Scraping métriques & Dashboards |

---

## ⚡ Option 1 : Démarrage Rapide en 1 Clic (Docker Compose - Recommandé)

Si **Docker Desktop** est installé sur votre ordinateur :

### Sous Windows :
Double-cliquez simplement sur **`demarrer-docker.bat`** ou exécutez dans le terminal :
```bash
docker compose up --build
```

Tous les 7 conteneurs démarreront ensemble :
1. Ouvrez votre navigateur sur **`http://localhost:5173`** pour accéder au SaaS.
2. L'éditeur n8n sera disponible sur **`http://localhost:5678`** (Identifiants : `admin` / `CabinetAdmin2026!`).
3. L'API backend sur **`http://localhost:5000`** et l'IA sur **`http://localhost:8000/docs`**.

---

## 💻 Option 2 : Démarrage Local Sans Docker (Mode Développement)

Si vous n'avez pas Docker, vous pouvez lancer les services directement avec Node.js et Python.

### Sous Windows (Script 1-Clic) :
Double-cliquez sur **`demarrer-tout.bat`** qui ouvrira les terminaux nécessaires.

### Ou manuellement dans 3 terminaux distincts :

#### Terminal 1 — Le Backend (Node.js) :
```bash
cd backend
npm install
npm run dev
```
> Le backend s'allume sur `http://localhost:5000`.

#### Terminal 2 — Le Frontend (React + Vite) :
```bash
cd frontend
npm install
npm run dev
```
> Le frontend s'allume sur `http://localhost:5173`.

#### Terminal 3 — Le Microservice IA (Python FastAPI) :
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
> L'IA s'allume sur `http://localhost:8000`.

---

## 🌐 Option 3 : Connecter le Frontend au Backend Render (`https://stage-cqe9.onrender.com`)

Le frontend est déjà préconfiguré pour cibler votre backend hébergé sur Render !

### Fichier de configuration du Frontend :
Le fichier [`frontend/.env`](file:///c:/Users/AXELL/Desktop/Assistant-IA-de-gestion-des-e-mails-et-de-prise-de-rendez-vous/frontend/.env) contient :
```env
VITE_API_BASE_URL=https://stage-cqe9.onrender.com
VITE_DEFAULT_CLINIC_ID=66f1234567890abcdef12345
```

### Pour basculer entre Render et votre Backend local :
* **Vers le cloud Render** : Laissez `VITE_API_BASE_URL=https://stage-cqe9.onrender.com`
* **Vers votre machine locale** : Remplacez par `VITE_API_BASE_URL=http://localhost:5000`

> 💡 **Remarque importante sur Render (Free Tier)** :
> Si le backend sur Render est inactif depuis un moment, Render met 30 à 50 secondes à réveiller le conteneur (*Cold Start*).
> Grâce à notre couche de résilience dans le Frontend, **l'interface ne plante jamais** : elle utilise un cache local interactif tant que le serveur distant se réveille, puis se synchronise automatiquement !

---

## 🔑 Identifiants de Test Préconfigurés

Lors de la première connexion à la base MongoDB, les comptes suivants sont créés automatiquement :

| Rôle | Adresse E-mail | Mot de Passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@cabinet-ai.tn` | `Password123!` |
| **Médecin Praticien** | `dr.bensalem@cabinet-ai.tn` | `Password123!` |
| **Secrétaire Médicale** | `secretaire@cabinet-ai.tn` | `Password123!` |

---

## 🔄 Importation des Workflows dans n8n

Une fois n8n démarré (`http://localhost:5678`) :

### En ligne de commande (Docker) :
```bash
docker compose exec n8n n8n import:workflow --input=/workflows/email-ingestion-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/appointment-reminder-24h-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/calendar-sync-workflow.json
docker compose exec n8n n8n import:workflow --input=/workflows/emergency-samu-escalation-workflow.json
```

### Ou via le script automatique fourni :
* **Sous Windows** : Exécutez `powershell ./n8n/import-workflows.ps1`
* **Sous Linux / Mac** : Exécutez `./n8n/import-workflows.sh`

---

## 🧪 Tests Automatisés & Vérification

Pour vérifier que tout le code passe à 100% :

1. **Tests Backend (Node.js)** :
   ```bash
   cd backend
   npm test
   ```
   *(Valide les 5 tests unitaires : health, metrics Prometheus, rappels 24h et anti-double réservation).*

2. **Tests Microservice IA (Python)** :
   ```bash
   cd ai-service
   pytest test_ai_service.py -v
   ```
   *(Valide la classification NLP > 94%, les filtres anti-prompt injection, l'extraction d'entités tunisiennes et le RAG).*

3. **Build Frontend (Production)** :
   ```bash
   cd frontend
   npm run build
   ```
   *(Génère le bundle optimisé sans la moindre erreur).*
