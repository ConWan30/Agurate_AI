-- Fix cooperative SECURITY DEFINER helpers that compared columns to themselves
-- (parameter names shadowed column names: user_id = user_id was always true when
-- any membership row existed). Restore creator bootstrap + invite join paths,
-- tighten cooperative_alerts updates, secure resolve RPC, lock cleanup_old_request_logs.

-- ---------------------------------------------------------------------------
-- is_cooperative_member / is_cooperative_admin
-- ---------------------------------------------------------------------------

-- CREATE OR REPLACE keeps dependent RLS policies intact (DROP would fail).
-- Parameter names kept as (coop_id, user_id) so CREATE OR REPLACE succeeds and
-- dependent RLS policies survive; body uses $1/$2 to avoid column/param shadowing.
CREATE OR REPLACE FUNCTION public.is_cooperative_member(coop_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cooperative_members cm
    WHERE cm.cooperative_id = $1
      AND cm.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.is_cooperative_admin(coop_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cooperative_members cm
    WHERE cm.cooperative_id = $1
      AND cm.user_id = $2
      AND cm.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_cooperative_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_cooperative_admin(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_cooperative_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_cooperative_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_cooperative_member(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_cooperative_admin(UUID, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- can_view_invitation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_view_invitation(p_inv_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cooperative_invitations ci
    WHERE ci.id = p_inv_id
      AND (
        ci.invited_by = p_user_id
        OR lower(ci.email) = lower((SELECT email FROM auth.users WHERE id = p_user_id))
        OR public.is_cooperative_member(ci.cooperative_id, p_user_id)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_view_invitation(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_invitation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_invitation(UUID, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- cooperative_members: creator bootstrap + invite self-join
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert members" ON public.cooperative_members;
DROP POLICY IF EXISTS "Creators can add themselves as admin" ON public.cooperative_members;
DROP POLICY IF EXISTS "Users can join via pending invitation" ON public.cooperative_members;

CREATE POLICY "Creators can add themselves as admin"
ON public.cooperative_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.cooperatives c
    WHERE c.id = cooperative_id
      AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can insert members"
ON public.cooperative_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_cooperative_admin(cooperative_id, auth.uid()));

CREATE POLICY "Users can join via pending invitation"
ON public.cooperative_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(role, 'member') = 'member'
  AND EXISTS (
    SELECT 1
    FROM public.cooperative_invitations ci
    WHERE ci.cooperative_id = cooperative_members.cooperative_id
      AND COALESCE(ci.status, 'pending') = 'pending'
      AND (ci.expires_at IS NULL OR ci.expires_at > now())
      AND lower(ci.email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Invitees can mark their own invitation accepted
DROP POLICY IF EXISTS "Invitees can accept their invitation" ON public.cooperative_invitations;

CREATE POLICY "Invitees can accept their invitation"
ON public.cooperative_invitations
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND COALESCE(status, 'pending') = 'pending'
)
WITH CHECK (
  lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND status IN ('accepted', 'declined')
);

-- ---------------------------------------------------------------------------
-- cooperative_alerts: stop unbounded member UPDATEs
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can acknowledge cooperative alerts" ON public.cooperative_alerts;
DROP POLICY IF EXISTS "Members can update cooperative alerts" ON public.cooperative_alerts;
DROP POLICY IF EXISTS "Creators and admins can update cooperative alerts" ON public.cooperative_alerts;

CREATE POLICY "Creators and admins can update cooperative alerts"
ON public.cooperative_alerts
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_cooperative_admin(cooperative_id, auth.uid())
)
WITH CHECK (
  created_by = auth.uid()
  OR public.is_cooperative_admin(cooperative_id, auth.uid())
);

-- ---------------------------------------------------------------------------
-- resolve_cooperative_alert: auth.uid() + creator/admin only
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.resolve_cooperative_alert(UUID, UUID);
DROP FUNCTION IF EXISTS public.resolve_cooperative_alert(UUID);

CREATE FUNCTION public.resolve_cooperative_alert(p_alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cooperative_id UUID;
  v_created_by UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cooperative_id, created_by
  INTO v_cooperative_id, v_created_by
  FROM public.cooperative_alerts
  WHERE id = p_alert_id;

  IF v_cooperative_id IS NULL THEN
    RAISE EXCEPTION 'Alert not found';
  END IF;

  IF auth.uid() <> v_created_by
     AND NOT public.is_cooperative_admin(v_cooperative_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  BEGIN
    UPDATE public.cooperative_alerts
    SET resolved_at = now(), status = 'resolved'
    WHERE id = p_alert_id;
  EXCEPTION
    WHEN undefined_column THEN
      UPDATE public.cooperative_alerts
      SET resolved_at = now()
      WHERE id = p_alert_id;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_cooperative_alert(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_cooperative_alert(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- cleanup_old_request_logs: service_role / scheduler only
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.cleanup_old_request_logs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_request_logs() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_request_logs() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_request_logs() TO service_role;
