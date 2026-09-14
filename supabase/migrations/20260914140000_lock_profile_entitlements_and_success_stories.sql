-- Prevent authenticated users from self-granting beta entitlements via profiles UPDATE.
-- Entitlement columns may only change through service_role (edge functions) or SQL.

CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.beta_farmer := OLD.beta_farmer;
  NEW.lifetime_discount := OLD.lifetime_discount;
  NEW.beta_signup_date := OLD.beta_signup_date;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_entitlements_trg ON public.profiles;
CREATE TRIGGER protect_profile_entitlements_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_entitlements();

-- Success stories: require moderation before public visibility
ALTER TABLE public.success_stories
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Anyone can view public stories" ON public.success_stories;
CREATE POLICY "Anyone can view approved public stories"
  ON public.success_stories
  FOR SELECT
  USING (allow_public_use = true AND approved = true);

-- Clients must not self-approve
CREATE OR REPLACE FUNCTION public.protect_success_story_public_flags()
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
    NEW.approved := false;
    RETURN NEW;
  END IF;

  NEW.approved := OLD.approved;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_success_story_public_flags_trg ON public.success_stories;
CREATE TRIGGER protect_success_story_public_flags_trg
  BEFORE INSERT OR UPDATE ON public.success_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_success_story_public_flags();
