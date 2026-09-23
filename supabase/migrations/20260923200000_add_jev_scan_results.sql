-- Jev scan preflight results table
-- Stores TypeSafe System One probability vectors and code-mapped stamps
CREATE TABLE IF NOT EXISTS public.jev_scan_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
    stamp TEXT NOT NULL CHECK (stamp IN ('look-here-first', 'caution', 'hold', 'insufficient', 'out-of-scope')),
    answers JSONB NOT NULL,
    reasoning TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT one_jev_result_per_assessment UNIQUE (assessment_id)
);

COMMENT ON TABLE public.jev_scan_results IS
  'TypeSafe Jev System One scan preflight results. Persists full probability vectors (answers jsonb) and code-mapped stamps. Called after analyze-crop succeeds.';

COMMENT ON COLUMN public.jev_scan_results.stamp IS
  'Code-mapped decision stamp: look-here-first | caution | hold | insufficient | out-of-scope. Never invent — always derived from Jev probability vectors + product policy.';

COMMENT ON COLUMN public.jev_scan_results.answers IS
  'Full TypeSafe System One probability vectors: scope_noul, evidence_quality_score, syndrome_family_choice, optional same_story_noul. Includes confidence and probabilities for each answer.';

-- Index for lookups by assessment
CREATE INDEX idx_jev_scan_results_assessment_id ON public.jev_scan_results(assessment_id);

-- Enable RLS
ALTER TABLE public.jev_scan_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can view Jev results for their own assessments
CREATE POLICY "Users can view own jev scan results" ON public.jev_scan_results FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.assessments
        JOIN public.fields ON fields.id = assessments.field_id
        WHERE assessments.id = jev_scan_results.assessment_id 
        AND fields.user_id = auth.uid()
    )
);

-- Service role can insert (edge function persists after analyze-crop)
-- No INSERT policy for authenticated users — only service role writes
