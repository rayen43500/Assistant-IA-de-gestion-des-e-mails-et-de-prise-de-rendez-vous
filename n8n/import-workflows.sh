#!/usr/bin/env bash
# ==============================================================================
# Script d'importation automatique des workflows n8n pour le Cabinet IA
# ==============================================================================

echo "🔄 Importation des workflows n8n dans le conteneur cabinet_n8n..."

WORKFLOWS_DIR="/workflows"

# Vérifier si n8n est actif en CLI
if command -v n8n &> /dev/null; then
    for f in "$WORKFLOWS_DIR"/*.json; do
        if [ -f "$f" ]; then
            echo "📦 Importation de $f..."
            n8n import:workflow --input="$f"
        fi
    done
    echo "✅ Tous les workflows ont été importés avec succès dans n8n !"
else
    echo "⚠️ La commande CLI n8n n'est pas directement dans le PATH local."
    echo "💡 Pour importer dans Docker Compose :"
    echo "docker compose exec n8n n8n import:workflow --input=/workflows/email-ingestion-workflow.json"
    echo "docker compose exec n8n n8n import:workflow --input=/workflows/appointment-reminder-24h-workflow.json"
    echo "docker compose exec n8n n8n import:workflow --input=/workflows/calendar-sync-workflow.json"
    echo "docker compose exec n8n n8n import:workflow --input=/workflows/emergency-samu-escalation-workflow.json"
fi

