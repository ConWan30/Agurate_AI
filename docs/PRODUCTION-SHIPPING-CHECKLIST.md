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
- [x] Beta pricing shown as discount-off-published-rate (no hardcoded dollar list prices)
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
- [x] Case-insensitive cooperative invitation SELECT + join email-binding UX
- [x] Canonical health_score/confidence 0–100 across analyze-crop + UI
- [x] Demo fields UNIQUE(user_id,name) + durable beta-signup IP rate limits
- [x] Soften DIRT “direct integration” / Instant analysis / hard 100-spot claims
- [x] Daily briefing + predictive questions use canonical 0–100 health scores
- [x] Soften always-on advisor / real-time AR overlay claims
- [x] beta-signup skips field create for "multiple" crop
- [x] Catalog SELECT policies authenticated-only (`20260914130000`)
- [x] Demo mock assessments use 0–100 scores + symptoms arrays
- [x] Soften FREE-unlimited / acre-dollar prompt claims; honesty scan covers edge functions
- [x] setup-demo-account durable IP rate limit; onboarding crop normalize for varieties
- [x] Researcher match uses crop tokens; onboarding soybeans→soybean
- [x] get-usage-stats fail-closed rate limit
- [x] Soften expert-escalation “researcher will receive” delivery claim
- [x] Lock profile entitlement self-writes (beta_farmer / lifetime_discount)
- [x] Moderate success_stories before public visibility
- [x] Request-aware CORS allowlist for edge functions
- [x] Soften lifetime-urgency / FREE-unlimited residual claims
- [x] Fail-closed Scanner scores when AI omits health_score
- [x] Fix HowItWorks Rules-of-Hooks via reveal card components
- [x] Honest Upgrade/conversion waitlist CTAs (no fake checkout)
- [x] PWA runtime cache includes lovable.cloud hosts
- [x] Profile entitlement INSERT clamp (`20260914150000`)
- [x] Upload fail-closed when AI omits health_score
- [x] Honest offline/sync messaging (no fake sync complete)
- [x] Soften Home/HowItWorks residual enrichment & claims-speed copy
- [x] Remove wildcard CORS static export; robots/sitemap route alignment
- [x] Edge analyze-crop / unified-ai fail-closed (no invented health scores)
- [x] Daily briefing priority thresholds use 0–100 scores
- [x] Lock subscription_tier from client self-writes (`20260914160000`)
- [x] Soften BetaValueTracker / HowItWorks residual forecast claims
- [x] Shared requireHealthScore helper + tests
- [x] AR analyze + prediction edges fail closed (no invented scores)
- [x] unified-ai enrichment stubs mark unavailable (no invented confidence)
- [x] predict-water-stress fail closed on unparseable AI JSON
- [x] Field map does not invent health % / color when no assessment
- [x] Community insights + compare-images fail closed on unparseable AI JSON


