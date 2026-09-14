-- Harden claim INSERT status + drop open cooperative-alert member INSERT
-- (RLS ORs policies, so member INSERT still allowed alongside admin INSERT).

CREATE OR REPLACE FUNCTION public.protect_insurance_claim_status()
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
    -- Clients cannot insert already-approved/denied claims
    IF NEW.status IS NULL OR NEW.status = '' THEN
      NEW.status := 'draft';
    ELSIF NEW.status NOT IN ('draft', 'submitted') THEN
      NEW.status := 'draft';
    END IF;
    IF NEW.status = 'submitted' THEN
      NEW.submitted_at := COALESCE(NEW.submitted_at, now());
    ELSE
      NEW.submitted_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- Identity / ownership columns are immutable for clients on UPDATE
  NEW.id := OLD.id;
  NEW.field_id := OLD.field_id;
  NEW.created_at := OLD.created_at;

  -- After leaving draft, clients cannot change status (no self-approve / self-deny)
  IF OLD.status IS DISTINCT FROM 'draft' AND OLD.status IS NOT NULL THEN
    NEW.status := OLD.status;
    NEW.submitted_at := OLD.submitted_at;
    RETURN NEW;
  END IF;

  -- From draft, clients may only keep draft or move to submitted
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'draft';
  ELSIF NEW.status NOT IN ('draft', 'submitted') THEN
    NEW.status := COALESCE(OLD.status, 'draft');
  END IF;

  IF NEW.status = 'submitted' AND COALESCE(OLD.status, 'draft') IS DISTINCT FROM 'submitted' THEN
    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_insurance_claim_status_trg ON public.insurance_claims;
CREATE TRIGGER protect_insurance_claim_status_trg
  BEFORE INSERT OR UPDATE ON public.insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_insurance_claim_status();

-- Drop open any-member INSERT policies; keep admin-only create policy.
DROP POLICY IF EXISTS "Users can create alerts in their cooperatives" ON public.cooperative_alerts;
DROP POLICY IF EXISTS "Users can create alerts for their cooperatives" ON public.cooperative_alerts;
DROP POLICY IF EXISTS "Members can create cooperative alerts" ON public.cooperative_alerts;
