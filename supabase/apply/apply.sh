#!/usr/bin/env bash
# Apply all schema SQL files in apply-order.txt against DATABASE_URL.
# Usage:
#   export DATABASE_URL="postgresql://..."
#   ./supabase/apply/apply.sh
# Optional: SCHEMA_ONLY=1 to skip (not used; placeholder for future)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ORDER_FILE="$(cd "$(dirname "$0")" && pwd)/apply-order.txt"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL to your Postgres connection string." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required." >&2
  exit 1
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  # trim
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  path="$ROOT/$line"
  if [[ ! -f "$path" ]]; then
    echo "Missing file: $path" >&2
    exit 1
  fi
  echo "==> $line"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$path"
done < "$ORDER_FILE"

echo "Done."
