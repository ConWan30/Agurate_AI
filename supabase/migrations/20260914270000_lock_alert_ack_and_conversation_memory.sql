-- Lock alert_acknowledgments client INSERT (ownership gap) and drop dead
-- conversation_memory client INSERT. Acknowledgments must go through the
-- SECURITY DEFINER acknowledge_cooperative_alert RPC (membership-checked).

-- ---------------------------------------------------------------------------
-- alert_acknowledgments: no direct client invent of acknowledgments
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create acknowledgments" ON public.alert_acknowledgments;

DROP TRIGGER IF EXISTS reject_client_insert_alert_acknowledgments_trg
  ON public.alert_acknowledgments;
CREATE TRIGGER reject_client_insert_alert_acknowledgments_trg
  BEFORE INSERT ON public.alert_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

-- ---------------------------------------------------------------------------
-- conversation_memory: unused client write path (reads use delta_messages)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create own conversation memory"
  ON public.conversation_memory;

DROP TRIGGER IF EXISTS reject_client_insert_conversation_memory_trg
  ON public.conversation_memory;
CREATE TRIGGER reject_client_insert_conversation_memory_trg
  BEFORE INSERT ON public.conversation_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();
