#!/usr/bin/env bash
# Apply tip migrations + deploy edge functions once Supabase credentials exist.
# Attempts leaked-password via Management API (Dashboard fallback). Does NOT publish the SPA.
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

# Best-effort: enable HaveIBeenPwned leaked-password via Management API.
# Field name has varied across API versions; try known keys, never fail the cutover.
if [[ "${SKIP_LEAKED_PASSWORD:-0}" != "1" ]]; then
  echo "==> Attempting Auth leaked-password enable via Management API"
  auth_json="$("${CLI[@]}" --experimental inspect db 2>/dev/null || true)"
  for key in password_hibp_enabled security_password_hibp_enabled hibp_enabled; do
    code="$(curl -sS -o /tmp/supabase-auth-patch.json -w '%{http_code}' \
      -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"${key}\": true}" || true)"
    echo "  PATCH auth config ${key} → HTTP ${code}"
    if [[ "${code}" == "200" ]]; then
      echo "PASS  Leaked-password setting accepted (${key}=true)"
      break
    fi
  done
  if [[ "${code:-}" != "200" ]]; then
    echo "NOTE  Management API did not confirm leaked-password enable — toggle in Dashboard."
  fi
fi

echo
echo "PASS  DB push complete. Still required:"
echo "  1. Confirm Auth → Leaked Password Protection enabled (Dashboard if API patch failed)"
echo "  2. Publish SPA so /health.json commit == git tip (Lovable Publish, GitHub Pages workflow, or static host)"
echo "  3. PRODUCTION_URL=... EXPECTED_COMMIT=\$(git rev-parse HEAD) npm run verify:production-smoke"
echo "  4. Authenticated Morehouse soybean scan (real score or clear fail-closed error)"
