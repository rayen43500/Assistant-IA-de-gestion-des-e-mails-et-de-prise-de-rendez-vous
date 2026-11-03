# ==============================================================================
# Script d'importation des workflows n8n pour Windows PowerShell
# ==============================================================================

Write-Host "🔄 Importation des workflows n8n pour Assistant Cabinet..." -ForegroundColor Cyan

$workflows = @(
    "email-ingestion-workflow.json",
    "appointment-reminder-24h-workflow.json",
    "calendar-sync-workflow.json",
    "emergency-samu-escalation-workflow.json"
)

foreach ($wf in $workflows) {
    Write-Host "📦 Envoi de /workflows/$wf..." -ForegroundColor Yellow
    docker compose exec n8n n8n import:workflow --input="/workflows/$wf" 2>$null
}

Write-Host "✅ Workflows n8n prêts à l'emploi !" -ForegroundColor Green

