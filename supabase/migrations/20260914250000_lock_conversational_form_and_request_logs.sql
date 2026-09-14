-- Lock conversational-form invent paths and request_logs / form_completion_analytics
-- from client forgery. Trusted backends (service_role) retain write access.

-- ---------------------------------------------------------------------------
-- request_logs + form_completion_analytics: service_role INSERT only
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own request logs" ON public.request_logs;
DROP POLICY IF EXISTS "System can insert request logs" ON public.request_logs;
DROP POLICY IF EXISTS "Users can insert form completion analytics for own sessions"
  ON public.form_completion_analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON public.form_completion_analytics;

DROP TRIGGER IF EXISTS reject_client_insert_request_logs_trg ON public.request_logs;
CREATE TRIGGER reject_client_insert_request_logs_trg
  BEFORE INSERT ON public.request_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_form_completion_analytics_trg
  ON public.form_completion_analytics;
CREATE TRIGGER reject_client_insert_form_completion_analytics_trg
  BEFORE INSERT ON public.form_completion_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

-- ---------------------------------------------------------------------------
-- conversational_form_sessions: freeze completion metrics from client writes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_conversational_form_session_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.completion_percentage := 0;
    NEW.extracted_data := COALESCE(NEW.extracted_data, '{}'::jsonb);
    IF NEW.status IS NULL OR NEW.status NOT IN ('active', 'in_progress') THEN
      NEW.status := 'active';
    END IF;
    NEW.completed_at := NULL;
    NEW.abandoned_at := NULL;
    RETURN NEW;
  END IF;

  -- Clients may abandon / mark completed, but cannot invent progress metrics
  NEW.completion_percentage := OLD.completion_percentage;
  NEW.extracted_data := OLD.extracted_data;
  NEW.form_type := OLD.form_type;
  NEW.user_id := OLD.user_id;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  NEW.started_at := OLD.started_at;
  NEW.context_data := OLD.context_data;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('active', 'in_progress', 'abandoned', 'completed') THEN
    RAISE EXCEPTION
      'conversational_form_sessions status may only be active, abandoned, or completed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_conversational_form_session_metrics_trg
  ON public.conversational_form_sessions;
CREATE TRIGGER protect_conversational_form_session_metrics_trg
  BEFORE INSERT OR UPDATE ON public.conversational_form_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_conversational_form_session_metrics();

-- ---------------------------------------------------------------------------
-- conversational_form_messages: clients may only insert role = 'user'
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create messages in their sessions"
  ON public.conversational_form_messages;
DROP POLICY IF EXISTS "Users can create user messages in their sessions"
  ON public.conversational_form_messages;

CREATE POLICY "Users can create user messages in their sessions"
  ON public.conversational_form_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'user'
    AND EXISTS (
      SELECT 1
      FROM public.conversational_form_sessions s
      WHERE s.id = conversational_form_messages.session_id
        AND s.user_id = auth.uid()
    )
  );
