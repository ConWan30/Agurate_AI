-- ============================================================================
-- PHASE 4 DATABASE SCHEMA: Cursor Implementation Features
-- Creates missing tables, views, and RPC functions
-- ============================================================================

-- 1. Critical Alerts Table
CREATE TABLE IF NOT EXISTS public.critical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('disease', 'pest', 'weather', 'stress', 'yield_loss')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium')) DEFAULT 'high',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  estimated_loss_usd NUMERIC,
  urgency_score INTEGER NOT NULL CHECK (urgency_score >= 0 AND urgency_score <= 100),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  sms_sent BOOLEAN DEFAULT false,
  voice_call_attempted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Cooperative Alerts Table
CREATE TABLE IF NOT EXISTS public.cooperative_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID NOT NULL REFERENCES public.cooperatives(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('disease_outbreak', 'pest_outbreak', 'weather_warning', 'best_practice', 'price_alert')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  crop_type TEXT CHECK (crop_type IN ('rice', 'soybeans', 'cotton', 'corn')),
  affected_area_acres NUMERIC,
  recommended_action TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'archived')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 3. Alert Acknowledgments Table
CREATE TABLE IF NOT EXISTS public.alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'cooperative')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(alert_id, alert_type, user_id)
);

-- 4. Expert Consultations Table
CREATE TABLE IF NOT EXISTS public.expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id),
  researcher_id UUID NOT NULL REFERENCES public.lsu_researchers(id),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response TEXT
);

-- 5. Peer Treatment Outcomes Table
CREATE TABLE IF NOT EXISTS public.peer_treatment_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id),
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE SET NULL,
  treatment_type TEXT NOT NULL,
  crop_type TEXT NOT NULL CHECK (crop_type IN ('rice', 'soybeans', 'cotton', 'corn')),
  problem_addressed TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('successful', 'partially_successful', 'unsuccessful')),
  effectiveness_score INTEGER CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  cost_usd NUMERIC,
  notes TEXT,
  applied_at DATE NOT NULL,
  evaluated_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Conversation Memory Table
CREATE TABLE IF NOT EXISTS public.conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID NOT NULL REFERENCES public.delta_conversations(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('field', 'assessment', 'recommendation', 'weather', 'topic')),
  context_data JSONB NOT NULL DEFAULT '{}',
  relevance_score NUMERIC DEFAULT 1.0,
  last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Unacknowledged Critical Alerts
CREATE OR REPLACE VIEW public.unacknowledged_critical_alerts AS
SELECT 
  ca.*,
  f.name as field_name,
  f.crop_type
FROM public.critical_alerts ca
LEFT JOIN public.fields f ON f.id = ca.field_id
WHERE ca.acknowledged = false
ORDER BY ca.urgency_score DESC, ca.created_at DESC;

-- View: Active Cooperative Alerts
CREATE OR REPLACE VIEW public.active_cooperative_alerts AS
SELECT 
  ca.*,
  c.name as cooperative_name,
  p.full_name as created_by_name,
  f.name as field_name
FROM public.cooperative_alerts ca
LEFT JOIN public.cooperatives c ON c.id = ca.cooperative_id
LEFT JOIN public.profiles p ON p.id = ca.created_by
LEFT JOIN public.fields f ON f.id = ca.field_id
WHERE ca.status = 'active'
ORDER BY ca.created_at DESC;

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function: Acknowledge Critical Alert
CREATE OR REPLACE FUNCTION public.acknowledge_critical_alert(alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.critical_alerts
  SET acknowledged = true,
      acknowledged_at = now()
  WHERE id = alert_id;
END;
$$;

-- Function: Acknowledge Cooperative Alert
CREATE OR REPLACE FUNCTION public.acknowledge_cooperative_alert(alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.alert_acknowledgments (alert_id, alert_type, user_id)
  VALUES (alert_id, 'cooperative', auth.uid())
  ON CONFLICT (alert_id, alert_type, user_id) DO NOTHING;
END;
$$;

-- Function: Find Matching Researcher
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

-- Function: Get Peer Comparison
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
  RETURN QUERY
  SELECT 
    pto.treatment_type,
    ROUND(
      (COUNT(*) FILTER (WHERE pto.outcome = 'successful')::NUMERIC / COUNT(*)::NUMERIC) * 100,
      1
    ) as success_rate,
    ROUND(AVG(pto.effectiveness_score))::INTEGER as avg_effectiveness,
    COUNT(*) as sample_size
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

-- Function: Get Conversation Memory
CREATE OR REPLACE FUNCTION public.get_conversation_memory(
  p_user_id UUID,
  p_conversation_id UUID
)
RETURNS TABLE(
  id UUID,
  context_type TEXT,
  context_data JSONB,
  relevance_score NUMERIC,
  last_referenced_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.context_type,
    cm.context_data,
    cm.relevance_score,
    cm.last_referenced_at
  FROM public.conversation_memory cm
  WHERE 
    cm.user_id = p_user_id
    AND cm.conversation_id = p_conversation_id
  ORDER BY cm.last_referenced_at DESC, cm.relevance_score DESC
  LIMIT 10;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Critical Alerts RLS
ALTER TABLE public.critical_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view critical alerts for their fields"
  ON public.critical_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = critical_alerts.field_id
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create critical alerts"
  ON public.critical_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can acknowledge their critical alerts"
  ON public.critical_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = critical_alerts.field_id
      AND f.user_id = auth.uid()
    )
  );

-- Cooperative Alerts RLS
ALTER TABLE public.cooperative_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cooperative members can view alerts"
  ON public.cooperative_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cooperative_members cm
      WHERE cm.cooperative_id = cooperative_alerts.cooperative_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Cooperative admins can create alerts"
  ON public.cooperative_alerts FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    public.is_cooperative_admin(cooperative_id, auth.uid())
  );

-- Expert Consultations RLS
ALTER TABLE public.expert_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view their consultations"
  ON public.expert_consultations FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can create consultations"
  ON public.expert_consultations FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- Peer Treatment Outcomes RLS
ALTER TABLE public.peer_treatment_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own outcomes"
  ON public.peer_treatment_outcomes FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can create outcomes"
  ON public.peer_treatment_outcomes FOR INSERT
  WITH CHECK (
    auth.uid() = farmer_id AND
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = peer_treatment_outcomes.field_id
      AND f.user_id = auth.uid()
    )
  );

-- Conversation Memory RLS
ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation memory"
  ON public.conversation_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversation memory"
  ON public.conversation_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Alert Acknowledgments RLS
ALTER TABLE public.alert_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acknowledgments"
  ON public.alert_acknowledgments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create acknowledgments"
  ON public.alert_acknowledgments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_critical_alerts_field_id ON public.critical_alerts(field_id);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_acknowledged ON public.critical_alerts(acknowledged, urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_cooperative_alerts_cooperative_id ON public.cooperative_alerts(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_alerts_status ON public.cooperative_alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_farmer_id ON public.expert_consultations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_status ON public.expert_consultations(status);
CREATE INDEX IF NOT EXISTS idx_peer_outcomes_crop_problem ON public.peer_treatment_outcomes(crop_type, problem_addressed);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_conversation ON public.conversation_memory(user_id, conversation_id);

-- ============================================================================
-- COMPLETE
-- ============================================================================