# Finish the AgurateAI branding rollout

## Scope
- Treat the newly installed agricultural emblem as the canonical AgurateAI artwork.
- Preserve ordinary agricultural photography, the AgurateAI name, public access, and the Morehouse Parish soybean evidence boundary.
- Do not restore Delta Intelligence, beta enrollment, deferred features, or imply parish/government endorsement.

## Changes
1. **Canonical brand assets**
   - Regenerate `icon-192.png`, `icon-512.png`, and the favicon from the canonical artwork with correct square sizing.
   - Add/update the Apple touch icon and connect it in the browser metadata.
   - Keep the PWA manifest icon references aligned with those generated files.

2. **Browser, PWA, and social identity**
   - Update stale closed-beta PWA wording to current public-access, evidence-bounded language.
   - Replace stale OpenGraph/Twitter artwork references with the canonical brand asset where appropriate.
   - Review `screenshot-mobile.png`; replace it only if it contains obsolete branding.
   - Keep `hero-fields.jpg` because it is ordinary agricultural photography, not a stale logo.

3. **README accuracy**
   - Ensure the primary README logo and footer use the canonical artwork.
   - Add the approved identity line, “Local Land. Smarter Decisions.” with Morehouse Parish, Louisiana framing and no endorsement implication.
   - Rewrite the feature table to list only currently reachable product capabilities; identify retired/deferred areas honestly and remove Delta Intelligence/beta enrollment implications.
   - Update stale release/status wording where the repository now reflects a published public product.

4. **Public discovery files**
   - Remove retired beta enrollment URLs from the sitemap and robots declarations while preserving their redirect behavior in the app.
   - Check all remaining logo/icon/image references for obsolete assets.

## Verification
- Run typecheck, production build, static honesty scan, public-route alignment, and the repository’s normal local production gates.
- Inspect generated icon dimensions and compare branding references after changes.
- Return the exact changed-file list and pass/fail receipts, including any unrelated pre-existing failure.
