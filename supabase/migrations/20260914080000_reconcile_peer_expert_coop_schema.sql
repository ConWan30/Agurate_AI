-- Reconcile Jan→Nov schema drift for peer outcomes, expert consultations,
-- LSU researchers, and cooperative alerts so client/types RPC shapes work
-- on databases that applied early CREATE TABLE IF NOT EXISTS migrations first.

-- ---------------------------------------------------------------------------
-- peer_treatment_outcomes → Nov shape (farmer_id + outcome model)
-- ---------------------------------------------------------------------------

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES auth.users(id);

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE SET NULL;

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS problem_addressed TEXT;

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS outcome TEXT;

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS effectiveness_score INTEGER;

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC;

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS applied_at DATE;

ALTER TABLE public.peer_treatment_outcomes
  ADD COLUMN IF NOT EXISTS evaluated_at DATE;

-- Backfill from Jan columns when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'peer_treatment_outcomes' AND column_name = 'user_id'
  ) THEN
    UPDATE public.peer_treatment_outcomes
    SET farmer_id = COALESCE(farmer_id, user_id)
    WHERE farmer_id IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'peer_treatment_outcomes' AND column_name = 'application_date'
  ) THEN
    UPDATE public.peer_treatment_outcomes
    SET applied_at = COALESCE(applied_at, application_date)
    WHERE applied_at IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'peer_treatment_outcomes' AND column_name = 'success'
  ) THEN
    UPDATE public.peer_treatment_outcomes
    SET outcome = COALESCE(
      outcome,
      CASE
        WHEN success IS TRUE THEN 'successful'
        WHEN success IS FALSE THEN 'unsuccessful'
        ELSE NULL
      END
    )
    WHERE outcome IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'peer_treatment_outcomes' AND column_name = 'improvement_percentage'
  ) THEN
    UPDATE public.peer_treatment_outcomes
    SET effectiveness_score = COALESCE(
      effectiveness_score,
      LEAST(100, GREATEST(0, ROUND(improvement_percentage)::INTEGER))
    )
    WHERE effectiveness_score IS NULL AND improvement_percentage IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'peer_treatment_outcomes' AND column_name = 'cost_per_acre'
  ) THEN
    UPDATE public.peer_treatment_outcomes
    SET cost_usd = COALESCE(cost_usd, cost_per_acre)
    WHERE cost_usd IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'peer_treatment_outcomes' AND column_name = 'treatment_name'
  ) THEN
    UPDATE public.peer_treatment_outcomes
    SET problem_addressed = COALESCE(problem_addressed, treatment_name, treatment_type)
    WHERE problem_addressed IS NULL;
  END IF;

  UPDATE public.peer_treatment_outcomes
  SET
    evaluated_at = COALESCE(evaluated_at, applied_at, CURRENT_DATE),
    problem_addressed = COALESCE(problem_addressed, treatment_type, 'unspecified'),
    outcome = COALESCE(outcome, 'partially_successful')
  WHERE evaluated_at IS NULL
     OR problem_addressed IS NULL
     OR outcome IS NULL;
END $$;

-- Widen / align outcome CHECK when present
ALTER TABLE public.peer_treatment_outcomes DROP CONSTRAINT IF EXISTS peer_treatment_outcomes_outcome_check;
ALTER TABLE public.peer_treatment_outcomes
  ADD CONSTRAINT peer_treatment_outcomes_outcome_check
  CHECK (outcome IS NULL OR outcome IN ('successful', 'partially_successful', 'unsuccessful'));

-- RLS: prefer farmer_id, fall back to user_id for transitional rows
DROP POLICY IF EXISTS "Users can view their own treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Users can insert their own treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Users can update their own treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Users can view own peer treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Users can insert own peer treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Farmers can view their treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Farmers can insert their treatment outcomes" ON public.peer_treatment_outcomes;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'peer_treatment_outcomes' AND column_name = 'user_id'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Farmers can view their treatment outcomes"
      ON public.peer_treatment_outcomes FOR SELECT TO authenticated
      USING (farmer_id = auth.uid() OR user_id = auth.uid())
    $p$;
    EXECUTE $p$
      CREATE POLICY "Farmers can insert their treatment outcomes"
      ON public.peer_treatment_outcomes FOR INSERT TO authenticated
      WITH CHECK (farmer_id = auth.uid() OR user_id = auth.uid())
    $p$;
  ELSE
    EXECUTE $p$
      CREATE POLICY "Farmers can view their treatment outcomes"
      ON public.peer_treatment_outcomes FOR SELECT TO authenticated
      USING (farmer_id = auth.uid())
    $p$;
    EXECUTE $p$
      CREATE POLICY "Farmers can insert their treatment outcomes"
      ON public.peer_treatment_outcomes FOR INSERT TO authenticated
      WITH CHECK (farmer_id = auth.uid())
    $p$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- expert_consultations → Nov shape
-- ---------------------------------------------------------------------------

ALTER TABLE public.expert_consultations
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES auth.users(id);

ALTER TABLE public.expert_consultations
  ADD COLUMN IF NOT EXISTS question TEXT;

ALTER TABLE public.expert_consultations
  ADD COLUMN IF NOT EXISTS response TEXT;

ALTER TABLE public.expert_consultations
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_consultations' AND column_name = 'user_id'
  ) THEN
    UPDATE public.expert_consultations
    SET farmer_id = COALESCE(farmer_id, user_id)
    WHERE farmer_id IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_consultations' AND column_name = 'issue_description'
  ) THEN
    UPDATE public.expert_consultations
    SET question = COALESCE(question, issue_description)
    WHERE question IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_consultations' AND column_name = 'expert_response'
  ) THEN
    UPDATE public.expert_consultations
    SET response = COALESCE(response, expert_response)
    WHERE response IS NULL;
  END IF;
