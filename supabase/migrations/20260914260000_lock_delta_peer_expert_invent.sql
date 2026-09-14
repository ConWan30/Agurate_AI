-- Lock delta_messages assistant invent, restore peer outcome field ownership,
-- and freeze expert / researcher response columns from client forgery.

-- ---------------------------------------------------------------------------
-- delta_messages: clients may only insert role = 'user'
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.delta_messages;
DROP POLICY IF EXISTS "Users can create own messages" ON public.delta_messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.delta_messages;
DROP POLICY IF EXISTS "Users can create user messages in own conversations" ON public.delta_messages;

CREATE POLICY "Users can create user messages in own conversations"
  ON public.delta_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'user'
    AND EXISTS (
      SELECT 1
      FROM public.delta_conversations dc
      WHERE dc.id = delta_messages.conversation_id
        AND dc.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- peer_treatment_outcomes: require owned field on INSERT
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Farmers can insert their treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Users can insert own peer treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Users can insert their own treatment outcomes" ON public.peer_treatment_outcomes;
DROP POLICY IF EXISTS "Farmers can insert treatment outcomes for own fields" ON public.peer_treatment_outcomes;

CREATE POLICY "Farmers can insert treatment outcomes for own fields"
  ON public.peer_treatment_outcomes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    farmer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.fields f
      WHERE f.id = peer_treatment_outcomes.field_id
        AND f.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- expert_consultations: clients cannot invent status / response
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_expert_consultation_response_columns()
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
    NEW.status := 'pending';
    NEW.response := NULL;
    NEW.responded_at := NULL;
    RETURN NEW;
  END IF;

  NEW.response := OLD.response;
  NEW.responded_at := OLD.responded_at;
  NEW.researcher_id := OLD.researcher_id;
  NEW.farmer_id := OLD.farmer_id;
  NEW.id := OLD.id;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('pending', 'cancelled') THEN
    RAISE EXCEPTION
      'expert_consultations status may only stay pending or be cancelled by clients'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_expert_consultation_response_columns_trg
  ON public.expert_consultations;
CREATE TRIGGER protect_expert_consultation_response_columns_trg
  BEFORE INSERT OR UPDATE ON public.expert_consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_expert_consultation_response_columns();

-- ---------------------------------------------------------------------------
-- farmer_researcher_interactions: block forged LSU replies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can update own interactions" ON public.farmer_researcher_interactions;

CREATE OR REPLACE FUNCTION public.protect_farmer_researcher_interaction_columns()
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
    NEW.response := NULL;
    NEW.status := 'pending';
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'farmer_researcher_interactions may only be updated by trusted backends'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS protect_farmer_researcher_interaction_columns_trg
  ON public.farmer_researcher_interactions;
CREATE TRIGGER protect_farmer_researcher_interaction_columns_trg
  BEFORE INSERT OR UPDATE ON public.farmer_researcher_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_farmer_researcher_interaction_columns();
