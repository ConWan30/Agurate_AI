# Pre-Launch Critical Tasks

Last updated: 2026-09-14

## Current status

In-repo production hardening for closed beta is largely complete on branch
`cursor/launch-readiness-honesty-38b2`. Remaining blockers are **platform**
actions (credentials required), not dashboard code edits.

See also: `docs/PRODUCTION-SHIPPING-CHECKLIST.md`

## Still open (platform / external)

1. Apply pending Supabase migrations (through `20260914140000` researcher PII
   + soybean crop checks, plus view invoker, RLS lock-down, testimonials,
   critical_alerts, secure RPCs, coop auth, peer/expert/coop reconcile,
   crop-images storage)
2. Enable Auth **Leaked Password Protection**
3. Deploy updated edge functions
4. Set `DEMO_SETUP_SECRET` (or leave unset to keep demo setup disabled)
5. Publish/deploy the app
6. Smoke-test production: `/`, `/beta-signup`, `/auth`, `/how-it-works`

## Recently closed in-repo (do not re-open as dashboard edits)

- Honest closed-beta marketing + static honesty CI gate
- Shared edge auth (`requireAuthenticatedUser`) + Deno `check:edge`
- Open `System can … WITH CHECK (true)` write policies locked down
- `critical_alerts` Jan/Nov schema reconcile + owned acknowledge RPC
- Conversation memory + cooperative acknowledge RPC ownership checks
- Beta/demo profile upserts mapped to live `profiles` columns
- Expert escalation insert mapped to live `expert_consultations` columns
- Peer/researcher DEFINER RPCs require auth; legacy overloads dropped
- `is_cooperative_member` / `is_cooperative_admin` param shadowing fixed
- Cooperatives creator bootstrap + invite join RLS; no `cooperative_roles`
- Peer/expert/coop Jan→Nov column reconcile migration
- Rate limiter fail-closed; Playwright honesty smoke in CI
- crop-images storage ownership policies + uid-prefixed upload paths
- Fail-closed shared rate limiter on high-traffic AI edge functions
- Soybean crop_type normalization to match fields CHECK
- Community/beta metrics honesty (RPC count + own-scoped assessment labels)
- Fail-closed rate limits on remaining AI edges (ar/unified/briefing/predictions/etc.)
- Researcher PII locked: directory view + RPC without email; base table SELECT revoked
- Softened false invite-email / researcher-notification claims
- Daily briefing field coords use `location_lat` / `location_lng`

## Obsolete guidance

Earlier “edit Edge Functions in the Supabase Dashboard” and placeholder
citation checklist items are superseded by repo migrations + edge function
source under `supabase/functions/`. Prefer git + CI over dashboard edits.

- [x] Soften 24/7 advisor / real-time AR overlay claims
- [x] beta-signup skips field create for "multiple" crop
- [x] Catalog SELECT policies authenticated-only (`20260914130000`)
