-- ============================================================================
-- MIGRATION: Create Conversational Form System Tables
-- PURPOSE: Enable Delta Intelligence conversational forms for field registration,
--          insurance claims, and other interactive form workflows
-- ============================================================================

-- Create conversational form sessions table
CREATE TABLE IF NOT EXISTS public.conversational_form_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    form_type TEXT NOT NULL CHECK (form_type IN ('field-registration', 'insurance-claim', 'conservation-practices', 'onboarding', 'feedback', 'cooperative-application')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    context_data JSONB DEFAULT '{}'::JSONB,
    extracted_data JSONB DEFAULT '{}'::JSONB,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    abandoned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversational form messages table
CREATE TABLE IF NOT EXISTS public.conversational_form_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.conversational_form_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    field_mapping JSONB,
    validation_status TEXT CHECK (validation_status IN ('pending', 'valid', 'invalid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form completion analytics table
CREATE TABLE IF NOT EXISTS public.form_completion_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.conversational_form_sessions(id) ON DELETE CASCADE NOT NULL,
    form_type TEXT NOT NULL,
    completion_time_seconds INTEGER,
    message_count INTEGER,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.conversational_form_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversational_form_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_completion_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversational_form_sessions
CREATE POLICY "Users can view their own form sessions" ON public.conversational_form_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own form sessions" ON public.conversational_form_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form sessions" ON public.conversational_form_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for conversational_form_messages
CREATE POLICY "Users can view messages from their sessions" ON public.conversational_form_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversational_form_sessions
            WHERE conversational_form_sessions.id = conversational_form_messages.session_id
            AND conversational_form_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their sessions" ON public.conversational_form_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversational_form_sessions
            WHERE conversational_form_sessions.id = conversational_form_messages.session_id
            AND conversational_form_sessions.user_id = auth.uid()
        )
    );

-- RLS Policies for form_completion_analytics
CREATE POLICY "Users can view their own analytics" ON public.form_completion_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversational_form_sessions
            WHERE conversational_form_sessions.id = form_completion_analytics.session_id
            AND conversational_form_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert analytics" ON public.form_completion_analytics
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_sessions_user_id ON public.conversational_form_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_sessions_status ON public.conversational_form_sessions(status);
CREATE INDEX IF NOT EXISTS idx_form_messages_session_id ON public.conversational_form_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_session_id ON public.form_completion_analytics(session_id);

-- ============================================================================