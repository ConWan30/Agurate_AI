# CI Notes: Jev Scan Preflight

## Test Requirements

### Stamp Mapping Tests
Located in: `supabase/functions/_shared/jevScanPreflight_test.ts`

Run with:
```bash
deno test supabase/functions/_shared/jevScanPreflight_test.ts
```

**Test Coverage:**
- ✅ look-here-first for good evidence in scope
- ✅ out-of-scope for low scope noul with high confidence
- ✅ out-of-scope for out_of_pilot_crop syndrome
- ✅ insufficient for low evidence quality
- ✅ insufficient when vision status is insufficient_evidence
- ✅ insufficient when syndrome choice is insufficient
- ✅ hold for conflicting abiotic/biotic probabilities
- ✅ caution for divergent story from prior scans
- ✅ caution as default for moderate evidence
- ✅ look-here-first wins over caution when evidence is strong
- ✅ scope check with low confidence does not trigger out-of-scope

### Integration Tests

**Manual Integration Test:**
1. Set TYPESAFE_API_KEY in Supabase Edge Secrets
2. Run analyze-crop with a soybean field scan
3. Verify jev-scan-preflight is called automatically
4. Check jev_scan_results table for persisted probability vectors
5. Verify stamp appears in analyze-crop response as `jev_scan.stamp`

**Fail-Open Test:**
1. Unset TYPESAFE_API_KEY
2. Run analyze-crop with a soybean scan
3. Verify scan succeeds with `jev_scan.stamp = "insufficient"`
4. Verify warning logged: "TYPESAFE_API_KEY not configured"

**Fail-Closed Scope Test:**
1. Set TYPESAFE_API_KEY
2. Run analyze-crop with rice/cotton/corn (not soybean)
3. Verify existing pilot-scope defer triggers before Jev is called
4. Jev should not be invoked for out-of-wedge crops

## Pre-existing CI Status

Check existing CI status before merging:
```bash
# If CI was already failing before this PR, note it here
```

This PR adds:
- New edge function: `jev-scan-preflight`
- New migration: `20260923200000_add_jev_scan_results.sql`
- Stamp mapping tests
- Integration hook in `analyze-crop`

No changes to existing test suites or UI components.

## TypeSafe API Key Setup

**Required for production:**
```bash
supabase secrets set TYPESAFE_API_KEY=<key>
```

**For local development:**
Add to `.env.local` (never commit):
```
TYPESAFE_API_KEY=<key>
```

See: `supabase/functions/jev-scan-preflight/README.md`
