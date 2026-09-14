# AgurateAI

Closed-beta crop health monitoring for Louisiana Delta farms.

Guidance is framed around publicly available LSU AgCenter research. AgurateAI is **not** an official LSU partner and is **not** a scientifically validated diagnostic tool.

## Stack

- Vite + React + TypeScript + Tailwind + shadcn/ui
- Supabase (Auth, Postgres/RLS, Edge Functions)
- Playwright + Vitest

## Local setup

```bash
cp .env.example .env
# fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install --legacy-peer-deps
npm run dev   # serves on http://localhost:8080
```

## Quality gates

```bash
npm run typecheck
npm run test:ci
npm run verify:honesty:static
npm run build
npm run test:e2e:honesty   # requires Playwright browsers; optional locally
```

CI runs typecheck, unit tests, static honesty verify, and production build.

## Production shipping

1. Apply pending Supabase migrations (including view `security_invoker`)
2. Enable Supabase Auth **Leaked Password Protection**
3. Deploy edge functions with current honesty/citation prompts
4. Set `DEMO_SETUP_SECRET` before using `setup-demo-account` (disabled without it)
5. Publish via Lovable **Share → Publish** (or your host)
6. Smoke-test live `/`, `/beta-signup`, `/auth`, `/how-it-works`

See `docs/PRODUCTION-SHIPPING-CHECKLIST.md` for the full gate list.

## Security notes

- `.env` is gitignored; use `.env.example` as the template
- `setup-demo-account` requires `x-demo-setup-secret`
- Market prices are labeled as estimates, not USDA live quotes
- Edge functions that mutate data or call paid AI require authenticated users
- `/demo/*` and `/integration-test` routes are development-only

## Project links

- Lovable project: https://lovable.dev/projects/c684f21a-ff17-4d6d-a950-d5d66668838f
