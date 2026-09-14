-- Restrict LSU researcher PII exposure and align crop_type CHECKs with fields (soybean).

-- ---------------------------------------------------------------------------
-- lsu_researchers: drop open/anonymous SELECT; clients use directory view (no email)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view LSU researchers" ON public.lsu_researchers;
DROP POLICY IF EXISTS "Anyone can view researchers" ON public.lsu_researchers;
DROP POLICY IF EXISTS "Public can view researchers" ON public.lsu_researchers;
DROP POLICY IF EXISTS "Authenticated users can view researchers" ON public.lsu_researchers;

-- No direct authenticated/anon SELECT on the base table (email stays server-side).
REVOKE ALL ON TABLE public.lsu_researchers FROM PUBLIC;
REVOKE ALL ON TABLE public.lsu_researchers FROM anon;
REVOKE ALL ON TABLE public.lsu_researchers FROM authenticated;

-- Directory view without email. Build SELECT list from columns that exist so
-- Jan-only or Nov-only researcher tables both work.
DO $$
DECLARE
  cols text := 'id, name';
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'department'
  ) THEN
    cols := cols || ', department';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'title'
  ) THEN
    cols := cols || ', title AS department';
  ELSE
    cols := cols || ', NULL::text AS department';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'expertise'
  ) THEN
    cols := cols || ', expertise';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'specialties'
  ) THEN
    cols := cols || ', specialties AS expertise';
  ELSE
    cols := cols || ', NULL::text[] AS expertise';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'research_areas'
  ) THEN
    cols := cols || ', research_areas';
  ELSE
    cols := cols || ', NULL::text[] AS research_areas';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'availability'
  ) THEN
    cols := cols || ', availability';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'available'
  ) THEN
    cols := cols || ', CASE WHEN available THEN ''available'' ELSE ''unavailable'' END AS availability';
  ELSE
    cols := cols || ', NULL::text AS availability';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lsu_researchers' AND column_name = 'created_at'
  ) THEN
    cols := cols || ', created_at';
  ELSE
    cols := cols || ', NULL::timestamptz AS created_at';
  END IF;

  EXECUTE format(
    'CREATE OR REPLACE VIEW public.lsu_researchers_directory WITH (security_invoker = false) AS SELECT %s FROM public.lsu_researchers',
    cols
  );
END $$;

REVOKE ALL ON public.lsu_researchers_directory FROM PUBLIC;
REVOKE ALL ON public.lsu_researchers_directory FROM anon;
GRANT SELECT ON public.lsu_researchers_directory TO authenticated;

-- find_matching_researcher: drop email from return shape (PII)
DROP FUNCTION IF EXISTS public.find_matching_researcher(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.find_matching_researcher(TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION public.find_matching_researcher(
  p_crop_type TEXT,
  p_issue_type TEXT
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  expertise TEXT[],
  department VARCHAR,
  availability VARCHAR
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.name,
    COALESCE(r.expertise, ARRAY[]::text[]) AS expertise,
    r.department,
    r.availability
  FROM public.lsu_researchers r
  WHERE
    (r.expertise IS NOT NULL AND p_crop_type = ANY(r.expertise))
    OR (r.research_areas IS NOT NULL AND p_issue_type = ANY(r.research_areas))
  ORDER BY r.availability DESC NULLS LAST
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.find_matching_researcher(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_matching_researcher(TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- peer_treatment_outcomes + cooperative_alerts: soybean (singular)
-- ---------------------------------------------------------------------------

ALTER TABLE public.peer_treatment_outcomes
  DROP CONSTRAINT IF EXISTS peer_treatment_outcomes_crop_type_check;

UPDATE public.peer_treatment_outcomes
SET crop_type = 'soybean'
WHERE crop_type = 'soybeans';

ALTER TABLE public.peer_treatment_outcomes
  ADD CONSTRAINT peer_treatment_outcomes_crop_type_check
  CHECK (crop_type IS NULL OR crop_type IN ('rice', 'soybean', 'cotton', 'corn'));

ALTER TABLE public.cooperative_alerts
  DROP CONSTRAINT IF EXISTS cooperative_alerts_crop_type_check;

UPDATE public.cooperative_alerts
SET crop_type = 'soybean'
WHERE crop_type = 'soybeans';

ALTER TABLE public.cooperative_alerts
  ADD CONSTRAINT cooperative_alerts_crop_type_check
  CHECK (crop_type IS NULL OR crop_type IN ('rice', 'soybean', 'cotton', 'corn'));
