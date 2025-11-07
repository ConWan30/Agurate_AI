-- Critical Alerts System
-- Tracks critical alerts and their escalation status

CREATE TABLE IF NOT EXISTS critical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL, -- 'disease', 'pest', 'weather', 'water_stress', 'nutrient_deficiency'
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  estimated_loss_usd NUMERIC(10, 2),
  urgency_score INTEGER DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  
  -- Escalation tracking
  in_app_notification_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  voice_call_attempted BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sms_sent_at TIMESTAMPTZ,
  voice_call_attempted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Alert expires after this time
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_critical_alerts_user_id ON critical_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_field_id ON critical_alerts(field_id);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_acknowledged ON critical_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_created_at ON critical_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_urgency ON critical_alerts(urgency_score DESC) WHERE acknowledged = false;

-- RLS Policies
ALTER TABLE critical_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON critical_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON critical_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to acknowledge an alert
CREATE OR REPLACE FUNCTION acknowledge_critical_alert(alert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE critical_alerts
  SET 
    acknowledged = true,
    acknowledged_at = NOW()
  WHERE id = alert_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for unacknowledged critical alerts
CREATE OR REPLACE VIEW unacknowledged_critical_alerts AS
SELECT 
  ca.*,
  f.name as field_name,
  f.crop_type,
  a.health_score,
  a.stress_level
FROM critical_alerts ca
LEFT JOIN fields f ON ca.field_id = f.id
LEFT JOIN assessments a ON ca.assessment_id = a.id
WHERE ca.acknowledged = false
  AND (ca.expires_at IS NULL OR ca.expires_at > NOW())
ORDER BY ca.urgency_score DESC, ca.created_at DESC;

-- Grant access
GRANT SELECT ON unacknowledged_critical_alerts TO authenticated;

