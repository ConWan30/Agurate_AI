-- Prevent clients from self-approving insurance claims or rewriting invitation identity columns.

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

  -- Identity / ownership columns are immutable for clients
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
  BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_insurance_claim_status();

CREATE OR REPLACE FUNCTION public.protect_cooperative_invitation_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text;
  is_invitee boolean := false;
  is_admin boolean := false;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  is_invitee := caller_email IS NOT NULL AND lower(OLD.email) = lower(caller_email);
  is_admin := public.is_cooperative_admin(OLD.cooperative_id, auth.uid());

  -- Invitees may only flip status (+ accepted_at); freeze invitation identity
  IF is_invitee AND NOT is_admin THEN
    NEW.id := OLD.id;
    NEW.cooperative_id := OLD.cooperative_id;
    NEW.email := OLD.email;
    NEW.invite_code := OLD.invite_code;
    NEW.invited_by := OLD.invited_by;
    NEW.expires_at := OLD.expires_at;
    NEW.created_at := OLD.created_at;

    IF NEW.status IS NULL OR NEW.status NOT IN ('accepted', 'declined') THEN
      NEW.status := OLD.status;
    END IF;

    IF NEW.status = 'accepted' THEN
      NEW.accepted_at := COALESCE(NEW.accepted_at, now());
    ELSE
      NEW.accepted_at := OLD.accepted_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_cooperative_invitation_columns_trg ON public.cooperative_invitations;
CREATE TRIGGER protect_cooperative_invitation_columns_trg
  BEFORE UPDATE ON public.cooperative_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cooperative_invitation_columns();
