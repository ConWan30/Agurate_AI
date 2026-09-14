# Pre-Launch Critical Tasks

Last updated: 2026-09-14

## Current status

In-repo production hardening for closed beta is largely complete on branch
`cursor/launch-readiness-honesty-38b2`. Remaining blockers are **platform**
actions (credentials required), not dashboard code edits.

See also: `docs/PRODUCTION-SHIPPING-CHECKLIST.md`

## Still open (platform / external)

1. Apply pending Supabase migrations (view security invoker, RLS lock-down,
   testimonial unapprove, critical_alerts reconcile, secure RPCs)
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

## Obsolete guidance

Earlier “edit Edge Functions in the Supabase Dashboard” and placeholder
citation checklist items are superseded by repo migrations + edge function
source under `supabase/functions/`. Prefer git + CI over dashboard edits.
