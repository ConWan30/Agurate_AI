# Production Shipping Checklist

Last updated: 2026-09-14

Use this as the remaining gate list for AgurateAI production-complete readiness.

## Code gates (repo)

- [x] Honest closed-beta marketing copy (no fabricated accuracy/validation/partner claims)
- [x] Soften unverified ROI/timing benefit claims on How It Works
- [x] SEO/Open Graph/JSON-LD closed-beta metadata
- [x] View `security_invoker` migration committed
- [x] PeerComparisonCard aligned to current RPC + real `fieldId`
- [x] Debug `console.log` gated behind `import.meta.env.DEV`
- [x] Phase 4 helper unit tests + honesty regression tests
- [x] Env fail-fast for required Supabase vars
- [x] Real React `ErrorBoundary` around app routes
- [x] Auth password rules: ≥8 chars + letter + number (aligned UI + Zod)
- [x] `robots.txt` + `sitemap.xml` + `health.json` + `_headers` CSP baseline
- [x] GitHub Actions CI (`lint`/`test`/`build`)
- [x] Production build (`npm run build`) passes

## Platform gates (external)

- [ ] Apply pending Supabase migrations (including `20260914010000_force_view_security_invoker.sql`)
- [ ] Enable Supabase Auth **Leaked Password Protection**
- [ ] Confirm edge functions deployed with current honesty/citation prompts
- [ ] Publish/deploy updated app (Lovable Publish or production host)
- [ ] Smoke-test production URL: `/`, `/beta-signup`, `/auth`, `/how-it-works`, authenticated dashboard scan loop

## Evidence expected before marking production-complete

1. Green local/CI build + unit tests
2. Migration applied confirmation in Supabase
3. Live production URL showing honest closed-beta copy
4. Auth + one authenticated scan path working on production
