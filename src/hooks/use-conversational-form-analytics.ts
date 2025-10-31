import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CompletionMetrics {
  form_type: string;
  completed: number;
  abandoned: number;
  total: number;
  completion_rate: number;
}

interface FeedbackMetrics {
  avg_rating: number;
  feedback_count: number;
  preferred_conversational: number;
  preferred_traditional: number;
}

export const useConversationalFormAnalytics = (days: number = 7) => {
  // Completion rates - removed as we'll use sessionStats instead
  const completionMetrics = null;
  const isLoadingCompletion = false;

  // Feedback ratings
  const { data: feedbackMetrics, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['conversational-forms-feedback', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('rating, feature_context')
        .eq('category', 'conversational-forms')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      const ratings = data.map(f => f.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const contexts = data
        .map(f => {
          try {
            return typeof f.feature_context === 'string' ? JSON.parse(f.feature_context) : f.feature_context;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const preferredConversational = contexts.filter(c => c?.preferredMethod === 'conversational').length;
      const preferredTraditional = contexts.filter(c => c?.preferredMethod === 'traditional').length;

      return {
        avg_rating: avgRating,
        feedback_count: data.length,
        preferred_conversational: preferredConversational,
        preferred_traditional: preferredTraditional
      } as FeedbackMetrics;
    }
  });

  // Session statistics
  const { data: sessionStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['conversational-forms-sessions', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversational_form_sessions')
        .select('form_type, status, started_at, completed_at')
        .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      const byFormType: Record<string, { completed: number; abandoned: number; total: number; avgTime: number }> = {};

      data.forEach(session => {
        if (!byFormType[session.form_type]) {
          byFormType[session.form_type] = { completed: 0, abandoned: 0, total: 0, avgTime: 0 };
        }

        byFormType[session.form_type].total++;
        
        if (session.status === 'completed') {
          byFormType[session.form_type].completed++;
          
          if (session.started_at && session.completed_at) {
            const timeMs = new Date(session.completed_at).getTime() - new Date(session.started_at).getTime();
            byFormType[session.form_type].avgTime += timeMs / 1000; // Convert to seconds
          }
        } else if (session.status === 'abandoned') {
          byFormType[session.form_type].abandoned++;
        }
      });

      // Calculate averages
      Object.keys(byFormType).forEach(formType => {
        if (byFormType[formType].completed > 0) {
          byFormType[formType].avgTime /= byFormType[formType].completed;
        }
      });

      return byFormType;
    }
  });

  return {
    completionMetrics,
    feedbackMetrics,
    sessionStats,
    isLoading: isLoadingCompletion || isLoadingFeedback || isLoadingStats
  };
};
