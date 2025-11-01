import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export const useTutorialTracking = (tutorialId: string) => {
  const trackEvent = useCallback(async (
    stepId: string, 
    action: 'started' | 'completed' | 'skipped' | 'abandoned',
    timeSpent?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('tutorial_completions').insert({
        tutorial_id: tutorialId,
        step_id: stepId,
        action,
        time_spent_seconds: timeSpent,
        user_id: user.id
      });
    } catch (error) {
      console.error('Tutorial tracking error:', error);
    }
  }, [tutorialId]);

  return { trackEvent };
};
