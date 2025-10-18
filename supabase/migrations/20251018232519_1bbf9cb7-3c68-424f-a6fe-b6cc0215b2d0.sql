-- Insurance Claims Enhancements
-- Add junction table for linking assessments to claims
CREATE TABLE IF NOT EXISTS public.claim_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(claim_id, assessment_id)
);

-- Add notes field to insurance_claims
ALTER TABLE public.insurance_claims 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Enable RLS on claim_assessments
ALTER TABLE public.claim_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for claim_assessments
CREATE POLICY "Users can view own claim assessments"
ON public.claim_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.insurance_claims ic
    JOIN public.fields f ON f.id = ic.field_id
    WHERE ic.id = claim_assessments.claim_id
    AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own claim assessments"
ON public.claim_assessments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.insurance_claims ic
    JOIN public.fields f ON f.id = ic.field_id
    WHERE ic.id = claim_assessments.claim_id
    AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own claim assessments"
ON public.claim_assessments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.insurance_claims ic
    JOIN public.fields f ON f.id = ic.field_id
    WHERE ic.id = claim_assessments.claim_id
    AND f.user_id = auth.uid()
  )
);

-- Cooperative Invitations
CREATE TABLE IF NOT EXISTS public.cooperative_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID NOT NULL REFERENCES public.cooperatives(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  UNIQUE(cooperative_id, email)
);

-- Enable RLS on cooperative_invitations
ALTER TABLE public.cooperative_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
CREATE POLICY "Admins can manage invitations"
ON public.cooperative_invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cooperative_members
    WHERE cooperative_id = cooperative_invitations.cooperative_id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view invitations by code"
ON public.cooperative_invitations FOR SELECT
USING (true);

-- Delta Intelligence - Conversations table
CREATE TABLE IF NOT EXISTS public.delta_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delta_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.delta_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delta_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delta_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for Delta Intelligence
CREATE POLICY "Users can view own conversations"
ON public.delta_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
ON public.delta_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.delta_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.delta_conversations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages"
ON public.delta_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.delta_conversations
    WHERE id = delta_messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own messages"
ON public.delta_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delta_conversations
    WHERE id = delta_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claim_assessments_claim ON public.claim_assessments(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_assessments_assessment ON public.claim_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_invitations_code ON public.cooperative_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_cooperative_invitations_email ON public.cooperative_invitations(email);
CREATE INDEX IF NOT EXISTS idx_delta_messages_conversation ON public.delta_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_delta_conversations_user ON public.delta_conversations(user_id);