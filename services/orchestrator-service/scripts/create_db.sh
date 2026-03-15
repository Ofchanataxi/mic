#!/usr/bin/env bash
set -euo pipefail

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-postgres}"
PGPASSWORD="${POSTGRES_PASSWORD:-1234}"
export PGPASSWORD

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -f "$(dirname "$0")/create_db.sql"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d mic_orchestrator -f "$(dirname "$0")/../src/db/schema.sql"

echo "Database mic_orchestrator and schema initialized successfully."
