-- Cooperative alert INSERT: severity allowlist; bind crop/acres from owned field.

CREATE OR REPLACE FUNCTION public.protect_cooperative_alert_insert_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owned_field uuid;
  field_crop text;
  field_acres numeric;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'active';
    NEW.resolved_at := NULL;

    IF NEW.severity IS NULL
      OR lower(NEW.severity) NOT IN ('critical', 'high', 'medium', 'low', 'info') THEN
      -- Fail closed to allowlisted 'info' (CHECK rejects invent values / unknown).
      NEW.severity := 'info';
    ELSE
      NEW.severity := lower(NEW.severity);
    END IF;

    IF NEW.field_id IS NOT NULL THEN
      SELECT f.id, f.crop_type, f.acreage
        INTO owned_field, field_crop, field_acres
      FROM public.fields f
      WHERE f.id = NEW.field_id
        AND f.user_id = auth.uid();

      IF owned_field IS NULL THEN
        RAISE EXCEPTION 'cooperative_alerts.field_id must be owned by the authenticated user'
          USING ERRCODE = '42501';
      END IF;

      -- Never trust client crop_type when a field is attached.
      NEW.crop_type := field_crop;

      -- Do not invent acreage above the owned field footprint.
      IF field_acres IS NOT NULL AND NEW.affected_area_acres IS NOT NULL
         AND NEW.affected_area_acres > field_acres THEN
        NEW.affected_area_acres := field_acres;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_cooperative_alert_insert_status_trg
  ON public.cooperative_alerts;
CREATE TRIGGER protect_cooperative_alert_insert_status_trg
  BEFORE INSERT ON public.cooperative_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cooperative_alert_insert_status();
