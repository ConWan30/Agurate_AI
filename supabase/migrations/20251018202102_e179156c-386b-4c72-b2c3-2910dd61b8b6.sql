-- Create cooperatives table for multi-farm management
CREATE TABLE public.cooperatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cooperative members table
CREATE TABLE public.cooperative_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cooperative_id UUID NOT NULL REFERENCES public.cooperatives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'manager', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cooperative_id, user_id)
);

-- Add cooperative_id to fields table
ALTER TABLE public.fields 
ADD COLUMN cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL;

-- Create insurance claims table
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  claim_number TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  estimated_loss_percentage NUMERIC,
  description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'denied'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperative_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- Cooperatives policies
CREATE POLICY "Users can view cooperatives they belong to"
ON public.cooperatives FOR SELECT
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.cooperative_members
    WHERE cooperative_id = cooperatives.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create cooperatives"
ON public.cooperatives FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Cooperative admins can update"
ON public.cooperatives FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.cooperative_members
    WHERE cooperative_id = cooperatives.id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Cooperative members policies
CREATE POLICY "Members can view cooperative membership"
ON public.cooperative_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cooperative_members cm
    WHERE cm.cooperative_id = cooperative_members.cooperative_id 
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Cooperative admins can manage members"
ON public.cooperative_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cooperative_members
    WHERE cooperative_id = cooperative_members.cooperative_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Insurance claims policies
CREATE POLICY "Users can view own field claims"
ON public.insurance_claims FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fields
    WHERE fields.id = insurance_claims.field_id 
    AND fields.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create claims for own fields"
ON public.insurance_claims FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fields
    WHERE fields.id = insurance_claims.field_id 
    AND fields.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own field claims"
ON public.insurance_claims FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.fields
    WHERE fields.id = insurance_claims.field_id 
    AND fields.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_cooperatives_updated_at
BEFORE UPDATE ON public.cooperatives
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at
BEFORE UPDATE ON public.insurance_claims
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();