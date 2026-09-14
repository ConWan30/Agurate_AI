/**
 * Delta Intelligence Type Definitions
 * Types for Delta Intelligence AI chat and conversations
 */

export interface DeltaMessage {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  created_at?: string;
}

export interface DeltaConversation {
  id: string;
  user_id: string;
  title?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface DeltaContext {
  fieldId?: string | null;
  assessmentId?: string | null;
  recentAssessment?: {
    id?: string;
    health_score?: number;
    stress_level?: string;
    analyzed_at?: string;
  } | null;
  cropType?: string | null;
  healthScore?: number | null;
}

export interface DeltaChatRequest {
  messages: DeltaMessage[];
  unifiedContext?: string | null;
  imageUrl?: string | null;
}

export interface DeltaChatResponse {
  content: string;
  stream?: boolean;
}

