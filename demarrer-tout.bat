@echo off
TITLE Demarrage MediLawAI - Mode Local
echo =======================================================
echo           LANCEMENT COMPLET DE MEDILAWAI
echo =======================================================
echo.
echo 1. Verification de Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe. Veuillez installer Node.js 20+.
    pause
    exit /b
)

echo 2. Demarrage du Backend (Port 5000)...
start "MediLawAI Backend" cmd /k "cd backend && npm install && npm run dev"

echo 3. Demarrage du Frontend React (Port 5173)...
start "MediLawAI Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo =======================================================
echo Les serveurs sont en cours de demarrage !
echo.
echo - Frontend : http://localhost:5173
echo - Backend  : http://localhost:5000 (ou https://stage-cqe9.onrender.com)
echo =======================================================
echo.
timeout /t 5
start http://localhost:5173
