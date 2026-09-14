-- Also protect subscription_tier from client self-elevation (entitlements are server-owned).
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

  IF TG_OP = 'INSERT' THEN
    NEW.beta_farmer := false;
    NEW.lifetime_discount := 0;
    NEW.beta_signup_date := NULL;
    -- Default tier only; clients cannot self-assign paid tiers on insert
    IF NEW.subscription_tier IS NULL OR NEW.subscription_tier = '' THEN
      NEW.subscription_tier := 'beta';
    ELSE
      NEW.subscription_tier := 'beta';
    END IF;
    RETURN NEW;
  END IF;

  NEW.beta_farmer := OLD.beta_farmer;
  NEW.lifetime_discount := OLD.lifetime_discount;
  NEW.beta_signup_date := OLD.beta_signup_date;
  NEW.subscription_tier := OLD.subscription_tier;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_entitlements_trg ON public.profiles;
CREATE TRIGGER protect_profile_entitlements_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_entitlements();
