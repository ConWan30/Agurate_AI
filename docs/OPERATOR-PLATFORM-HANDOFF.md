# Operator platform handoff

## Pilot wedge (in-repo)

Closed beta product scope is **Morehouse Parish × soybeans**. See `docs/PILOT-SCOPE-MOREHOUSE-SOYBEAN.md`. Unvalidated suite modules route to `PilotDeferred`.

## Status (in-repo vs production-complete)

| Gate | Status | Evidence |
|------|--------|----------|
| In-repo honesty, security, quality | **Complete for tip invent locks** | Re-confirm with `npm run verify:local-gates` + tip CI after each push. Pilot wedge: Morehouse Parish × soybeans. |
| Apply Supabase migrations through tip | **Blocked (credentials)** | Lovable cutover stalled mid-apply; live DB still exposes `public.__tmp_apply_migration(p_sql)` (anon gets permission denied). Tip migration `20260914470000_…` drops it. Run `scripts/platform-cutover.sh` once `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` are available. |
| Auth Leaked Password Protection | **Blocked (Dashboard)** | Needs Supabase Dashboard toggle. |
| Deploy edge functions | **Blocked (credentials)** | Same cutover script deploys functions after `db push`. |
| `DEMO_SETUP_SECRET` policy | **OK if unset** | Leave unset so `setup-demo-account` stays fail-closed (Lovable left it unset). |
| Publish app + live `/health.json` | **Partial (tip proven publicly; durable host pending)** | Lovable host still stamps `465ab48`. Tip `c8e1545` published to ephemeral Vercel temp URL + Netlify drop; `/health.json` matches tip. Durable path still needs GitHub Pages enable (workflow ready) or claimed/static host / Lovable top-up. |
| Production smoke vs live stamp | **PASS at tip (public alternate host); Lovable host lagging** | `PRODUCTION_URL=<tip host> EXPECTED_COMMIT=c8e15454f8bf4be68949428cd0af4261c1edc1e3 npm run verify:production-smoke` **PASS**. Lovable URL still only matches `465ab48`. |

**Production-complete is not achieved until every row above is evidenced against git tip on a durable production URL, with migrations + leaked-password + edge deploy + authenticated Morehouse soybean scan.**  
Blocked only on Supabase credentials (and Pages enable / durable host if Lovable stays credit-dead).

Verify local gates anytime:

```bash
npm run verify:local-gates
```

Latest migration in repo: `20260914470000_drop_tmp_apply_migration_helper`

## 1. Apply Supabase migrations

Apply **all** pending migrations through tip  
`20260914470000_drop_tmp_apply_migration_helper` (also apply prior `20260914460000_scrub_weather_events_gps_catalog` and `20260914450000_scrub_peer_effectiveness_history`)  
(includes peer INSERT ownership/recommendation bind + peer RPC `farmer_count` + beta_metrics fanout fix + coop alert INSERT status normalize + dirt GUC water_savings strip; prior peer-sample honesty + success/testimonial INSERT money strip + weather parish DEFAULT drop + coop alert acres upper cap; prior catalog INSERT reject + UPDATE freezes, community/variety/success/testimonial/peer UPDATE freezes, money upper caps, prior coop-alert coop-match + dirt INSERT GUC, AI metric UPDATE freezes, expert consultation field ownership, cooperative alert content freeze, variety recommendation honesty, conversational extracted_data invent lock, success-story / peer cost CHECKs + recommendation UPDATE freeze, yield/canopy CHECKs, feedback assessment RLS, insurance event_type allowlist, bug_report status freeze, fields.acreage CHECK, claim loss % CHECK, expert priority freeze, conversational completed@100%, field_uniformity CHECK, alert-ack + conversation_memory locks, delta/peer/expert invent locks, critical-alert UPDATE freeze + claim↔assessment field match, peer effectiveness CHECK, AI metric client-write locks, insurance claim status lock + invitation column freeze, entitlement locks `20260914140000`–`20260914170000`, researcher PII revoke `20260914100000`, prior RLS/RPC/storage).

```bash
# Linked project
supabase db push

# Or via Dashboard → SQL → run each pending migration in timestamp order
```

