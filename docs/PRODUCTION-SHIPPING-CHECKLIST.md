# Production Shipping Checklist

Last updated: 2026-09-14

## Code gates (repo)

- [x] Honest closed-beta marketing copy
- [x] Soften unverified ROI / offline / instant-diagnosis claims
- [x] SEO/Open Graph/JSON-LD closed-beta metadata
- [x] View `security_invoker` migration committed
- [x] PeerComparisonCard aligned to current RPC + real `fieldId`
- [x] Env fail-fast for required Supabase vars
- [x] React ErrorBoundary around app routes
- [x] Auth password rules ≥8 + letter + number (signup errors shown)
- [x] `robots.txt` + `sitemap.xml` + `health.json` + `_headers`
- [x] GitHub Actions CI with typecheck + tests + honesty static + build
- [x] `.env` removed from git; `.env.example` provided
- [x] Demo setup edge function gated by `DEMO_SETUP_SECRET`
- [x] Market prices labeled as estimates (not live USDA)
- [x] Weather alerts / AR analyze / daily briefing / predictive questions require authenticated users
- [x] Beta signup: no `listUsers`, no public `userId`, IP rate limit + validation
- [x] PWA registration via vite-plugin-pwa (no broken `/registerSW.js`)
- [x] Demo/integration routes gated to `import.meta.env.DEV`
- [x] Public honesty Playwright smoke spec + static honesty script
- [x] Production build passes
- [x] Password reset completes in-app (PASSWORD_RECOVERY + updateUser)
- [x] Seeded fabricated testimonials unapproved via migration
- [x] CSP allows lovable.cloud + supabase hosts
- [x] detect-critical-alerts ownership + rate-limit fixed
- [x] setup-demo-account avoids listUsers; verify_jwt=false for secret gate
- [x] Open RLS "System can INSERT/UPDATE true" policies replaced with ownership-scoped writes
- [x] Remaining edge functions use shared `requireAuthenticatedUser` (no bare npm supabase import)
- [x] CI Deno `check:edge` for `supabase/functions/*/index.ts`
- [x] Beta pricing shown as discount-off-published-rate (no hardcoded $39.50 / $49)
- [x] critical_alerts Jan/Nov schema reconcile migration + owned acknowledge RPC
- [x] weather_events insert types mapped to CHECK-allowed values
- [x] get_conversation_memory ownership check + usable cross-conversation signature
- [x] acknowledge_cooperative_alert requires cooperative membership
- [x] Beta/demo profile + field upserts mapped to live schema columns
- [x] Peer/researcher RPC auth + drop legacy unsecured overloads
- [x] Cooperative helper param-shadowing fix + creator/invite join policies
- [x] Peer/expert/coop Jan→Nov schema reconcile migration
- [x] Shared rate limiter fails closed on DB errors
- [x] Cooperatives create/join uses `cooperative_members.role` (no phantom roles table)
- [x] Playwright honesty smoke installed in CI
- [x] crop-images storage ownership policies (uid-prefixed paths)
- [x] Shared edge rate limiter fail-closed on read/write errors; migrate high-traffic AI funcs
- [x] Normalize soybean crop_type (DB CHECK singular) across client + edges
- [x] Community/beta metrics use get_beta_farmer_count + honest own-assessment labels
- [x] Expand fail-closed `enforceRateLimit` across remaining AI/edge functions
- [x] Researcher PII: directory view (no email) + RPC without email + base table SELECT revoked
- [x] Daily briefing uses `location_lat` / `location_lng`
- [x] Soften false invite-email / researcher-notification delivery claims
- [x] `verify_jwt=true` for get-market-prices / generate-daily-briefing / generate-predictive-questions

## Platform gates (external)

- [ ] Apply pending Supabase migrations (through `20260914100000` researcher PII + crop checks, plus prior RLS/RPC/storage)
- [ ] Enable Supabase Auth **Leaked Password Protection**
- [ ] Deploy updated edge functions
- [ ] Set `DEMO_SETUP_SECRET` in function secrets (or leave unset to keep demo setup disabled)
- [ ] Publish/deploy updated app (Lovable Publish or production host)
- [ ] Smoke-test production URL: `/`, `/beta-signup`, `/auth`, `/how-it-works`

## Evidence expected before production-complete

1. Green CI/local typecheck + unit tests + honesty static + edge check + build
2. Migration applied confirmation in Supabase (including critical_alerts reconcile)
3. Live production URL showing honest closed-beta copy
4. Auth + one authenticated scan path working on production