- [x] ROI calculator refuses invented health scores
- [x] Expert escalation ignores missing confidence (no fake 0% urgency)
- [x] Scanner/analyze-crop fail closed on missing stress level
- [x] Unified AI omits fabricated weather context
- [x] Economic impact labeled as illustrative planning estimates
- [x] Critical alerts do not invent acreage; normalize string disease/pest payloads
- [x] Lock `subscription_status` from client self-writes (`20260914170000`)
- [x] Soften Home unlimited-beta + tutorial “Diagnosis” framing
- [x] Analytics/phase4/unified-AI omit invented weather & score defaults; soften forecast marketing copy
- [x] ROI requires explicit yield-at-risk % (no invent from health); executive summary shows “Not estimated”; beta_metrics counts only approved stories (`20260914180000`)
- [x] `npm run verify:local-gates` orchestrates typecheck + unit + honesty static + edge check + build; operator handoff doc for platform steps
- [x] `/health.json` stamped with git commit/branch/builtAt (vite plugin) for post-publish identity verification
- [x] Public route alignment gate (`verify:public-routes`) keeps App ↔ robots ↔ sitemap in sync
- [x] Persist durable `crop-images` storage paths (not ephemeral signed URLs) on assessments
- [x] Image history comparison fail-closed (no invented visual comparison on edge failure)
- [x] Daily briefing fail-closed (no invented spray windows / soft priorities)
- [x] Bug reports + Delta chat persist storage paths (not 1h signed URLs)
- [x] Daily briefing omits invented 0% health / parish-default weather when data missing
- [x] Predictive-question fallbacks refuse stress narratives without a real health score
- [x] Analytics/variety recs do not treat null health as 0 or invent yield from health×factor
- [x] analyze-crop weather uses field/photo coordinates only (no Morehouse hardcode)
- [x] Daily briefing omits spray/weather guidance when weather inputs are missing
- [x] ROI calculator requires user yield + protection assumptions (no silent defaults in math)
- [x] Soften residual "locked in / keep 50%" beta marketing to contingent language
- [x] Weather alerts use field GPS only (no Morehouse hardcode)
- [x] Beta signup leaves new field coordinates null until farmer sets them
- [x] Predictive-question AI prompt omits invented 0% health
- [x] Daily briefing summary buckets require hasHealthScore
- [x] analyze-crop prompts do not default location to Morehouse Parish
- [x] Analytics trends require two scored assessments (null health not treated as 0)
- [x] Weather timeline omits invented 0% when health score missing
- [x] Cooperative avg health averages scored assessments only
- [x] History weather card hidden when temp/precip not recorded
- [x] Soften residual absolute "Lock in / Keep 50%" beta pricing copy
- [x] Upload omits invented "Louisiana Delta region" when field GPS missing
- [x] History EconomicImpact requires finite yield-at-risk (null ≠ +0%)
- [x] Conversational-form beta discount copy is contingent (not guaranteed)
- [x] Critical alerts omit USD loss unless yield impact is recorded; UI labeled illustrative
- [x] ROI requires explicit acres + protection % (no silent 100-acre / 15% defaults)
- [x] History executive summary does not invent "none" pressure or critical stress from null health
- [x] Conversational-form insurance prompts fail closed on invented weather events / USD loss

## Platform gates (external)

See `docs/OPERATOR-PLATFORM-HANDOFF.md` for exact commands.

- [ ] Apply pending Supabase migrations (through `20260914370000` expert/coop/variety/extracted; prior `20260914300000` success/peer-cost/recommendation-update; prior `20260914290000` yield/feedback/event/bug/acreage; `20260914280000` claim loss / expert priority / form-complete / field_uniformity; `20260914270000` alert-ack; `20260914260000` delta/peer/expert; `20260914240000` critical-alert UPDATE freeze + claim↔assessment; `20260914230000` peer effectiveness CHECK; `20260914220000` AI metric invent lock; `20260914190000` claim UPDATE/invitation freeze; `20260914180000` beta metrics; entitlement clamps; researcher PII is `20260914100000`)
- [ ] Enable Supabase Auth **Leaked Password Protection**
- [ ] Deploy updated edge functions
- [ ] Set `DEMO_SETUP_SECRET` in function secrets (or leave unset to keep demo setup disabled)
- [ ] Publish/deploy updated app (Lovable Publish or production host)
- [ ] Smoke-test production URL: `/`, `/beta-signup`, `/auth`, `/how-it-works`

## Evidence expected before production-complete

1. Green CI/local `npm run verify:local-gates` (typecheck + unit tests + honesty static + edge check + build + honesty e2e) — **PASS on tip of `cursor/launch-readiness-honesty-38b2`** (confirm SHA with `git rev-parse HEAD` / live `/health.json`)
2. Migration applied confirmation in Supabase through `20260914370000_lock_coop_alert_coop_match_money_caps_ai_update_dirt` — **pending credentials**
3. Live production URL showing honest closed-beta copy — **pending publish**
4. Auth + one authenticated scan path working on production — **pending publish**

In-repo honesty/security residuals closed on this tip batch (success/peer cost CHECKs, recommendation UPDATE freeze, predict-stress fail-closed, Predictions unknown-risk honesty, local honesty e2e gate, yield/canopy CHECKs, feedback assessment RLS, event_type allowlist, bug_report status freeze, acreage CHECK, claim loss CHECK, expert priority freeze, form completed@100%, field_uniformity scale honesty, alert-ack ownership lock, conversation_memory INSERT drop, unknown stress no longer invents severe, critical-alert UPDATE freeze, claim↔assessment field match, peer effectiveness CHECK, claim INSERT status lock, coop-alert member INSERT drop, claim UPDATE/invitation freeze, disease/pest empty≠unknown, nutrient null≠none, NaN loss guards, SMS badge removed, health.json tip-stamp CI/local assert). Production-complete remains blocked on platform gates above (see `docs/OPERATOR-PLATFORM-HANDOFF.md`).
