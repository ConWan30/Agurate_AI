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

      const { data: saved, error } = await supabase
        .from('tutorial_completions')
        .insert({
          tutorial_id: tutorialId,
          step_id: stepId,
          action,
          time_spent_seconds: timeSpent,
          user_id: user.id
        })
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!saved) {
        throw new Error('Tutorial event was not saved (insert returned no row or not permitted)');
      }
    } catch (error) {
      console.error('Tutorial tracking error:', error);
    }
  }, [tutorialId]);

  return { trackEvent };
};
