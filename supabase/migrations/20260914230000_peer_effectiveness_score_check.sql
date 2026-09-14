-- Ensure peer_treatment_outcomes.effectiveness_score cannot forge outside 0–100.
-- The Nov CREATE had a CHECK, but 20260914080000 re-added the column without one.

ALTER TABLE public.peer_treatment_outcomes
  DROP CONSTRAINT IF EXISTS peer_treatment_outcomes_effectiveness_score_check;

-- Clamp any out-of-range legacy rows before adding the constraint
UPDATE public.peer_treatment_outcomes
SET effectiveness_score = NULL
WHERE effectiveness_score IS NOT NULL
  AND (effectiveness_score < 0 OR effectiveness_score > 100);

ALTER TABLE public.peer_treatment_outcomes
  ADD CONSTRAINT peer_treatment_outcomes_effectiveness_score_check
  CHECK (
    effectiveness_score IS NULL
    OR (effectiveness_score >= 0 AND effectiveness_score <= 100)
  );
