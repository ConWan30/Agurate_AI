# Operator platform handoff

In-repo launch readiness is complete on `cursor/launch-readiness-honesty-38b2`.
**Production-complete requires these external steps** (credentials not available to the coding agent).

Verify local gates anytime:

```bash
npm run verify:local-gates
```

## 1. Apply Supabase migrations

Apply **all** pending migrations through the latest file under `supabase/migrations/`
(currently includes entitlement locks through `20260914170000`, beta_metrics approved-story sync `20260914180000`; researcher PII revoke is `20260914100000`).

```bash
# Linked project
supabase db push

# Or via Dashboard → SQL → run each pending migration in timestamp order
```

Evidence: Supabase migration history shows tip migration applied with no errors.

## 2. Enable Auth Leaked Password Protection

Supabase Dashboard → **Authentication** → **Providers / Security** → enable
**Leaked password protection** (Have I Been Pwned check).

Evidence: setting shows enabled in the Auth security panel.

## 3. Deploy edge functions

```bash
supabase functions deploy
# Or deploy individually if your workflow prefers per-function deploys
```

Ensure function secrets include project URL/anon/service role as already configured
for this project.

## 4. Demo setup secret

```bash
# Prefer a long random secret in production if demo seeding is needed:
supabase secrets set DEMO_SETUP_SECRET="$(openssl rand -hex 32)"

# Or leave unset so setup-demo-account stays disabled (fail-closed).
```

## 5. Publish the app

Use Lovable **Publish** (or your production host) so the live URL serves the
branch/build that includes the honesty + security tip.

Evidence: production HTML/JS matches tip commit; `/health.json` loads with that commit.

```bash
# After publish — confirm the live build identity matches the tip SHA you intended
curl -sS https://YOUR_PRODUCTION_HOST/health.json
# Expect: "status":"ok", "stage":"closed-beta", "commit":"<tip sha>"
```

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

## Done means

- [x] Local gates green (`npm run verify:local-gates` + CI)
- [ ] Migrations applied through tip
- [ ] Leaked password protection on
- [ ] Edge functions deployed + demo secret policy set
- [ ] App published
- [ ] Live smoke passed
