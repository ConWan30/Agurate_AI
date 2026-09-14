-- Stop admins from forging cooperative membership for arbitrary users.
-- Membership is creator self-admin bootstrap or invitee self-join only.
-- Add honesty CHECKs on community_insights money/rating + freeze lsu_validation.

-- ---------------------------------------------------------------------------
-- cooperative_members: drop open admin INSERT of other users
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert members" ON public.cooperative_members;

-- Keep creator bootstrap + invite self-join (both require auth.uid() = user_id).
-- Defense in depth: reject any client INSERT that forges another user's membership.
CREATE OR REPLACE FUNCTION public.protect_cooperative_member_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION
      'cooperative_members.user_id must equal the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS NULL OR NEW.role = '' THEN
    NEW.role := 'member';
  ELSIF NEW.role NOT IN ('admin', 'member') THEN
    NEW.role := 'member';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_cooperative_member_insert_trg ON public.cooperative_members;
CREATE TRIGGER protect_cooperative_member_insert_trg
  BEFORE INSERT ON public.cooperative_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cooperative_member_insert();

-- ---------------------------------------------------------------------------
-- community_insights: savings >= 0, rating 0–5; freeze lsu_validation invent
-- ---------------------------------------------------------------------------

UPDATE public.community_insights
SET savings_achieved = NULL
WHERE savings_achieved IS NOT NULL AND savings_achieved < 0;

UPDATE public.community_insights
SET community_rating = NULL
WHERE community_rating IS NOT NULL
  AND (community_rating < 0 OR community_rating > 5);

ALTER TABLE public.community_insights
  DROP CONSTRAINT IF EXISTS community_insights_savings_achieved_check;

ALTER TABLE public.community_insights
  ADD CONSTRAINT community_insights_savings_achieved_check
  CHECK (savings_achieved IS NULL OR savings_achieved >= 0);

ALTER TABLE public.community_insights
  DROP CONSTRAINT IF EXISTS community_insights_community_rating_check;

ALTER TABLE public.community_insights
  ADD CONSTRAINT community_insights_community_rating_check
  CHECK (
    community_rating IS NULL
    OR (community_rating >= 0 AND community_rating <= 5)
  );

CREATE OR REPLACE FUNCTION public.protect_community_insight_lsu_validation()
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
    NEW.lsu_validation := false;
    RETURN NEW;
  END IF;

  NEW.lsu_validation := OLD.lsu_validation;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_community_insight_lsu_validation_trg ON public.community_insights;
CREATE TRIGGER protect_community_insight_lsu_validation_trg
  BEFORE INSERT OR UPDATE ON public.community_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_community_insight_lsu_validation();
