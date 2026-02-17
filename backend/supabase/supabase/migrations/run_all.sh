#!/bin/bash
# ============================================================================
# Run All Migrations
# ============================================================================
# Usage: ./run_all.sh <database_url>
# Example: ./run_all.sh "postgresql://postgres:password@localhost:5432/postgres"
# ============================================================================

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <database_url>"
  echo "Example: $0 \"postgresql://postgres:password@localhost:5432/postgres\""
  exit 1
fi

DATABASE_URL="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Running Dez database migrations..."
echo "=================================="

for migration in "$SCRIPT_DIR"/[0-9]*.sql; do
  filename=$(basename "$migration")
  echo "Running: $filename"
  psql "$DATABASE_URL" -f "$migration"
  echo "✓ Completed: $filename"
  echo ""
done

echo "=================================="
echo "All migrations completed successfully!"
