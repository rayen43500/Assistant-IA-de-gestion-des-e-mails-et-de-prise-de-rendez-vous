# Import + activation des workflows MediLawAI dans n8n (Windows).
#   Local  : .\n8n\import-workflows.ps1            (n8n doit être arrêté)
#   Docker : .\n8n\import-workflows.ps1 -Docker
param([switch]$Docker)
$root = Split-Path -Parent $PSScriptRoot
if ($Docker) { node "$root\n8n\import-workflows.js" --docker } else { node "$root\n8n\import-workflows.js" }
