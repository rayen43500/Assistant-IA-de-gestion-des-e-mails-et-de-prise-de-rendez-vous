@echo off
TITLE MediLawAI - Suite Locale Complete (Production 2026)
echo =======================================================
echo     LANCEMENT DE LA SUITE COMPLETE MEDILAWAI
echo =======================================================
echo.
echo 1. Verification de l'environnement Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe. Veuillez installer Node.js 20+.
    pause
    exit /b
)

echo 1.1 Import et activation des workflows n8n (CLI officielle)...
node n8n/import-workflows.js

echo 2. Demarrage du Microservice IA Deep Learning (Port 8000)...
start "MediLawAI - Service IA" cmd /k "node ai-service/server.js"

echo 3. Demarrage de l'Interface Graphique n8n (Port 5678)...
start "MediLawAI - n8n Web UI" cmd /k "set N8N_AI_ASSISTANT_ENABLED=false&& set N8N_BLOCK_ENV_ACCESS_IN_NODE=false&& set BACKEND_URL=http://localhost:5000&& set GENERIC_TIMEZONE=Africa/Tunis&& npx n8n start"

echo 4. Demarrage du Backend REST API Express (Port 5000)...
start "MediLawAI - Backend API" cmd /k "node backend/src/index.js"

echo 5. Demarrage du Frontend React Vite (Port 5173)...
start "MediLawAI - Frontend Web" cmd /k "npm --prefix frontend run dev"

echo.
echo =======================================================
echo           SERVICES LOCAUX OPERATIONNELS
echo =======================================================
echo - Frontend Web        : http://localhost:5173
echo - Backend API         : http://localhost:5000
echo - Microservice IA NLP : http://localhost:8000
echo - Moteur n8n Workflows: http://localhost:5678
echo =======================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
