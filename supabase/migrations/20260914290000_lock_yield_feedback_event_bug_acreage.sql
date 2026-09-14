-- Yield/canopy percent CHECKs, feedback assessment-scoped RLS,
-- insurance event_type allowlist, bug_report status freeze, fields.acreage CHECK.

-- ---------------------------------------------------------------------------
-- assessments: estimated_yield_impact_percent + canopy_coverage_percent 0–100
-- ---------------------------------------------------------------------------

UPDATE public.assessments
SET estimated_yield_impact_percent = NULL
WHERE estimated_yield_impact_percent IS NOT NULL
  AND (
    estimated_yield_impact_percent < 0
    OR estimated_yield_impact_percent > 100
  );

UPDATE public.assessments
SET canopy_coverage_percent = NULL
WHERE canopy_coverage_percent IS NOT NULL
  AND (
    canopy_coverage_percent < 0
    OR canopy_coverage_percent > 100
  );

ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_estimated_yield_impact_percent_check;

ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_estimated_yield_impact_percent_check
  CHECK (
    estimated_yield_impact_percent IS NULL
    OR (
      estimated_yield_impact_percent >= 0
      AND estimated_yield_impact_percent <= 100
    )
  );

ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_canopy_coverage_percent_check;

ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_canopy_coverage_percent_check
  CHECK (
    canopy_coverage_percent IS NULL
    OR (
      canopy_coverage_percent >= 0
      AND canopy_coverage_percent <= 100
    )
  );

-- ---------------------------------------------------------------------------
-- feedback: allow assessment-scoped ownership (History insert path)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;

CREATE POLICY "Users can view own feedback"
  ON public.feedback
  FOR SELECT
  USING (
    (
      recommendation_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.recommendations r
        JOIN public.assessments a ON a.id = r.assessment_id
        JOIN public.fields f ON f.id = a.field_id
        WHERE r.id = feedback.recommendation_id
          AND f.user_id = auth.uid()
      )
    )
    OR (
      assessment_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.assessments a
        JOIN public.fields f ON f.id = a.field_id
        WHERE a.id = feedback.assessment_id
          AND f.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (
    (
      recommendation_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.recommendations r
        JOIN public.assessments a ON a.id = r.assessment_id
        JOIN public.fields f ON f.id = a.field_id
        WHERE r.id = feedback.recommendation_id
          AND f.user_id = auth.uid()
      )
    )
    OR (
      assessment_id IS NOT NULL
      AND recommendation_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.assessments a
        JOIN public.fields f ON f.id = a.field_id
        WHERE a.id = feedback.assessment_id
          AND f.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- insurance_claims.event_type allowlist
-- ---------------------------------------------------------------------------

UPDATE public.insurance_claims
SET event_type = 'pest'
WHERE event_type IS NOT NULL
  AND lower(event_type) NOT IN (
    'flood', 'drought', 'hail', 'wind', 'pest', 'disease'
  );

ALTER TABLE public.insurance_claims
  DROP CONSTRAINT IF EXISTS insurance_claims_event_type_check;

ALTER TABLE public.insurance_claims
  ADD CONSTRAINT insurance_claims_event_type_check
  CHECK (
    event_type IS NULL
    OR lower(event_type) IN (
      'flood', 'drought', 'hail', 'wind', 'pest', 'disease'
    )
  );

-- ---------------------------------------------------------------------------
-- bug_reports: clients cannot invent resolved/closed on INSERT; no client UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_bug_report_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'open';
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'bug_reports may only be updated by trusted backends'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS protect_bug_report_status_trg ON public.bug_reports;
CREATE TRIGGER protect_bug_report_status_trg
  BEFORE INSERT OR UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_bug_report_status();

-- ---------------------------------------------------------------------------
-- fields.acreage: non-negative
-- ---------------------------------------------------------------------------

UPDATE public.fields
SET acreage = NULL
WHERE acreage IS NOT NULL AND acreage < 0;

ALTER TABLE public.fields
  DROP CONSTRAINT IF EXISTS fields_acreage_check;

ALTER TABLE public.fields
  ADD CONSTRAINT fields_acreage_check
  CHECK (acreage IS NULL OR acreage >= 0);
