import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function useDeltaConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations list
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('delta_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('delta_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load conversation');
    }
  };

  const createConversation = async (firstMessage: string): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate title from first message (first 50 chars)
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');

      const { data, error } = await supabase
        .from('delta_conversations')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;

      await loadConversations();
      setCurrentConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const saveMessage = async (
    conversationId: string, 
    role: 'user' | 'assistant', 
    content: string,
    contextSnapshot?: Record<string, unknown>
  ) => {
    try {
      if (role === 'assistant') {
        // Assistant rows are service-role only (20260914260000). Persist via edge.
        const { error } = await supabase.functions.invoke('delta-chat', {
          body: {
            action: 'persist_assistant',
            conversationId,
            content,
            contextSnapshot: contextSnapshot || {},
          },
        });
        if (error) throw error;
      } else {
        const { data: savedUserMsg, error } = await supabase
          .from('delta_messages')
          .insert({ 
            conversation_id: conversationId, 
            role: 'user', 
            content,
            context_snapshot: contextSnapshot || {}
          })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!savedUserMsg) {
          throw new Error('User message was not saved (insert returned no row or not permitted)');
        }
      }

      await supabase
        .from('delta_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      await loadConversations();
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { data: deleted, error } = await supabase
        .from('delta_conversations')
        .delete()
        .eq('id', conversationId)
        .select('id');

      if (error) throw error;
      if (!deleted?.length) {
        throw new Error('Conversation was not deleted (no matching row or delete not permitted)');
      }

      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }

      await loadConversations();
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { data: updated, error } = await supabase
        .from('delta_conversations')
        .update({ title })
        .eq('id', conversationId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) {
        throw new Error('Conversation title was not updated (no matching row or update not permitted)');
      }

      if (error) throw error;
      await loadConversations();
    } catch (error) {
      console.error('Error updating title:', error);
      throw error;
    }
  };

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    setMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    startNewConversation,
    selectConversation: setCurrentConversationId,
    updateConversationTitle,
  };
}
