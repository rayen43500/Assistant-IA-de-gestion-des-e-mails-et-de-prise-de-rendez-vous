@echo off
REM ============================================================================
REM  Campagne de tests qualite ISO/IEC 25010 - meme commande que le pipeline CI
REM
REM   tests-qualite.bat                 toutes les couches
REM   tests-qualite.bat unit api e2e    couches choisies
REM
REM  Couches : unit python lint dup sca sast api e2e perf dast zap portability
REM  Rapports : quality\reports\summary.md (+ journaux bruts *.log)
REM  Prerequis : Node.js 20+, MongoDB installe (ou deja demarre), Python 3.11+ (service IA)
REM ============================================================================
chcp 65001 >nul
setlocal
cd /d "%~dp0"

where node >nul 2>&1 || (echo [ERREUR] Node.js introuvable. & exit /b 1)

if not exist backend\node_modules (
  echo [Installation] dependances backend...
  call npm ci --prefix backend || exit /b 1
)
if not exist frontend\node_modules (
  echo [Installation] dependances frontend...
  call npm ci --prefix frontend || exit /b 1
)
if not exist quality\node_modules (
  echo [Installation] outils de test ^(Playwright, Newman, autocannon, ESLint, jscpd^)...
  call npm ci --prefix quality || exit /b 1
  pushd quality
  call npx playwright install chromium firefox || (popd & exit /b 1)
  popd
)

node quality\run-all.js %*
set CODE=%ERRORLEVEL%
echo.
echo Rapport : %CD%\quality\reports\summary.md
exit /b %CODE%
