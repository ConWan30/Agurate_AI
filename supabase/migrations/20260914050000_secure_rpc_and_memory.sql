-- Secure SECURITY DEFINER RPCs and restore usable conversation memory signature.
-- Nov Phase-4 migration overwrote get_conversation_memory with a conversation-scoped
-- shape and no auth.uid() check (IDOR). acknowledge_cooperative_alert also lacked
-- cooperative membership verification.

-- ---------------------------------------------------------------------------
-- get_conversation_memory: cross-conversation history with ownership check
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_conversation_memory(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_conversation_memory(UUID, INTEGER, UUID);

CREATE OR REPLACE FUNCTION public.get_conversation_memory(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_exclude_conversation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  role TEXT,
  content TEXT,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ,
  conversation_title TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    dm.id,
    dm.conversation_id,
    dm.role,
    dm.content,
    COALESCE(dm.context_snapshot, '{}'::jsonb) AS context_snapshot,
    dm.created_at,
    dc.title AS conversation_title
  FROM public.delta_messages dm
  JOIN public.delta_conversations dc ON dm.conversation_id = dc.id
  WHERE dc.user_id = p_user_id
    AND (
      p_exclude_conversation_id IS NULL
      OR dm.conversation_id <> p_exclude_conversation_id
    )
  ORDER BY dm.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

REVOKE ALL ON FUNCTION public.get_conversation_memory(UUID, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_memory(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_memory(UUID, INTEGER, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- acknowledge_cooperative_alert: require auth + cooperative membership
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.acknowledge_cooperative_alert(UUID, UUID);
DROP FUNCTION IF EXISTS public.acknowledge_cooperative_alert(UUID);

CREATE OR REPLACE FUNCTION public.acknowledge_cooperative_alert(alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cooperative_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT ca.cooperative_id
  INTO v_cooperative_id
  FROM public.cooperative_alerts ca
  WHERE ca.id = alert_id;

  IF v_cooperative_id IS NULL THEN
    RAISE EXCEPTION 'Alert not found';
  END IF;

  IF NOT public.is_cooperative_member(v_cooperative_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.alert_acknowledgments (alert_id, alert_type, user_id)
  VALUES (alert_id, 'cooperative', auth.uid())
  ON CONFLICT (alert_id, alert_type, user_id) DO NOTHING;

  -- Best-effort legacy array column if present
  BEGIN
    UPDATE public.cooperative_alerts
    SET acknowledged_by = array_append(COALESCE(acknowledged_by, '{}'::uuid[]), auth.uid())
    WHERE id = alert_id
      AND NOT (auth.uid() = ANY(COALESCE(acknowledged_by, '{}'::uuid[])));
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_cooperative_alert(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_cooperative_alert(UUID) TO authenticated;
