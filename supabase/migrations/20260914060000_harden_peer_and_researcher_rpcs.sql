-- Harden remaining SECURITY DEFINER RPCs that lacked auth / ownership checks.
-- Also drop legacy Jan overloads that remain callable without ownership checks.

DROP FUNCTION IF EXISTS public.get_peer_comparison(TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.find_matching_researcher(TEXT, TEXT[]);

-- ---------------------------------------------------------------------------
-- get_peer_comparison: require auth + field ownership; keep aggregate results
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_peer_comparison(
  p_field_id UUID,
  p_crop_type TEXT,
  p_problem TEXT
)
RETURNS TABLE(
  treatment_type TEXT,
  success_rate NUMERIC,
  avg_effectiveness INTEGER,
  sample_size BIGINT
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE f.id = p_field_id
      AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    pto.treatment_type,
    ROUND(
      (COUNT(*) FILTER (WHERE pto.outcome = 'successful')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
      1
    ) AS success_rate,
    ROUND(AVG(pto.effectiveness_score))::INTEGER AS avg_effectiveness,
    COUNT(*) AS sample_size
  FROM public.peer_treatment_outcomes pto
  WHERE
    pto.crop_type = p_crop_type
    AND pto.problem_addressed ILIKE '%' || p_problem || '%'
  GROUP BY pto.treatment_type
  HAVING COUNT(*) >= 3
  ORDER BY success_rate DESC
  LIMIT 5;
END;
$$;

REVOKE ALL ON FUNCTION public.get_peer_comparison(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_peer_comparison(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- find_matching_researcher: require authentication (directory is not anonymous)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.find_matching_researcher(
  p_crop_type TEXT,
  p_issue_type TEXT
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  email VARCHAR,
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
    r.email,
    r.expertise,
    r.department,
    r.availability
  FROM public.lsu_researchers r
  WHERE
    p_crop_type = ANY(r.expertise)
    OR p_issue_type = ANY(r.research_areas)
  ORDER BY r.availability DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.find_matching_researcher(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_matching_researcher(TEXT, TEXT) TO authenticated;

-- Drop legacy unsecured 2-arg cooperative resolve if present
DROP FUNCTION IF EXISTS public.resolve_cooperative_alert(UUID, UUID);
