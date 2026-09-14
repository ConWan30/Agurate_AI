-- Scrub historical peer effectiveness/cost invent written before INSERT strips.
-- New client INSERTs already null these columns (20260914440000); AVG must not
-- keep averaging pre-lock client scores. Service-role can re-seed verified scores later.

UPDATE public.peer_treatment_outcomes
SET
  effectiveness_score = NULL,
  cost_usd = NULL
WHERE
  effectiveness_score IS NOT NULL
  OR cost_usd IS NOT NULL;

-- Recreate peer RPC so avg_effectiveness stays null when no verified scores exist
-- (Postgres AVG already skips nulls; ROUND(NULL) yields NULL — UI shows "—").
CREATE OR REPLACE FUNCTION public.get_peer_comparison(
  p_field_id UUID,
  p_crop_type TEXT,
  p_problem TEXT
)
RETURNS TABLE(
  treatment_type TEXT,
  success_rate NUMERIC,
  avg_effectiveness INTEGER,
  sample_size BIGINT,
  farmer_count BIGINT
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
      (COUNT(*) FILTER (WHERE pto.outcome = 'successful')::NUMERIC
        / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
      1
    ) AS success_rate,
    ROUND(
      AVG(pto.effectiveness_score) FILTER (WHERE pto.effectiveness_score IS NOT NULL)
    )::INTEGER AS avg_effectiveness,
    COUNT(*) AS sample_size,
    COUNT(DISTINCT pto.farmer_id) AS farmer_count
  FROM public.peer_treatment_outcomes pto
  WHERE
    pto.crop_type = p_crop_type
    AND pto.problem_addressed ILIKE '%' || p_problem || '%'
    AND pto.farmer_id IS DISTINCT FROM auth.uid()
    AND pto.recommendation_id IS NOT NULL
  GROUP BY pto.treatment_type
  HAVING COUNT(DISTINCT pto.farmer_id) >= 3
  ORDER BY success_rate DESC
  LIMIT 5;
END;
$$;

REVOKE ALL ON FUNCTION public.get_peer_comparison(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_peer_comparison(UUID, TEXT, TEXT) TO authenticated;
