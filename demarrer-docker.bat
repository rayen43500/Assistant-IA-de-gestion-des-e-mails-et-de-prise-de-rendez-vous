@echo off
TITLE Demarrage MediLawAI - Docker Compose
echo =======================================================
echo     LANCEMENT MEDILAWAI AVEC DOCKER COMPOSE
echo =======================================================
echo.
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas installe ou Docker Desktop n'est pas ouvert.
    echo Veuillez demarrer Docker Desktop et reessayer, ou utiliser demarrer-tout.bat sans Docker.
    pause
    exit /b
)

echo Construction et demarrage des 7 conteneurs...
docker compose up --build