END $$;

UPDATE public.expert_consultations
SET question = COALESCE(question, 'Consultation request')
WHERE question IS NULL;

-- Priority CHECK: allow Nov + client values
ALTER TABLE public.expert_consultations DROP CONSTRAINT IF EXISTS expert_consultations_priority_check;
ALTER TABLE public.expert_consultations
  ADD CONSTRAINT expert_consultations_priority_check
  CHECK (priority IS NULL OR priority IN ('low', 'normal', 'medium', 'high', 'urgent'));

ALTER TABLE public.expert_consultations DROP CONSTRAINT IF EXISTS expert_consultations_status_check;
ALTER TABLE public.expert_consultations
  ADD CONSTRAINT expert_consultations_status_check
  CHECK (status IS NULL OR status IN (
    'pending', 'reviewing', 'responded', 'resolved', 'closed',
    'in_progress', 'completed', 'cancelled'
  ));

DROP POLICY IF EXISTS "Users can view their own consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Users can create consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Farmers can view their consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Farmers can create consultations" ON public.expert_consultations;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_consultations' AND column_name = 'user_id'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Farmers can view their consultations"
      ON public.expert_consultations FOR SELECT TO authenticated
      USING (farmer_id = auth.uid() OR user_id = auth.uid())
    $p$;
    EXECUTE $p$
      CREATE POLICY "Farmers can create consultations"
      ON public.expert_consultations FOR INSERT TO authenticated
      WITH CHECK (farmer_id = auth.uid() OR user_id = auth.uid())
    $p$;
  ELSE
    EXECUTE $p$
      CREATE POLICY "Farmers can view their consultations"
      ON public.expert_consultations FOR SELECT TO authenticated
      USING (farmer_id = auth.uid())
    $p$;
    EXECUTE $p$
      CREATE POLICY "Farmers can create consultations"
      ON public.expert_consultations FOR INSERT TO authenticated
      WITH CHECK (farmer_id = auth.uid())
    $p$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- lsu_researchers: ensure Nov columns used by find_matching_researcher
-- ---------------------------------------------------------------------------

ALTER TABLE public.lsu_researchers
  ADD COLUMN IF NOT EXISTS expertise TEXT[];

ALTER TABLE public.lsu_researchers
  ADD COLUMN IF NOT EXISTS department VARCHAR;

ALTER TABLE public.lsu_researchers
  ADD COLUMN IF NOT EXISTS availability VARCHAR;

ALTER TABLE public.lsu_researchers
  ADD COLUMN IF NOT EXISTS research_areas TEXT[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'specialties'
  ) THEN
    UPDATE public.lsu_researchers
    SET expertise = COALESCE(expertise, specialties)
    WHERE expertise IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'title'
  ) THEN
    UPDATE public.lsu_researchers
    SET department = COALESCE(department, title)
    WHERE department IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'available'
  ) THEN
    UPDATE public.lsu_researchers
    SET availability = COALESCE(
      availability,
      CASE WHEN available THEN 'available' ELSE 'unavailable' END
    )
    WHERE availability IS NULL;
  END IF;
END $$;

UPDATE public.lsu_researchers
SET
  expertise = COALESCE(expertise, '{}'::TEXT[]),
  research_areas = COALESCE(research_areas, expertise, '{}'::TEXT[]),
  availability = COALESCE(availability, 'available'),
  department = COALESCE(department, 'LSU AgCenter')
WHERE expertise IS NULL
   OR research_areas IS NULL
   OR availability IS NULL
   OR department IS NULL;

-- ---------------------------------------------------------------------------
-- cooperative_alerts → Nov status / acres columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.cooperative_alerts
  ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.cooperative_alerts
  ADD COLUMN IF NOT EXISTS affected_area_acres NUMERIC;

ALTER TABLE public.cooperative_alerts
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE public.cooperative_alerts
  ADD COLUMN IF NOT EXISTS recommended_action TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cooperative_alerts' AND column_name = 'affected_area'
  ) THEN
    -- Keep text area; acres stays null unless numeric parse is possible later
    NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cooperative_alerts' AND column_name = 'recommended_action'
  ) THEN
    NULL;
  END IF;
END $$;

UPDATE public.cooperative_alerts
SET status = COALESCE(
  status,
  CASE WHEN resolved_at IS NOT NULL THEN 'resolved' ELSE 'active' END
)
WHERE status IS NULL;

ALTER TABLE public.cooperative_alerts DROP CONSTRAINT IF EXISTS cooperative_alerts_status_check;
ALTER TABLE public.cooperative_alerts
  ADD CONSTRAINT cooperative_alerts_status_check
  CHECK (status IS NULL OR status IN ('active', 'resolved', 'archived'));

-- Recreate active view for Nov status model (best-effort)
CREATE OR REPLACE VIEW public.active_cooperative_alerts
WITH (security_invoker = true)
AS
SELECT
  ca.*,
  c.name AS cooperative_name,
  p.full_name AS created_by_name
FROM public.cooperative_alerts ca
JOIN public.cooperatives c ON c.id = ca.cooperative_id
LEFT JOIN public.profiles p ON p.id = ca.created_by
WHERE COALESCE(ca.status, 'active') = 'active'
  AND ca.resolved_at IS NULL;
