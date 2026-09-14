-- Reconcile critical_alerts schema + acknowledge RPC after Jan/Nov drift.
-- Live types match the Nov CREATE IF NOT EXISTS shape (no user_id / expires_at /
-- in_app_notification_sent). Edge detect-critical-alerts still writes the Jan
-- columns and alert_type values (water_stress, general) that Nov's CHECK rejects.
-- Also restore ownership checks on SECURITY DEFINER acknowledge_critical_alert.

-- ---------------------------------------------------------------------------
-- Columns required by the edge function + Jan schema
-- ---------------------------------------------------------------------------

ALTER TABLE public.critical_alerts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.critical_alerts
  ADD COLUMN IF NOT EXISTS in_app_notification_sent BOOLEAN DEFAULT false;

ALTER TABLE public.critical_alerts
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.critical_alerts
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Backfill user_id from field ownership when missing
UPDATE public.critical_alerts ca
SET user_id = f.user_id
FROM public.fields f
WHERE ca.field_id = f.id
  AND ca.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_critical_alerts_user_id ON public.critical_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_critical_alerts_expires_at ON public.critical_alerts(expires_at);

-- ---------------------------------------------------------------------------
-- Widen alert_type CHECK to values the edge function actually writes
-- ---------------------------------------------------------------------------

ALTER TABLE public.critical_alerts DROP CONSTRAINT IF EXISTS critical_alerts_alert_type_check;

ALTER TABLE public.critical_alerts
  ADD CONSTRAINT critical_alerts_alert_type_check
  CHECK (
    alert_type IN (
      'disease',
      'pest',
      'weather',
      'stress',
      'yield_loss',
      'water_stress',
      'nutrient_deficiency',
      'general'
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: keep field-ownership insert; add user-scoped select/update when user_id set
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own alerts" ON public.critical_alerts;
DROP POLICY IF EXISTS "Users can view critical alerts for their fields" ON public.critical_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.critical_alerts;
DROP POLICY IF EXISTS "Users can acknowledge their critical alerts" ON public.critical_alerts;

CREATE POLICY "Users can view own or field-owned critical alerts"
  ON public.critical_alerts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = critical_alerts.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own or field-owned critical alerts"
  ON public.critical_alerts
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = critical_alerts.field_id
        AND f.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = critical_alerts.field_id
        AND f.user_id = auth.uid()
    )
  );

-- Tighten insert policy now that user_id exists (drop + recreate)
DROP POLICY IF EXISTS "Users can insert critical alerts for own fields" ON public.critical_alerts;

CREATE POLICY "Users can insert critical alerts for own fields"
  ON public.critical_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id IS NULL OR auth.uid() = user_id)
    AND EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = critical_alerts.field_id
        AND f.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Acknowledge RPC: require ownership (user_id or field owner)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.acknowledge_critical_alert(alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.critical_alerts ca
  SET
    acknowledged = true,
    acknowledged_at = now()
  WHERE ca.id = alert_id
    AND (
      ca.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.fields f
        WHERE f.id = ca.field_id
          AND f.user_id = auth.uid()
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert not found or not authorized';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_critical_alert(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_critical_alert(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- View: include expiry filter; invoker security when supported
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.unacknowledged_critical_alerts AS
SELECT
  ca.*,
  f.name AS field_name,
  f.crop_type
FROM public.critical_alerts ca
LEFT JOIN public.fields f ON f.id = ca.field_id
WHERE ca.acknowledged = false
  AND (ca.expires_at IS NULL OR ca.expires_at > now())
ORDER BY ca.urgency_score DESC, ca.created_at DESC;

DO $$
BEGIN
  EXECUTE 'ALTER VIEW public.unacknowledged_critical_alerts SET (security_invoker = true)';
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- older Postgres / hosted variants may not support security_invoker
END $$;

GRANT SELECT ON public.unacknowledged_critical_alerts TO authenticated;
