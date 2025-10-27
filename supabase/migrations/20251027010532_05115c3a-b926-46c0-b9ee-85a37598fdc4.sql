-- ============================================================================
-- AI INTELLIGENCE POOL TABLE (Unified AI Context Storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_intelligence_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
  
  -- Unified context snapshot
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Image analysis historical patterns
  image_analysis_patterns JSONB NOT NULL DEFAULT '{}',
  
  -- Variety-specific intelligence
  variety_intelligence JSONB NOT NULL DEFAULT '{}',
  
  -- Conservation effectiveness data
  conservation_effectiveness JSONB NOT NULL DEFAULT '{}',
  
  -- Weather correlation insights
  weather_correlations JSONB NOT NULL DEFAULT '{}',
  
  -- Community pattern matching
  community_patterns JSONB NOT NULL DEFAULT '{}',
  
  -- Predictive insights
  predictive_insights JSONB NOT NULL DEFAULT '{}',
  
  -- Cross-system confidence scores
  confidence_scores JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast context retrieval
CREATE INDEX IF NOT EXISTS idx_ai_intelligence_pool_field ON ai_intelligence_pool(field_id);
CREATE INDEX IF NOT EXISTS idx_ai_intelligence_pool_snapshot ON ai_intelligence_pool(snapshot_date DESC);

-- Enable RLS
ALTER TABLE ai_intelligence_pool ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI intelligence pool" ON ai_intelligence_pool
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fields 
      WHERE fields.id = ai_intelligence_pool.field_id 
      AND fields.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create AI intelligence pool entries" ON ai_intelligence_pool
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update AI intelligence pool entries" ON ai_intelligence_pool
  FOR UPDATE USING (true);