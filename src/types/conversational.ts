/**
 * Conversational Form Type Definitions
 * Types for AI-powered conversational form interactions
 */

export type FormType = 'onboarding' | 'field_setup' | 'insurance_claim' | 'cooperative_invite';

export interface FormSession {
  id: string;
  user_id: string;
  form_type: FormType;
  status: 'in_progress' | 'completed' | 'abandoned';
  extracted_data?: Record<string, any>;
  completion_percentage?: number;
  created_at: string;
  updated_at?: string | null;
}

export interface FormMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface FormResponse {
  message: string;
  extracted_data?: Record<string, string | number | boolean | null>;
  completion_percentage?: number;
  next_question?: string;
  suggestions?: string[];
  beta_benefit_highlight?: string;
}

export interface FormContext {
  sessionId?: string;
  formType: FormType;
  currentData?: Record<string, string | number | boolean | null>;
  previousMessages?: FormMessage[];
}

export interface ConversationalFormSession {
  id: string;
  user_id: string;
  form_type: FormType;
  status: 'active' | 'completed' | 'abandoned';
  context_data?: Record<string, unknown>;
  extracted_data?: Record<string, unknown>;
  completion_percentage: number;
  started_at: string;
  completed_at?: string | null;
  abandoned_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

