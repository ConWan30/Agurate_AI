# GitHub release handoff

AgurateAI remains the existing Morehouse Parish soybean application with public access. GitHub is the
source of truth; Lovable is optional as an editor. No live deployment is implied
by a successful build or a synchronized repository.

## Reconciled code state

Work starts from main `05e08ae746a5fa459501242d536c8f8ee54ca8e8`.
The release branch was subsequently reconciled with main `d499e58`, retaining
the public-access rollout, login fixes, and retirement of Delta Intelligence.
The launch-readiness branch's tree equals the squashed main commit `0152640`;
do not merge that old divergent branch over newer pilot and database fixes.
The alternate cutover branch contains useful work, but its Pages workflow deploys
from feature branches and suppresses deployment failures. It is not enabled here.
Its helper-removal migration is retained with a timestamp after the current main tip.

## Development and quality

Use Node 22, npm, Deno 2 and Playwright Chromium:

```sh
npm ci --legacy-peer-deps
npx playwright install --with-deps chromium
npm run verify:local-gates
```

`typecheck` now checks both app and build configurations; the previous root-only
command checked an empty files list. CI covers `main`, `cursor/**`, `codex/**`,
and PRs. New AI transport tests run without credentials or network requests.

## Frontend release

Create the GitHub `production` environment with these **variables**:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Existing project's public API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public publishable/anon key, never service-role key |
| `SUPABASE_PROJECT_REF` | Existing Supabase project reference |

Run **Prepare release without Lovable** on the reviewed commit. It calls CI first,
builds with production public settings, verifies `/health.json`, and uploads
`agurateai-web-<commit>` containing `dist/`. It does **not** publish the artifact.

Deploy that artifact to a static host at the domain root. Configure SPA fallback
to `/index.html` while retaining real files, especially `/health.json`. `_redirects`
and `_headers` are included for hosts supporting those files; other hosts need
equivalent rules. The build assumes `/`, so GitHub project subpaths are not supported
without additional base-path, router, PWA and smoke-test changes.

For a new domain, add its exact HTTPS origin to Supabase function secret
`APP_ALLOWED_ORIGINS` (comma-separated), configure Auth Site URL and allowed
redirect URLs, and preserve the response headers in `public/_headers`.

## Supabase release

The live database state has not been verified in this checkout. The September 16
cutover note reports pending migrations and a privileged temporary helper; treat
that note as a lead, then inspect actual migration history.

Add `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` as GitHub `production`
**secrets**. Never put secrets in public Vite variables, commits or chat.

Run **Deploy Supabase from GitHub** on main with `apply=false` to list pending
migrations. Review the list against live migration history. Then run with
`apply=true` to apply pending migrations and deploy all functions. The workflow
stops on errors and prints migration history. It includes all pending migrations
because older timestamped hardening updates may predate already-recorded updates.
The new `20260916160000_drop_tmp_apply_migration_helper.sql` removes the known
`public.__tmp_apply_migration(text)` signature without CASCADE.

Enable and verify Auth leaked-password protection in Supabase. Keep demo seeding
disabled by leaving `DEMO_SETUP_SECRET` unset; verify the actual secret state.
The workflows do not claim these settings have been verified or change AI secrets.

## Independent AI provider

All 15 AI function entrypoints use `_shared/ai.ts`. Existing Lovable credentials
continue working when no `AI_*` configuration is set. To move runtime AI off Lovable,
set these **Supabase function secrets** together:

| Secret | Requirement |
| --- | --- |
| `AI_API_URL` | Full HTTPS Chat Completions endpoint, no query/embedded credentials |
| `AI_API_KEY` | Credential for that provider |
| `AI_MODEL` | Model supporting current text, image_url and tool-call requests |
| `AI_VIDEO_MODEL` | Optional; only for providers supporting the existing video_url format |

A partial configuration fails closed and never reuses another provider's key.
No provider compatibility or model quality is certified by unit tests: verify
image analysis, tool calls and streamed chat against the selected service before
cutover. Video requests fail clearly when `AI_VIDEO_MODEL` is unset.
Provider changes preserve prompts, response handling, research framing and error
behavior. The unified vision request now includes the image it previously omitted.

## Production evidence still required

- Migration history through the current tip and confirmation the temporary helper is absent.
- Auth leaked-password protection enabled; demo seeding disabled.
- Successful function deployments with the intended AI configuration.
- Frontend published, then run:

```sh
PRODUCTION_URL=https://YOUR_HOST EXPECTED_COMMIT=FULL_PUBLISHED_SHA npm run verify:production-smoke
```

- An authenticated scan using a real soybean photo in the pilot area. Check storage,
  authorization and persistence. A clear error establishes fail-closed behavior,
  but does not prove working AI analysis; record those outcomes separately.

The old cutover scan script's tiny generated image and blanket acceptance of any
API error are not sufficient evidence of a functioning photo-analysis workflow.
