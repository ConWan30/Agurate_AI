#!/usr/bin/env bash
# Typecheck all Supabase edge function entrypoints with Deno.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v deno >/dev/null 2>&1; then
  echo "Deno is required for edge function checks. Install from https://deno.land" >&2
  exit 1
fi

shopt -s nullglob
entries=(supabase/functions/*/index.ts)
if [[ ${#entries[@]} -eq 0 ]]; then
  echo "No edge function entrypoints found." >&2
  exit 1
fi

failed=0
for entry in "${entries[@]}"; do
  echo "deno check $entry"
  if ! deno check "$entry"; then
    failed=1
  fi
done

if [[ "$failed" -ne 0 ]]; then
  echo "Edge function typecheck failed." >&2
  exit 1
fi

echo "Edge function typecheck passed (${#entries[@]} functions)."
