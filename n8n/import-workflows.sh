#!/usr/bin/env sh
# Import + activation des workflows MediLawAI dans n8n.
#   Local  : ./n8n/import-workflows.sh          (n8n doit être arrêté)
#   Docker : ./n8n/import-workflows.sh --docker
cd "$(dirname "$0")/.." && node n8n/import-workflows.js "$@"
