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

      await supabase
        .from('profiles')
        .update({ beta_welcome_dismissed: true })
        .eq('id', user.id);

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
            🎉 Welcome to the AgurateAI Beta Program!
          </p>
          <p className="text-xs text-muted-foreground">
            You're in the Louisiana closed beta with free access during the beta period. 
            Your feedback shapes the future of precision agriculture. Plus, you've locked in a 
            <span className="font-semibold text-primary"> 50% off the published plan rate</span> when we launch paid plans.
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
