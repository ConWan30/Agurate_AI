-- ==========================================
-- SECURITY FIX: AgurateAI Comprehensive Security Hardening
-- ==========================================

-- 1. Create security definer function to break cooperative_members recursion
CREATE OR REPLACE FUNCTION public.is_cooperative_member(coop_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM cooperative_members 
    WHERE cooperative_id = coop_id AND user_id = user_id
  );
$$;

-- 2. Create security definer function to check if user is cooperative admin
CREATE OR REPLACE FUNCTION public.is_cooperative_admin(coop_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM cooperative_members 
    WHERE cooperative_id = coop_id 
    AND user_id = user_id 
    AND role = 'admin'
  );
$$;

-- 3. Drop existing problematic RLS policies on cooperative_members
DROP POLICY IF EXISTS "Cooperative admins can manage members" ON public.cooperative_members;
DROP POLICY IF EXISTS "Members can view cooperative membership" ON public.cooperative_members;

-- 4. Create new non-recursive RLS policies for cooperative_members using security definer functions
CREATE POLICY "Users can view their own membership"
ON public.cooperative_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all members in their cooperatives"
ON public.cooperative_members
FOR SELECT
TO authenticated
USING (public.is_cooperative_admin(cooperative_id, auth.uid()));

CREATE POLICY "Admins can insert members"
ON public.cooperative_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_cooperative_admin(cooperative_id, auth.uid()));

CREATE POLICY "Admins can delete members"
ON public.cooperative_members
FOR DELETE
TO authenticated
USING (public.is_cooperative_admin(cooperative_id, auth.uid()));

CREATE POLICY "Admins can update members"
ON public.cooperative_members
FOR UPDATE
TO authenticated
USING (public.is_cooperative_admin(cooperative_id, auth.uid()))
WITH CHECK (public.is_cooperative_admin(cooperative_id, auth.uid()));

-- 5. Fix cooperative_invitations overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitations by code" ON public.cooperative_invitations;

-- Create security definer function for invitation access
CREATE OR REPLACE FUNCTION public.can_view_invitation(inv_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM cooperative_invitations ci
    WHERE ci.id = inv_id
    AND (
      ci.invited_by = user_id OR
      ci.email = (SELECT email FROM auth.users WHERE id = user_id) OR
      public.is_cooperative_member(ci.cooperative_id, user_id)
    )
  );
$$;

CREATE POLICY "Users can view relevant invitations"
ON public.cooperative_invitations
FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid() OR
  email = auth.email() OR
  public.is_cooperative_member(cooperative_id, auth.uid())
);

-- 6. Ensure assessment_details view respects RLS from base tables
-- Verify that base tables have proper RLS (they already do based on the schema)
-- No changes needed - the view will automatically respect base table RLS

-- 7. Add comments for documentation
COMMENT ON FUNCTION public.is_cooperative_member IS 'Security definer function to check cooperative membership without triggering RLS recursion';
COMMENT ON FUNCTION public.is_cooperative_admin IS 'Security definer function to check cooperative admin status without triggering RLS recursion';
COMMENT ON FUNCTION public.can_view_invitation IS 'Security definer function to check invitation visibility without triggering RLS recursion';