import { supabase } from '@/integrations/supabase/client';
import type { DeltaContext } from '@/types';

export interface ConversationMemoryMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_snapshot?: {
    field_id?: string;
    assessment_id?: string;
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
      p_limit: limit,
      p_exclude_conversation_id: excludeConversationId || null,
    });

    if (error) {
      console.error('Error fetching conversation memory:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      conversation_id: item.conversation_id,
      role: (item.role as ConversationMemoryMessage['role']) || 'assistant',
      content: item.content,
      context_snapshot: item.context_snapshot as any,
      created_at: item.created_at,
      conversation_title: item.conversation_title,
    }));
  } catch (error) {
    console.error('Error in gatherConversationMemory:', error);
    return [];
  }
}

/**
 * Create context snapshot from current field context.
 * Store IDs only — never persist client-claimed health/crop/stress as fact
 * (those must be rebound server-side from owned rows when needed).
 */
export function createContextSnapshot(fieldContext: DeltaContext | null): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  if (fieldContext?.fieldId) {
    snapshot.field_id = fieldContext.fieldId;
  }
  if (fieldContext?.assessmentId || fieldContext?.recentAssessment?.id) {
    snapshot.assessment_id =
      fieldContext.assessmentId || fieldContext.recentAssessment?.id;
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
      // IDs only — never replay client-claimed health/crop invent as conversation fact.
      const snap = msg.context_snapshot;
      const contextInfo = snap?.field_id
        ? ` [Context: field ${String(snap.field_id).slice(0, 8)}…]`
        : '';
      
      formatted += `${msg.role === 'user' ? '👤' : '🤖'}: ${msg.content}${contextInfo}\n`;
    });
    
    formatted += '\n';
  });

  formatted += '\n**Instructions:** Reference previous conversations when relevant. If the user asks about something discussed before, acknowledge the previous conversation and build upon it.\n';

  return formatted;
}

