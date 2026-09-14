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
- [x] Remaining honesty gaps: beta dollar inconsistency, $15K placeholder, unsourced $/acre, 80% faster

## Platform gates (external)

- [ ] Apply pending Supabase migrations (including view security invoker + RLS lock-down + testimonial unapprove)
- [ ] Enable Supabase Auth **Leaked Password Protection**
- [ ] Deploy updated edge functions
- [ ] Set `DEMO_SETUP_SECRET` in function secrets (or leave unset to keep demo setup disabled)
- [ ] Publish/deploy updated app (Lovable Publish or production host)
- [ ] Smoke-test production URL: `/`, `/beta-signup`, `/auth`, `/how-it-works`

## Evidence expected before production-complete

1. Green CI/local typecheck + unit tests + honesty static + build
2. Migration applied confirmation in Supabase
3. Live production URL showing honest closed-beta copy
4. Auth + one authenticated scan path working on production
