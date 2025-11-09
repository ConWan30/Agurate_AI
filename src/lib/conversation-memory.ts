import { supabase } from '@/integrations/supabase/client';
import type { DeltaContext } from '@/types';

export interface ConversationMemoryMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_snapshot?: {
    field_name?: string;
    crop_type?: string;
    health_score?: number;
    stress_level?: string;
    weather?: {
      temp?: number;
      precipitation?: number;
    };
    timestamp?: string;
  };
  created_at: string;
  conversation_title?: string;
}

/**
 * Gather conversation memory context for AI
 * Returns last N messages across all conversations (excluding current conversation)
 */
export async function gatherConversationMemory(
  userId: string,
  excludeConversationId?: string,
  limit: number = 50
): Promise<ConversationMemoryMessage[]> {
  try {
    const { data, error } = await supabase.rpc('get_conversation_memory', {
      p_user_id: userId,
      p_conversation_id: excludeConversationId || '',
    });

    if (error) {
      console.error('Error fetching conversation memory:', error);
      return [];
    }

    // Map DB response to ConversationMemoryMessage format
    return (data || []).map((item: any) => ({
      id: item.id,
      conversation_id: '',  // Not returned by RPC
      role: 'assistant' as const,
      content: JSON.stringify(item.context_data),
      context_snapshot: item.context_data as any,
      created_at: item.last_referenced_at,
    }));
  } catch (error) {
    console.error('Error in gatherConversationMemory:', error);
    return [];
  }
}

/**
 * Create context snapshot from current field context
 */
export function createContextSnapshot(fieldContext: DeltaContext | null): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  if (fieldContext?.recentAssessment) {
    snapshot.health_score = fieldContext.recentAssessment.health_score;
    snapshot.stress_level = fieldContext.recentAssessment.stress_level;
    snapshot.analyzed_at = fieldContext.recentAssessment.analyzed_at;
  }

  if (fieldContext?.cropType) {
    snapshot.crop_type = fieldContext.cropType;
  }

  if (fieldContext?.healthScore) {
    snapshot.health_score = fieldContext.healthScore;
  }

  return snapshot;
}

/**
 * Format conversation memory for AI prompt
 */
export function formatConversationMemoryForAI(
  memory: ConversationMemoryMessage[]
): string {
  if (memory.length === 0) {
    return '';
  }

  // Group by conversation for better context
  const groupedByConversation = memory.reduce((acc, msg) => {
    const convId = msg.conversation_id;
    if (!acc[convId]) {
      acc[convId] = {
        title: msg.conversation_title || 'Previous conversation',
        messages: [],
      };
    }
    acc[convId].messages.push(msg);
    return acc;
  }, {} as Record<string, { title: string; messages: ConversationMemoryMessage[] }>);

  let formatted = '\n\n## CONVERSATION MEMORY (Previous Interactions)\n';
  formatted += 'The following are recent conversations that may provide context for the current question:\n\n';

  // Format each conversation group
  Object.entries(groupedByConversation).forEach(([convId, group]) => {
    formatted += `### ${group.title}\n`;
    
    group.messages.forEach((msg) => {
      const contextInfo = msg.context_snapshot
        ? ` [Context: ${msg.context_snapshot.field_name || 'general'}, ${msg.context_snapshot.crop_type || ''}${msg.context_snapshot.health_score ? `, ${msg.context_snapshot.health_score}% health` : ''}]`
        : '';
      
      formatted += `${msg.role === 'user' ? '👤' : '🤖'}: ${msg.content}${contextInfo}\n`;
    });
    
    formatted += '\n';
  });

  formatted += '\n**Instructions:** Reference previous conversations when relevant. If the user asks about something discussed before, acknowledge the previous conversation and build upon it.\n';

  return formatted;
}

