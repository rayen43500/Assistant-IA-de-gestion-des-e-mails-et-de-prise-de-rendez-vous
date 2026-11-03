partie ai 
Un classifieur NLP multi-classes (>94% F1-score).
Un moteur RAG anti-hallucination branché sur les documents du cabinet.
Un extracteur d'entités (dates, créneaux, téléphones tunisiens).
Une sécurité anti-injection de prompt et un système Human-in-the-Loop.


///////////////////////////////////////////////////////////////////////////
partie devops 
Un pipeline CI/CD complet (GitHub Actions / GitLab CI) qui teste, scanne la sécurité (Trivy/Snyk) et déploie les conteneurs.
Une stack Docker Compose multi-services (Frontend + Backend + DB + AI + N8N + Monitoring).
Un monitoring Prometheus + Grafana pour exposer des métriques temps réel (/metrics).

///////////////////////////////////////////////////////////////////////////
Conteneurisation & orchestration 
docker et docker compose 

1. Conteneurisation & Orchestration (Docker & Docker Compose)
Docker & Dockerfiles :
Un Dockerfile dédié par microservice :
backend/Dockerfile (Node.js 20 Alpine)
ai-service/Dockerfile (Python 3.11 Slim)
frontend/Dockerfile (Multi-stage build : Node.js + Nginx Alpine)
Docker Compose (docker-compose.yml) :
Orchestration de 7 services conteneurisés communicant sur un réseau isolé (cabinet_network) :
frontend (Port 5173 / 80)
backend (Port 5000)
ai-service (Port 8000)
mongo (MongoDB 7.0 - Port 27017 avec volume persistant mongo_data)
n8n (Moteur d'automatisation - Port 5678 avec volume n8n_data)
prometheus (Scraping des métriques - Port 9090)
grafana (Tableaux de bord de supervision - Port 3000)

