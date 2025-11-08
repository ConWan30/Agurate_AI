import { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import type { DeltaContext } from '@/types/delta';

interface PredictiveQuestionsProps {
  fieldContext?: DeltaContext | null;
  onSelectQuestion: (question: string) => void;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export const PredictiveQuestions = memo(function PredictiveQuestions({ 
  fieldContext, 
  onSelectQuestion,
  conversationHistory = []
}: PredictiveQuestionsProps) {
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate contextual questions based on field data (fallback)
  const generateFallbackQuestions = () => {
    const questions = [];
    
    if (fieldContext?.recentAssessment) {
      const healthScore = fieldContext.healthScore || 100;
      const cropType = fieldContext.cropType || 'crops';
      
      if (healthScore < 70) {
        questions.push({
          q: `What's causing the stress in my ${cropType}?`,
          icon: '🔍'
        });
        questions.push({
          q: 'Should I treat immediately or wait?',
          icon: '⏰'
        });
        questions.push({
          q: 'How much will treatment cost vs. potential loss?',
          icon: '💰'
        });
        questions.push({
          q: 'Will weather affect my treatment timing?',
          icon: '🌦️'
        });
      } else if (healthScore < 85) {
        questions.push({
          q: `Is my ${cropType} recovery on track?`,
          icon: '📈'
        });
        questions.push({
          q: 'Do I need additional monitoring?',
          icon: '👁️'
        });
        questions.push({
          q: 'What preventive measures should I take?',
          icon: '🛡️'
        });
      } else {
        questions.push({
          q: `What should I monitor in my ${cropType} this week?`,
          icon: '📋'
        });
        questions.push({
          q: 'Any upcoming weather concerns?',
          icon: '🌤️'
        });
        questions.push({
          q: 'Best practices for maintaining health?',
          icon: '✅'
        });
      }
    } else {
      // Default questions when no field context
      questions.push({
        q: 'What rice varieties work best in Morehouse Parish?',
        icon: '🌾'
      });
      questions.push({
        q: 'How do I identify soybean rust early?',
        icon: '🔍'
      });
      questions.push({
        q: 'Best cotton planting practices for Delta soils?',
        icon: '☁️'
      });
      questions.push({
        q: 'When should I apply nitrogen to corn fields?',
        icon: '🌽'
      });
    }
    
    return questions.slice(0, 4);
  };

  // Fetch AI-generated predictive questions
  useEffect(() => {
    const fetchPredictiveQuestions = async () => {
      if (!fieldContext?.recentAssessment) {
        // Use fallback for non-field context
        return;
      }

      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-predictive-questions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              fieldContext,
              conversationHistory: conversationHistory.slice(-5), // Last 5 messages
              maxQuestions: 4,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            setAiQuestions(data.questions);
          }
        }
      } catch (error) {
        console.error('Error fetching predictive questions:', error);
        // Fallback to default questions on error
      } finally {
        setLoading(false);
      }
    };

    fetchPredictiveQuestions();
  }, [fieldContext, conversationHistory.length]);

  // Use AI questions if available, otherwise fallback
  const fallbackQuestions = generateFallbackQuestions();
  const questionsToShow = aiQuestions.length > 0 
    ? aiQuestions.map((q, idx) => ({
        q,
        icon: fallbackQuestions[idx]?.icon || '💡'
      }))
    : fallbackQuestions;

  return (
    <div className="px-6 py-4 border-t bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <p className="text-sm font-medium text-foreground">
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin inline" />
              Generating questions...
            </>
          ) : fieldContext?.recentAssessment ? (
            aiQuestions.length > 0 ? 'AI-suggested questions' : 'Based on your field status'
          ) : (
            'Quick Start Questions'
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {questionsToShow.map((item, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => onSelectQuestion(item.q)}
            disabled={loading}
            className="text-xs justify-start h-auto py-3 px-4 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
          >
            <span className="mr-2 text-base">{item.icon}</span>
            <span className="text-left line-clamp-2">{item.q}</span>
          </Button>
        ))}
      </div>
    </div>
  );
});
