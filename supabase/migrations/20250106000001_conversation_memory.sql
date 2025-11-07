-- Conversation Memory Enhancement
-- Adds context snapshots to messages for long-term memory

-- Add context_snapshot column to delta_messages
ALTER TABLE public.delta_messages 
ADD COLUMN IF NOT EXISTS context_snapshot JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_delta_messages_context ON public.delta_messages(context_snapshot) WHERE context_snapshot != '{}'::jsonb;

-- Create index for conversation history queries
CREATE INDEX IF NOT EXISTS idx_delta_messages_user_created ON public.delta_messages(conversation_id, created_at DESC);

-- Function to get conversation memory (last N messages across all conversations)
CREATE OR REPLACE FUNCTION get_conversation_memory(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_exclude_conversation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  role TEXT,
  content TEXT,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ,
  conversation_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.id,
    dm.conversation_id,
    dm.role,
    dm.content,
    dm.context_snapshot,
    dm.created_at,
    dc.title as conversation_title
  FROM public.delta_messages dm
  JOIN public.delta_conversations dc ON dm.conversation_id = dc.id
  WHERE dc.user_id = p_user_id
    AND (p_exclude_conversation_id IS NULL OR dm.conversation_id != p_exclude_conversation_id)
  ORDER BY dm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_conversation_memory(UUID, INTEGER, UUID) TO authenticated;

-- View for conversation memory summary
CREATE OR REPLACE VIEW conversation_memory_summary AS
SELECT 
  dc.user_id,
  dc.id as conversation_id,
  dc.title,
  COUNT(dm.id) as message_count,
  MAX(dm.created_at) as last_message_at,
  MIN(dm.created_at) as first_message_at
FROM public.delta_conversations dc
LEFT JOIN public.delta_messages dm ON dc.id = dm.conversation_id
GROUP BY dc.id, dc.user_id, dc.title;

-- Grant access
GRANT SELECT ON conversation_memory_summary TO authenticated;

