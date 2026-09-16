# Resume production cutover

## Verified current state

- Code: local tip is commit `364dbba` ("Applied pending migrations"), working tree clean.
- Database: last applied update is `20260914060000`. The 40 updates from `20260914070000_fix_cooperative_auth_helpers` through `20260914460000_scrub_weather_events_gps_catalog` are still pending.
- A temporary privileged helper `public.__tmp_apply_migration` is still present in the database and must be removed before publishing.
- Not yet done: leaked-password protection check, function deploys, publish, live health check.

No product copy, features, routes, security rules, or fail-closed behavior change in this work.

## Steps

1. Apply the 40 pending database updates in timestamp order, starting with the cooperative auth-helper fix. Stop on the first error and report the exact failing statement rather than weakening the update.
2. Confirm applied state by listing the recorded update versions (expect tip `20260914460000`).
3. Remove the temporary privileged helper function.
4. Verify auth hardening: leaked-password protection enabled.
5. Deploy every backend function in `supabase/functions/` from this tip and record the deploy output.
6. Leave `DEMO_SETUP_SECRET` unset so demo seeding stays disabled (fail-closed). No secret is created.
7. Publish the app, then confirm `/`, `/beta-signup`, `/auth`, `/how-it-works` return 200 and `/health.json` returns `status: ok`, `stage: closed-beta`, and a commit matching the published tip.
8. If an authenticated check is possible, run one soybean photo scan and confirm it returns either a real score or a clear error — never an invented score.

## Technical notes

- Updates are applied through the project's migration tooling; the previously patched `20260914070000` keeps existing function parameter names (`coop_id`, `user_id`) and uses positional arguments internally so the six dependent access policies survive without being dropped.
- `20260914040000` already includes the view drop needed before recreation; it is applied.
- `public/health.json` in source keeps `"commit": "unknown"`; the real commit stamp is written at build time, so the live file is the only valid evidence.

## Blockers to expect and report honestly

- Publishing and the live `/health.json` check require the publish step to succeed; if it fails, the cutover is reported as incomplete rather than assumed done.
- Any security-scan findings surfaced during publish are reported, not silently bypassed.
