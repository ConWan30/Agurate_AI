-- Align invitation SELECT with case-insensitive email matching used by accept/update policies.

DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.cooperative_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.cooperative_invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by code" ON public.cooperative_invitations;

CREATE POLICY "Users can view relevant invitations"
ON public.cooperative_invitations
FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid()
  OR lower(email) = lower(auth.email())
  OR public.is_cooperative_member(cooperative_id, auth.uid())
);
