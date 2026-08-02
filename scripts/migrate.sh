#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Run all pending migrations in order against the DB container
#  Usage:  npm run migrate
# ─────────────────────────────────────────────────────────────

set -e

# Load .env so we can read DB vars
if [ -f "$(dirname "$0")/../.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/../.env" | xargs)
fi

CONTAINER="${DB_CONTAINER:-proyecto_paginas_web_db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-proyecto_paginas_web}"
MIGRATIONS_DIR="$(dirname "$0")/../database/migrations"

echo ""
echo "📦  Running migrations on container: $CONTAINER"
echo "    Database : $DB_NAME"
echo "    User     : $DB_USER"
echo ""

# Tracking table already in use stores the migration key in column `id`
# (values look like: migrations/001_initial_schema.sql).
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id         TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
" > /dev/null

APPLIED=0
SKIPPED=0

for filepath in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  filename=$(basename "$filepath")
  migration_id="migrations/$filename"

  # Accept both historical key formats: bare filename and migrations/<file>
  ALREADY=$(docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT COUNT(*) FROM schema_migrations
     WHERE id IN ('$filename', '$migration_id');")

  if [ "$ALREADY" != "0" ]; then
    echo "  ⏭  Skipped  $filename  (already applied)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "  ✓  Applying $filename ..."
  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$filepath"

  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "INSERT INTO schema_migrations (id) VALUES ('$migration_id');" > /dev/null

  APPLIED=$((APPLIED + 1))
done

echo ""
echo "✅  Done — $APPLIED applied, $SKIPPED skipped."
echo ""
