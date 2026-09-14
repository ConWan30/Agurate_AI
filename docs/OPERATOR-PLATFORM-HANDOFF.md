# Operator platform handoff

## Status (in-repo vs production-complete)

| Gate | Status | Evidence |
|------|--------|----------|
| In-repo honesty, security, quality | **Complete** | Tip `d5ab23d` on `cursor/launch-readiness-honesty-38b2`; local `npm run verify:local-gates` PASS; GitHub CI `build-and-test` PASS on tip |
| Apply Supabase migrations through tip | **Blocked** | Needs project DB credentials (`supabase db push` or Dashboard SQL) |
| Auth Leaked Password Protection | **Blocked** | Needs Supabase Dashboard access |
| Deploy edge functions | **Blocked** | Needs Supabase CLI linked project + secrets |
| `DEMO_SETUP_SECRET` policy | **Blocked** | Needs function secrets access |
| Publish app + live `/health.json` | **Blocked** | Needs Lovable Publish / host credentials |
| Production smoke | **Blocked** | Needs live production URL |

**Production-complete is not achieved until every row above is evidenced.**  
The coding agent cannot complete platform rows without service-role / Dashboard / publish credentials.

Verify local gates anytime:

```bash
npm run verify:local-gates
```

Latest migration in repo: `20260914180000_beta_metrics_require_approved_stories`

## 1. Apply Supabase migrations

Apply **all** pending migrations through tip  
`20260914180000_beta_metrics_require_approved_stories`  
(includes entitlement locks `20260914140000`–`20260914170000`, researcher PII revoke `20260914100000`, prior RLS/RPC/storage).

```bash
# Linked project
supabase db push

# Or via Dashboard → SQL → run each pending migration in timestamp order
```

**Evidence receipt:** paste Supabase migration history showing tip `20260914180000_…` applied with no errors.

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
branch/build that includes tip `d5ab23d` (or a later tip on this branch).

Evidence: production HTML/JS matches tip commit; `/health.json` loads with that commit.

```bash
# After publish — confirm the live build identity matches the tip SHA you intended
curl -sS https://YOUR_PRODUCTION_HOST/health.json
# Expect: "status":"ok", "stage":"closed-beta", "commit":"<tip sha>"
```

**Evidence receipt:** `curl` JSON with `commit` equal to published tip SHA.

## 6. Production smoke

On the live URL, confirm:

| Route | Expect |
|-------|--------|
| `/` | Closed-beta framing; no fabricated accuracy / fake LSU partnership |
| `/beta-signup` | Signup form loads |
| `/auth` | Auth loads |
| `/how-it-works` | Honest capability copy |
| `/health.json` | `status=ok`, `stage=closed-beta`, `commit` equals published tip SHA |

Also: one authenticated scan/upload path returns a real health score or a clear
error — never a silent invented score.

**Evidence receipt:** checklist of routes OK + note of authenticated scan result.

## Done means

- [x] Local gates green (`npm run verify:local-gates` + CI) — tip `d5ab23d`
- [ ] Migrations applied through `20260914180000_…`
- [ ] Leaked password protection on
- [ ] Edge functions deployed + demo secret policy set
- [ ] App published
- [ ] Live smoke passed
