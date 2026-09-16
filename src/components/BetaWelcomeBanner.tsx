import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function BetaWelcomeBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBannerStatus();
  }, []);

  const checkBannerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('beta_welcome_dismissed')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsDismissed(data?.beta_welcome_dismissed || false);
    } catch (error) {
      console.error('Error checking banner status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ beta_welcome_dismissed: true })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) {
        throw new Error('Welcome banner was not dismissed (no matching row or update not permitted)');
      }

      setIsDismissed(true);
    } catch (error) {
      console.error('Error dismissing banner:', error);
    }
  };

  if (loading || isDismissed) return null;

  return (
    <Alert className="border-primary/50 bg-primary/5 mb-6">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-medium text-sm">
            Welcome to AgurateAI
          </p>
          <p className="text-xs text-muted-foreground">
            AgurateAI is publicly accessible as an agricultural decision aid. Your feedback helps improve the product, but crop observations are not diagnoses or guaranteed outcomes.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
