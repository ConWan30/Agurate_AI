-- Expert Escalation System
-- Connects farmers with LSU AgCenter researchers for complex cases

-- LSU Researchers table
CREATE TABLE IF NOT EXISTS lsu_researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL, -- e.g., "Soybean Pathologist", "Rice Specialist"
  email TEXT NOT NULL,
  phone TEXT,
  specialties TEXT[] NOT NULL, -- e.g., ['rice_diseases', 'soybean_pathology', 'soil_health']
  available BOOLEAN DEFAULT true,
  typical_response_time TEXT DEFAULT '4-8 hours', -- e.g., "4-8 hours", "24 hours"
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert consultation requests
CREATE TABLE IF NOT EXISTS expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  
  -- Expert assignment
  researcher_id UUID NOT NULL REFERENCES lsu_researchers(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Issue details
  issue_type TEXT NOT NULL, -- 'disease', 'pest', 'nutrient', 'general'
  issue_description TEXT NOT NULL,
  ai_analysis JSONB, -- Store AI's preliminary analysis
  confidence_score NUMERIC(5, 2), -- AI's confidence (low confidence = needs expert)
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'responded', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Response
  expert_response TEXT,
  expert_recommendations JSONB,
  responded_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expert_consultations_user ON expert_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_researcher ON expert_consultations(researcher_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_status ON expert_consultations(status);
CREATE INDEX IF NOT EXISTS idx_lsu_researchers_specialties ON lsu_researchers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_lsu_researchers_available ON lsu_researchers(available) WHERE available = true;

-- RLS Policies
ALTER TABLE lsu_researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_consultations ENABLE ROW LEVEL SECURITY;

-- Researchers are publicly viewable
CREATE POLICY "Anyone can view LSU researchers"
  ON lsu_researchers FOR SELECT
  USING (true);

-- Users can view their own consultations
CREATE POLICY "Users can view their own consultations"
  ON expert_consultations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create consultation requests
CREATE POLICY "Users can create consultations"
  ON expert_consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to find best matching researcher
CREATE OR REPLACE FUNCTION find_matching_researcher(
  p_issue_type TEXT,
  p_specialties TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  title TEXT,
  email TEXT,
  specialties TEXT[],
  typical_response_time TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.title,
    r.email,
    r.specialties,
    r.typical_response_time
  FROM lsu_researchers r
  WHERE r.available = true
    AND (
      -- Match by issue type or specialties
      p_issue_type = ANY(r.specialties) OR
      EXISTS (
        SELECT 1 FROM unnest(p_specialties) AS spec
        WHERE spec = ANY(r.specialties)
      )
    )
  ORDER BY 
    -- Prioritize exact matches
    CASE WHEN p_issue_type = ANY(r.specialties) THEN 1 ELSE 2 END,
    -- Then by number of matching specialties
    (SELECT COUNT(*) FROM unnest(p_specialties) AS spec WHERE spec = ANY(r.specialties)) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_matching_researcher(TEXT, TEXT[]) TO authenticated;

-- View for user's consultation history
CREATE OR REPLACE VIEW user_consultations AS
SELECT 
  ec.*,
  r.name as researcher_name,
  r.title as researcher_title,
  r.email as researcher_email,
  f.name as field_name,
  f.crop_type
FROM expert_consultations ec
JOIN lsu_researchers r ON ec.researcher_id = r.id
LEFT JOIN fields f ON ec.field_id = f.id
WHERE ec.user_id = auth.uid()
ORDER BY ec.created_at DESC;

-- Grant access
GRANT SELECT ON user_consultations TO authenticated;

