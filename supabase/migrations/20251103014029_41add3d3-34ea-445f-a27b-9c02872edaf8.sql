-- ============================================================================
-- SECURITY FIX: Create request_logs table for rate limiting
-- DATE: 2025-11-03
-- PURPOSE: Enable per-user rate limiting for edge functions to prevent abuse
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Add index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_request_logs_user_time 
ON public.request_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_logs_function 
ON public.request_logs(function_name, created_at DESC);

-- Enable RLS
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own request logs
CREATE POLICY "Users can view own request logs"
ON public.request_logs
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert request logs
CREATE POLICY "System can insert request logs"
ON public.request_logs
FOR INSERT
WITH CHECK (true);

-- Auto-cleanup old logs (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_request_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.request_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;