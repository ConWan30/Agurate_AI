-- Freeze critical_alerts AI/content columns from client UPDATE (acknowledge-only).
-- Require claim_assessments to link assessments that belong to the claim's field.

-- ---------------------------------------------------------------------------
-- critical_alerts: clients may only flip acknowledged / acknowledged_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_critical_alerts_ai_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.alert_type IS DISTINCT FROM OLD.alert_type
      OR NEW.severity IS DISTINCT FROM OLD.severity
      OR NEW.title IS DISTINCT FROM OLD.title
      OR NEW.message IS DISTINCT FROM OLD.message
      OR NEW.urgency_score IS DISTINCT FROM OLD.urgency_score
      OR NEW.estimated_loss_usd IS DISTINCT FROM OLD.estimated_loss_usd
      OR NEW.assessment_id IS DISTINCT FROM OLD.assessment_id
      OR NEW.field_id IS DISTINCT FROM OLD.field_id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.metadata IS DISTINCT FROM OLD.metadata
      OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
      OR NEW.sms_sent IS DISTINCT FROM OLD.sms_sent
      OR NEW.voice_call_attempted IS DISTINCT FROM OLD.voice_call_attempted
      OR NEW.in_app_notification_sent IS DISTINCT FROM OLD.in_app_notification_sent
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
      OR NEW.id IS DISTINCT FROM OLD.id
    THEN
      RAISE EXCEPTION
        'critical_alerts content columns may only be updated by trusted backends'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_critical_alerts_ai_columns_trg ON public.critical_alerts;
CREATE TRIGGER protect_critical_alerts_ai_columns_trg
  BEFORE UPDATE ON public.critical_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_critical_alerts_ai_columns();

-- ---------------------------------------------------------------------------
-- claim_assessments: assessment must belong to the same field as the claim
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own claim assessments" ON public.claim_assessments;

CREATE POLICY "Users can insert own claim assessments"
ON public.claim_assessments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.insurance_claims ic
    JOIN public.fields f ON f.id = ic.field_id
    JOIN public.assessments a ON a.id = claim_assessments.assessment_id
    WHERE ic.id = claim_assessments.claim_id
      AND f.user_id = auth.uid()
      AND a.field_id = ic.field_id
  )
);
