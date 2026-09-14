# Pre-Launch Critical Tasks

Last updated: 2026-09-14

## Current status

In-repo production hardening for closed beta is largely complete on branch
`cursor/launch-readiness-honesty-38b2`. Remaining blockers are **platform**
actions (credentials required), not dashboard code edits.

See also: `docs/PRODUCTION-SHIPPING-CHECKLIST.md` and `docs/OPERATOR-PLATFORM-HANDOFF.md`


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
- [x] Public route alignment gate (`verify:public-routes`) keeps App ↔ robots ↔ sitemap in sync
- [x] `npm run verify:local-gates` + `docs/OPERATOR-PLATFORM-HANDOFF.md` for credentialed shipping steps
- [x] `/health.json` build stamp includes git commit for post-publish verification
- [x] Assessment health/AI scores persisted only via analyze-crop service role (`20260914210000`)
- [x] AI metric tables locked from client invent; DIRT click via RPC (`20260914220000`)
- [x] Peer effectiveness_score CHECK 0–100 (`20260914230000`); critical-alert UPDATE freeze + claim↔assessment field match (`20260914240000`)
- [x] Conversational-form metrics/messages + request_logs invent lock (`20260914250000`)
- [x] Delta assistant invent lock + peer field ownership + expert/LSU response freeze (`20260914260000`)
- [x] Alert acknowledgments + conversation_memory client INSERT lock (`20260914270000`); unknown stress no longer invents “severe” in Dashboard/FieldMap/WeatherTimeline/Scanner
- [x] Claim loss % CHECK + expert priority freeze + form completed@100% + field_uniformity CHECK (`20260914280000`)
- [x] Yield/canopy CHECKs + feedback assessment RLS + insurance event_type allowlist + bug_report status freeze + acreage CHECK (`20260914290000`)
- [x] Success-story / peer cost CHECKs + recommendation UPDATE freeze (`20260914300000`); predict-stress fail-closed + Predictions unknown risk honesty; local gates include honesty e2e
- [x] Residual invent: recommend-varieties binds variety from field columns and nulls expected_improvement (no inventable yield %); conservation ignores client history/weather and uses real average_savings; predict-stress uses real water_stress_events + community_insights; unified vision fail-closes score validation before pool write; delta-chat/conversation memory persist IDs only; conversational-form broadens money-key strip on extracted_data + field_mapping; daily-briefing Open-Meteo °F/inch units; image-compare null health delta + improving-only recovery invent lock; predictive questions drop cost examples; comprehensive predictions force weather_impact null; cooperatives omit null acreage as 0; image-annotations bind owned assessment image + gate healthy markers; AR analyze bounds/visual_cues fail-closed; enhanced-feature types nullable savings/unknown severity; types include edge_ip_rate_limits

## Still open (platform / external)

1. Apply pending Supabase migrations through `20260914430000` (drop legacy peer_comparison_data invent view; prior coop-alert severity/crop/acres; prior peer-crop-bind/cost-strip; prior peer-insert/beta-metrics/coop/dirt; prior `20260914390000` peer-sample/success-insert/weather; prior `20260914380000` catalog/community/variety/money-caps; prior `20260914370000` coop-alert-coop-match/ai-update/dirt; prior success/peer-cost/recommendation-update;
   yield/feedback/event/bug/acreage `20260914290000`;
   claim loss / priority / form-complete `20260914280000`;
   alert-ack + conversation_memory invent lock `20260914270000`;
   delta/peer/expert invent `20260914260000`; critical-alert UPDATE freeze + claim
   assessment field match; peer effectiveness CHECK `20260914230000`; AI metric client-write lock
   `20260914220000` + assessment AI-score service-role persist `20260914210000`; claim INSERT status
   lock + coop-alert member INSERT drop `20260914200000`; claim UPDATE/
   invitation freeze `20260914190000`; researcher PII is `20260914100000`; `subscription_status`
   lock is `20260914170000`; beta_metrics approved-story sync is `20260914180000`;
   plus prior RLS/RPC/storage/soybean checks)
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

- [x] Soften always-on advisor / real-time AR overlay claims
- [x] beta-signup skips field create for "multiple" crop
- [x] Catalog SELECT policies authenticated-only (`20260914130000`)
