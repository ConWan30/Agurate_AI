-- Peer Comparison Intelligence
-- Enables anonymous community benchmarking and treatment success tracking

-- Table to store anonymized treatment outcomes for peer comparison
CREATE TABLE IF NOT EXISTS peer_treatment_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
  
  -- Treatment details
  treatment_type TEXT NOT NULL, -- 'fungicide', 'fertilizer', 'herbicide', 'irrigation', etc.
  treatment_name TEXT, -- e.g., 'azoxystrobin', 'urea nitrogen'
  application_date DATE NOT NULL,
  
  -- Before/after metrics
  health_score_before NUMERIC(5, 2) NOT NULL,
  health_score_after NUMERIC(5, 2),
  health_score_after_days INTEGER, -- Days after treatment when after score was measured
  
  -- Outcome
  success BOOLEAN, -- true if health improved significantly
  improvement_percentage NUMERIC(5, 2), -- Percentage improvement
  cost_per_acre NUMERIC(10, 2),
  
  -- Context
  crop_type TEXT NOT NULL,
  stress_level_before TEXT,
  symptoms_before TEXT[],
  symptoms_after TEXT[],
  
  -- Anonymization
  anonymized BOOLEAN DEFAULT true, -- Data is anonymized for community comparison
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient peer comparison queries
CREATE INDEX IF NOT EXISTS idx_peer_treatment_type_crop ON peer_treatment_outcomes(treatment_type, crop_type);
CREATE INDEX IF NOT EXISTS idx_peer_treatment_success ON peer_treatment_outcomes(success, treatment_type);
CREATE INDEX IF NOT EXISTS idx_peer_treatment_date ON peer_treatment_outcomes(application_date DESC);
CREATE INDEX IF NOT EXISTS idx_peer_treatment_anonymized ON peer_treatment_outcomes(anonymized) WHERE anonymized = true;

-- RLS Policies
ALTER TABLE peer_treatment_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own treatment outcomes"
  ON peer_treatment_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own treatment outcomes"
  ON peer_treatment_outcomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own treatment outcomes"
  ON peer_treatment_outcomes FOR UPDATE
  USING (auth.uid() = user_id);

-- View for anonymized peer comparison data (excludes user_id and field_id)
CREATE OR REPLACE VIEW peer_comparison_data AS
SELECT 
  treatment_type,
  treatment_name,
  crop_type,
  stress_level_before,
  COUNT(*) as farmer_count,
  AVG(health_score_before) as avg_health_before,
  AVG(health_score_after) as avg_health_after,
  AVG(improvement_percentage) as avg_improvement,
  AVG(health_score_after_days) as avg_days_to_improvement,
  AVG(cost_per_acre) as avg_cost_per_acre,
  COUNT(*) FILTER (WHERE success = true) as success_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success = true) / COUNT(*), 1) as success_rate,
  MIN(application_date) as earliest_application,
  MAX(application_date) as latest_application
FROM peer_treatment_outcomes
WHERE anonymized = true
  AND health_score_after IS NOT NULL
GROUP BY treatment_type, treatment_name, crop_type, stress_level_before;

-- Grant access to view
GRANT SELECT ON peer_comparison_data TO authenticated;

-- Function to get peer comparison for a specific treatment scenario
CREATE OR REPLACE FUNCTION get_peer_comparison(
  p_treatment_type TEXT,
  p_crop_type TEXT,
  p_stress_level TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  treatment_name TEXT,
  farmer_count BIGINT,
  avg_health_before NUMERIC,
  avg_health_after NUMERIC,
  avg_improvement NUMERIC,
  avg_days_to_improvement NUMERIC,
  avg_cost_per_acre NUMERIC,
  success_rate NUMERIC,
  success_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pcd.treatment_name,
    pcd.farmer_count,
    pcd.avg_health_before,
    pcd.avg_health_after,
    pcd.avg_improvement,
    pcd.avg_days_to_improvement,
    pcd.avg_cost_per_acre,
    pcd.success_rate,
    pcd.success_count
  FROM peer_comparison_data pcd
  WHERE pcd.treatment_type = p_treatment_type
    AND pcd.crop_type = p_crop_type
    AND (p_stress_level IS NULL OR pcd.stress_level_before = p_stress_level)
  ORDER BY pcd.success_rate DESC, pcd.avg_improvement DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_peer_comparison(TEXT, TEXT, TEXT, INTEGER) TO authenticated;