**Evidence receipt:** paste Supabase migration history showing tip `20260914470000_…` applied with no errors. Confirm `public.__tmp_apply_migration(text)` does not exist.

## 2. Enable Auth Leaked Password Protection

Supabase Dashboard → **Authentication** → **Providers / Security** → enable  
**Leaked password protection** (Have I Been Pwned check).

**Evidence receipt:** screenshot or note that the Auth security panel shows Leaked password protection **enabled**.

## 3. Deploy edge functions

```bash
supabase functions deploy
# Or deploy individually if your workflow prefers per-function deploys
```

Ensure function secrets include project URL / anon / service role as already configured
for this project.

**Evidence receipt:** deploy command output listing functions updated to tip.

## 4. Demo setup secret

```bash
# Prefer a long random secret in production if demo seeding is needed:
supabase secrets set DEMO_SETUP_SECRET="$(openssl rand -hex 32)"

# Or leave unset so setup-demo-account stays disabled (fail-closed).
```

**Evidence receipt:** note whether secret is set or intentionally left unset.

## 5. Publish the app

Lovable credits are exhausted. Prefer one of:

1. **GitHub Pages** — enable Settings → Pages → Source = GitHub Actions. Workflow: `.github/workflows/deploy-pages.yml` (build already green; deploy soft-fails until Pages is enabled).
2. **Claim/keep a static host** serving tip `dist/` (Vercel temporary / Netlify drop were used for tip proof; claim within 60m or redeploy).
3. **Lovable Publish** after credit top-up to `https://agurateai.lovable.app`.

**Evidence (2026-09-15):**
- Lovable host `/health.json` → **200** at lagging commit `465ab485e3b8e72524a4e3d2b2c7ee09bccbe70b`
- Tip SPA built + publicly smoke-verified at `c8e15454f8bf4be68949428cd0af4261c1edc1e3` (`/health.json` tip match + honesty routes PASS)
- Live DB still has `__tmp_apply_migration` — apply tip migrations (incl. `20260914470000`) before trusting production DB invent locks
- Pages workflow build succeeds; deploy returns 404 until Pages is enabled

Production-complete needs tip `/health.json` on a **durable** production URL (Pages/claimed host/Lovable), not only a 60-minute temporary deploy.


## 6. Production smoke

On the live URL, confirm:

| Route | Expect |
|-------|--------|
| `/` | Closed-beta framing; no fabricated accuracy / fake LSU partnership |
| `/beta-signup` | Signup form loads |
| `/auth` | Auth loads |
| `/how-it-works` | Honest capability copy |
| `/health.json` | `status=ok`, `stage=closed-beta`, `commit` equals published tip SHA |

Automated helper (public routes + health tip match + live honesty phrase checks):

```bash
PRODUCTION_URL=https://agurateai.lovable.app EXPECTED_COMMIT=$(git rev-parse HEAD) npm run verify:production-smoke
```

Also: one authenticated scan/upload path returns a real health score or a clear
error — never a silent invented score.

Automated helper (requires pilot test user secrets):

```bash
AGURATE_PILOT_TEST_EMAIL=... AGURATE_PILOT_TEST_PASSWORD=... npm run verify:auth-morehouse-scan
```

Tip public host (ephemeral unless claimed/Pages-enabled) was last smoke-verified at tip `7cb2d31f47f41a65bba816eb4493f1eca0320462`.


**Evidence receipt:** `verify:production-smoke` PASS + note of authenticated scan result.

## Credentials required (why the coding agent stops here)

This environment has **no** Supabase access token, DB password, service-role key, or Lovable publish credentials. Platform rows cannot be evidenced until an operator with those credentials runs the steps above and pastes receipts.

## Done means

- [x] Local gates green (`npm run verify:local-gates` + CI) — tip of `cursor/launch-readiness-honesty-38b2`
- [ ] Migrations applied through tip (`20260914470000_…`); `__tmp_apply_migration` dropped
- [ ] Leaked password protection on
- [ ] Edge functions deployed + demo secret policy set
- [ ] App published
- [ ] Live smoke passed (`verify:production-smoke` + authenticated scan)
