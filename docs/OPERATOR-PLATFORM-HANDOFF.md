# Operator platform handoff

## Status (in-repo vs production-complete)

| Gate | Status | Evidence |
|------|--------|----------|
| In-repo honesty, security, quality | **Complete (tip)** | Tip on `cursor/launch-readiness-honesty-38b2` (verify with `git rev-parse HEAD`). Re-confirm with `npm run verify:local-gates` + tip CI after each push. Product-facing invent/security residuals are saturated in-repo; remaining work is platform-only. |
| Apply Supabase migrations through tip | **Blocked** | Needs project DB credentials (`supabase db push` or Dashboard SQL) |
| Auth Leaked Password Protection | **Blocked** | Needs Supabase Dashboard access |
| Deploy edge functions | **Blocked** | Needs Supabase CLI linked project + secrets |
| `DEMO_SETUP_SECRET` policy | **Blocked** | Needs function secrets access |
| Publish app + live `/health.json` | **Blocked** | Needs Lovable Publish / host credentials. Candidate host `https://agurateai.lovable.app` currently **404s `/health.json`** (tip stamp not published). Public routes return 200; shell/JS phrase scan may not show older marketing strings, but tip identity is unverified until `/health.json` matches HEAD. |
| Production smoke | **Blocked** | `PRODUCTION_URL=https://agurateai.lovable.app EXPECTED_COMMIT=$(git rev-parse HEAD) npm run verify:production-smoke` currently **FAILS** on missing `/health.json` tip stamp. Re-run after Publish. |

**Production-complete is not achieved until every row above is evidenced.**  
The coding agent cannot complete platform rows without service-role / Dashboard / publish credentials.

Verify local gates anytime:

```bash
npm run verify:local-gates
```

Latest migration in repo: `20260914260000_lock_delta_peer_expert_invent`

## 1. Apply Supabase migrations

Apply **all** pending migrations through tip  
`20260914260000_lock_delta_peer_expert_invent`  
(includes critical-alert UPDATE freeze + claim↔assessment field match, peer effectiveness CHECK, AI metric client-write locks, insurance claim status lock + invitation column freeze, entitlement locks `20260914140000`–`20260914170000`, researcher PII revoke `20260914100000`, prior RLS/RPC/storage).

```bash
# Linked project
supabase db push

# Or via Dashboard → SQL → run each pending migration in timestamp order
```

**Evidence receipt:** paste Supabase migration history showing tip `20260914260000_…` applied with no errors.

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

Use Lovable **Publish** (or your production host) so the live URL serves the
branch/build that includes the current tip of `cursor/launch-readiness-honesty-38b2` (`git rev-parse HEAD`).

Candidate production host observed in-repo metadata: `https://agurateai.lovable.app`.

**Current live evidence (pre-publish):** that host returns HTTP 200 for public routes but:
- `/health.json` → **404** (tip stamp not published — decisive tip-identity failure)
- Homepage shell/JS may not still embed older fabricated accuracy / LSU-validation-badge / testimonial strings; tip publish is still required so live `/health.json` matches HEAD and honesty gates stay enforceable

Until Publish ships this tip, production smoke remains failed.

```bash
# After publish — confirm tip identity + live honesty
curl -sS https://agurateai.lovable.app/health.json
# Expect: "status":"ok", "stage":"closed-beta", "commit":"<tip sha>"

PRODUCTION_URL=https://agurateai.lovable.app EXPECTED_COMMIT=$(git rev-parse HEAD) npm run verify:production-smoke
```

**Evidence receipt:** `verify:production-smoke` PASS (health tip match + no live honesty regressions).

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

**Evidence receipt:** `verify:production-smoke` PASS + note of authenticated scan result.

## Credentials required (why the coding agent stops here)

This environment has **no** Supabase access token, DB password, service-role key, or Lovable publish credentials. Platform rows cannot be evidenced until an operator with those credentials runs the steps above and pastes receipts.

## Done means

- [x] Local gates green (`npm run verify:local-gates` + CI) — tip of `cursor/launch-readiness-honesty-38b2`
- [ ] Migrations applied through `20260914210000_…`
- [ ] Leaked password protection on
- [ ] Edge functions deployed + demo secret policy set
- [ ] App published
- [ ] Live smoke passed (`verify:production-smoke` + authenticated scan)
