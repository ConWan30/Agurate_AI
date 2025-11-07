import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FormType, ConversationalFormSession, FormMessage, FormContext } from '@/types/conversational';

export const useConversationalForm = (formType: FormType, contextData?: Record<string, unknown>) => {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('conversational_form_sessions')
        .insert({
          user_id: user.id,
          form_type: formType,
          status: 'active',
          context_data: contextData || {},
          extracted_data: {},
          completion_percentage: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      
      // Insert initial system message
      supabase
        .from('conversational_form_messages')
        .insert({
          session_id: data.id,
          role: 'assistant',
          content: getInitialMessage(formType)
        })
        .then(() => {});
    },
    onError: (error) => {
      console.error('Failed to create session:', error);
      toast.error('Failed to start conversation');
    }
  });

  // Get session data
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['conversational-form-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('conversational_form_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as ConversationalFormSession;
    },
    enabled: !!sessionId
  });

  // Get messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['conversational-form-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('conversational_form_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as FormMessage[];
    },
    enabled: !!sessionId
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!sessionId) throw new Error('No active session');

      const { data, error } = await supabase.functions.invoke('conversational-form', {
        body: {
          sessionId,
          message,
          formType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log('✅ Message sent successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['conversational-form-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['conversational-form-messages', sessionId] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  });

  // Complete session
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No active session');

      const { data, error } = await supabase
        .from('conversational_form_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Form completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['conversational-form-session', sessionId] });
    }
  });

  // Abandon session
  const abandonSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No active session');

      const { error } = await supabase
        .from('conversational_form_sessions')
        .update({
          status: 'abandoned',
          abandoned_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    }
  });

  return {
    // Session management
    session,
    sessionId,
    isLoadingSession,
    createSession: createSessionMutation.mutate,
    isCreatingSession: createSessionMutation.isPending,
    
    // Messages
    messages,
    isLoadingMessages,
    sendMessage: (message: string) => {
      console.log('📤 Sending message to edge function:', { sessionId, message });
      sendMessageMutation.mutate(message);
    },
    isSendingMessage: sendMessageMutation.isPending,
    
    // Completion
    completeSession: completeSessionMutation.mutate,
    isCompletingSession: completeSessionMutation.isPending,
    abandonSession: abandonSessionMutation.mutate,
    
    // Computed values
    isComplete: session?.completion_percentage === 100,
    completionPercentage: session?.completion_percentage || 0,
    extractedData: session?.extracted_data || {}
  };
};

// Helper function for initial messages
function getInitialMessage(formType: FormType): string {
  const messages: Record<FormType, string> = {
    'field-registration': "👋 Hey there! I'm Delta Intelligence, and I'm here to help you register a new field. Let's make this quick and easy. What would you like to name this field?",
    'insurance-claim': "I'm here to help you document your insurance claim. First, I'm sorry to hear about the damage to your crop. Let's work together to get this documented properly. Which field was affected?",
    'conservation-practices': "Great to see you're interested in conservation practices! These can really help your soil health and reduce costs over time. Which field would you like to track practices for?",
    'onboarding': "Welcome to AgurateAI! I'm Delta Intelligence, your AI farming advisor. Let's get you set up. First, what's your farm name?",
    'feedback': "Thanks for taking the time to share your feedback! Your input helps us improve AgurateAI for all Louisiana Delta farmers. What feature would you like to give feedback on?",
    'cooperative-application': "Excellent! Cooperatives help farmers share knowledge and reduce costs through bulk purchasing. Let's get your application started. What's the name of your farm?"
  };

  return messages[formType] || "Hello! I'm here to help you with this form. Let's get started!";
}