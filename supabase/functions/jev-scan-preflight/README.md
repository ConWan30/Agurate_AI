# Jev Scan Preflight — TypeSafe System One Middle Layer

## Overview

`jev-scan-preflight` is a Supabase Edge Function that runs **after** `analyze-crop` succeeds. It sends structured text/JSON state (never images) to TypeSafe Jev System One for judgment, persists full probability vectors, and maps results to code-owned honesty stamps.

## Architecture

```
photo → Gemini analyze-crop → VisionObservation findings (text)
    ↓
bind claims + evidence pack
    ↓
Jev fan-out (Choice / Score / Noul in one System One call)
    ↓
code composes stamps: look-here-first | caution | hold | insufficient | out-of-scope
    ↓
persist full probability vectors to jev_scan_results
```

- **Gemini** remains the vision model (Jev never sees pixels)
- **TypeSafe Jev** judges structured claims only
- **Code owns stamps** (Jev returns typed probabilities; code maps to product decisions)

## Setup: TYPESAFE_API_KEY

The function requires a **Supabase Edge Secret** named `TYPESAFE_API_KEY`.

### How to set the secret:

1. **Supabase Dashboard:**
   - Navigate to your project → Settings → Edge Functions
   - Add a new secret: `TYPESAFE_API_KEY` = `<your-typesafe-api-key>`

2. **Supabase CLI (local development):**
   ```bash
   supabase secrets set TYPESAFE_API_KEY=<your-typesafe-api-key>
   ```

3. **Verify:**
   ```bash
   supabase secrets list
   ```

### Fail-open behavior

If `TYPESAFE_API_KEY` is missing or the TypeSafe API call fails:
- The function returns an `insufficient` stamp with zero-confidence answers
- The scan path continues (does not crash)
- A warning is logged for operator review

**Never commit secrets or .env values to git.**

## TypeSafe System One Questions

The function sends one System One request with these questions:

1. **scope_noul** (Noul): Is this scan in the Morehouse Parish soybean evidence scope?
2. **evidence_quality_score** (Score): Rate evidence quality (0 = none, 1 = weak leaf, 2 = canopy with context)
3. **syndrome_family_choice** (Choice): Closed set syndrome family (abiotic | biotic | insufficient | out_of_pilot_crop)
4. **same_story_noul** (Noul, optional): Does this scan match prior scan tags?

## Stamp Mapping (Code-Owned)

The function maps TypeSafe answers to product stamps using deterministic logic:

| Stamp | Trigger |
|-------|---------|
| `out-of-scope` | scope_noul < 0.5 with confidence ≥ 0.6, OR syndrome = out_of_pilot_crop |
| `insufficient` | syndrome = insufficient, OR evidence_quality < 0.5 with confidence ≥ 0.6, OR vision status = insufficient_evidence |
| `hold` | Conflicting syndrome probabilities (abiotic ≥ 0.35 AND biotic ≥ 0.35) |
| `caution` | Divergent story from prior scans (same_story_noul < 0.4 with confidence ≥ 0.6), OR default moderate evidence |
| `look-here-first` | Good evidence (score ≥ 1.5) AND in scope (≥ 0.7) |

## Persistence

Full probability vectors are stored in `jev_scan_results`:

```sql
CREATE TABLE jev_scan_results (
    id UUID PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id),
    stamp TEXT CHECK (stamp IN ('look-here-first', 'caution', 'hold', 'insufficient', 'out-of-scope')),
    answers JSONB,  -- Full TypeSafe System One response
    reasoning TEXT,
    created_at TIMESTAMP
);
```

## Testing

Run stamp mapping tests:

```bash
cd supabase/functions/_shared
deno test jevScanPreflight_test.ts
```

## Integration

Called automatically by `analyze-crop` after assessment persistence. Non-fatal: if Jev fails, the scan continues with `jev_scan: null`.

## Product Guardrails

- **No diagnosis language**: Stamps are decision-aid framing only
- **No farmer chatbot**: Jev is not exposed to end users
- **No Lovable credit spend**: This is a backend-only integration
- **Fail-open for UX**: Missing secret or errors return `insufficient` stamp, do not crash scans
- **Fail-closed for scope**: Out-of-scope and overclaim risks trigger honest defer/hold stamps

## References

- Architecture doc: `/workspace/uploads/jev-scan-preflight-devin-prompt_d4f4.md`
- TypeSafe docs: https://docs.typesafe.ai/system-one
- Existing image gate: `supabase/functions/_shared/typesafeImageGate.ts`
