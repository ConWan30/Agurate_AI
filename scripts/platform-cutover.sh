#!/usr/bin/env bash
# Apply tip migrations + deploy edge functions once Supabase credentials exist.
# Does NOT enable leaked-password (Dashboard-only) and does NOT publish the SPA.
#
# Required env:
#   SUPABASE_ACCESS_TOKEN   — personal access token (supabase.com account)
#   SUPABASE_DB_PASSWORD    — database password for project rkfvefhjyuyhjmcljzev
# Optional:
#   SUPABASE_PROJECT_REF    — default rkfvefhjyuyhjmcljzev
#   SKIP_FUNCTIONS=1        — migrations only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-rkfvefhjyuyhjmcljzev}"
CLI=(npx --yes supabase)

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "FAIL  SUPABASE_ACCESS_TOKEN is required"
  exit 1
fi
if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "FAIL  SUPABASE_DB_PASSWORD is required"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN
export SUPABASE_DB_PASSWORD

echo "==> Linking project ${PROJECT_REF}"
"${CLI[@]}" link --project-ref "$PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"

echo "==> Pushing migrations through tip (includes drop of __tmp_apply_migration)"
"${CLI[@]}" db push --include-all -p "$SUPABASE_DB_PASSWORD"

if [[ "${SKIP_FUNCTIONS:-0}" != "1" ]]; then
  echo "==> Deploying edge functions"
  "${CLI[@]}" functions deploy
  echo "NOTE  Leaving DEMO_SETUP_SECRET unset (fail-closed demo setup)."
fi

echo
echo "PASS  DB push complete. Still required manually:"
echo "  1. Auth → Leaked Password Protection (Dashboard)"
echo "  2. Publish SPA so /health.json commit == git tip"
echo "  3. PRODUCTION_URL=... EXPECTED_COMMIT=\$(git rev-parse HEAD) npm run verify:production-smoke"
echo "  4. Authenticated Morehouse soybean scan (real score or clear fail-closed error)"
