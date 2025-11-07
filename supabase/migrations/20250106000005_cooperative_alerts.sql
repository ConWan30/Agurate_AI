-- Cooperative Alerts & Coordination System
-- Allows farmers in the same cooperative to share critical alerts and coordinate responses

CREATE TABLE IF NOT EXISTS cooperative_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('disease_outbreak', 'pest_infestation', 'weather_alert', 'treatment_success', 'best_practice')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  crop_type TEXT,
  affected_area TEXT, -- e.g., "North fields", "All rice fields"
  recommended_action TEXT,
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL, -- Optional: specific field reference
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL, -- Optional: assessment that triggered alert
  acknowledged_by UUID[] DEFAULT '{}', -- Array of user IDs who acknowledged
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Index for efficient queries
CREATE INDEX idx_cooperative_alerts_cooperative ON cooperative_alerts(cooperative_id, created_at DESC);
CREATE INDEX idx_cooperative_alerts_severity ON cooperative_alerts(cooperative_id, severity, created_at DESC);
CREATE INDEX idx_cooperative_alerts_crop_type ON cooperative_alerts(cooperative_id, crop_type, created_at DESC);

-- View for active cooperative alerts (not resolved, not expired)
CREATE OR REPLACE VIEW active_cooperative_alerts AS
SELECT 
  ca.*,
  c.name as cooperative_name,
  p.full_name as created_by_name
FROM cooperative_alerts ca
JOIN cooperatives c ON c.id = ca.cooperative_id
LEFT JOIN profiles p ON p.id = ca.created_by
WHERE ca.resolved_at IS NULL
  AND (ca.expires_at IS NULL OR ca.expires_at > now())
ORDER BY 
  CASE ca.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END,
  ca.created_at DESC;

-- Function to acknowledge a cooperative alert
CREATE OR REPLACE FUNCTION acknowledge_cooperative_alert(
  alert_id UUID,
  user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE cooperative_alerts
  SET acknowledged_by = array_append(acknowledged_by, user_id)
  WHERE id = alert_id
    AND NOT (user_id = ANY(acknowledged_by)); -- Prevent duplicate acknowledgments
END;
$$;

-- Function to resolve a cooperative alert
CREATE OR REPLACE FUNCTION resolve_cooperative_alert(
  alert_id UUID,
  user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow resolution by cooperative admins or alert creator
  UPDATE cooperative_alerts
  SET resolved_at = now()
  WHERE id = alert_id
    AND (
      created_by = user_id
      OR EXISTS (
        SELECT 1 FROM cooperative_members cm
        WHERE cm.cooperative_id = cooperative_alerts.cooperative_id
          AND cm.user_id = user_id
          AND cm.role = 'admin'
      )
    );
END;
$$;

-- RLS Policies
ALTER TABLE cooperative_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view alerts from cooperatives they belong to
CREATE POLICY "Users can view cooperative alerts from their cooperatives"
ON cooperative_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cooperative_members cm
    WHERE cm.cooperative_id = cooperative_alerts.cooperative_id
      AND cm.user_id = auth.uid()
  )
);

-- Users can create alerts in cooperatives they belong to
CREATE POLICY "Users can create alerts in their cooperatives"
ON cooperative_alerts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cooperative_members cm
    WHERE cm.cooperative_id = cooperative_alerts.cooperative_id
      AND cm.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Users can acknowledge alerts
CREATE POLICY "Users can acknowledge cooperative alerts"
ON cooperative_alerts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cooperative_members cm
    WHERE cm.cooperative_id = cooperative_alerts.cooperative_id
      AND cm.user_id = auth.uid()
  )
);

-- Grant access to functions
GRANT EXECUTE ON FUNCTION acknowledge_cooperative_alert(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_cooperative_alert(UUID, UUID) TO authenticated;

