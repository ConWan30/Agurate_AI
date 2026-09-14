-- Clamp entitlement columns on INSERT as well as UPDATE (clients must not self-grant).
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
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_entitlements();
