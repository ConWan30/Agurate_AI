# Pilot scope: Morehouse Parish × Soybeans

**Status:** Active public evidence bound (in-repo)
**Tip policy:** One parish, one crop until field validation exists.

## Choice

| Dimension | Selection | Why |
|-----------|-----------|-----|
| Parish | **Morehouse Parish, Louisiana** | Founder-specified pilot geography; NE Delta row-crop country centered on Bastrop |
| Crop | **Soybean** | Dominant local acreage vs rice-only; frogeye / foliar scouting is a phone-photo use case; keeps Gemini vision prompts on one canopy type |

Rice, cotton, and corn remain in the codebase and schema for later seasons. Farmer UI for this pilot does **not** present them as equal first-class choices.

## In scope (farmer nav)

- Dashboard, Upload, Scanner, Fields, Field Map, Weather Timeline, History
- How It Works, Profile, Tutorials
- Retired chatbot routes stay deferred; active tools avoid chatbot enrollment framing

## Deferred (honest holding page)

- Predictions, Insurance export suite, Cooperatives, Conservation practices
- Analytics / beta metrics dashboards, LSU researcher directory as a primary nav item
- Upgrade / waitlist pressure surfaces

Code for deferred modules stays in the repo; nav and route entry show `PilotDeferred` so the product does not look like a validated precision-ag suite.

## Still blocked without platform credentials

These are **not** fixed by this pilot scope PR:

1. Apply Supabase migrations through tip on the live project
2. Deploy edge functions to tip
3. Auth leaked-password protection
4. Lovable / host **Publish** so `/health.json` matches git tip
5. Authenticated production scan smoke

## Local verification

```bash
npm run verify:local-gates
```

Pilot constants live in `src/lib/pilot-scope.ts`.
