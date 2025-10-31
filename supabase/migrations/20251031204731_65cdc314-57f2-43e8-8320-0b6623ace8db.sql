-- Fix RLS policies for conversational forms

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own form sessions" ON conversational_form_sessions;
DROP POLICY IF EXISTS "Users can update their own form sessions" ON conversational_form_sessions;
DROP POLICY IF EXISTS "Users can view their own form sessions" ON conversational_form_sessions;
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON conversational_form_messages;
DROP POLICY IF EXISTS "Users can create messages in their sessions" ON conversational_form_messages;

-- Create proper policies for conversational_form_sessions
CREATE POLICY "Users can create their own form sessions" 
  ON conversational_form_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own form sessions" 
  ON conversational_form_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own form sessions" 
  ON conversational_form_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create proper policies for conversational_form_messages
CREATE POLICY "Users can view messages from their sessions" 
  ON conversational_form_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversational_form_sessions
      WHERE conversational_form_sessions.id = conversational_form_messages.session_id
      AND conversational_form_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions" 
  ON conversational_form_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversational_form_sessions
      WHERE conversational_form_sessions.id = conversational_form_messages.session_id
      AND conversational_form_sessions.user_id = auth.uid()
    )
  );