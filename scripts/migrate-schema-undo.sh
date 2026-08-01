#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

set -a && source .env && set +a

echo "=== DROP SCHEMA gym CASCADE ==="
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA IF EXISTS gym CASCADE;"

echo
echo "Done. Schema gym removed."
