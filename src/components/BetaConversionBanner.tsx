import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function BetaConversionBanner() {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [betaEndDate, setBetaEndDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    checkBetaStatus();
  }, []);

  const checkBetaStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('beta_signup_date')
        .eq('id', user.id)
        .single();

      if (profile?.beta_signup_date) {
        // Beta period: 6 months from signup
        const signupDate = new Date(profile.beta_signup_date);
        const endDate = new Date(signupDate);
        endDate.setMonth(endDate.getMonth() + 6);
        
        setBetaEndDate(endDate);
        
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
      }
    } catch (error) {
      console.error('Error checking beta status:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage (could also save to profile)
    localStorage.setItem('beta-conversion-dismissed', 'true');
  };

  const handleClaimDiscount = () => {
    toast.message("Billing checkout is not open yet", {
      description: "Email support@agurateai.com to join the paid-plan waitlist.",
    });
    window.location.href = "mailto:support@agurateai.com?subject=Beta%20Pricing%20Waitlist";
  };

  const handleLearnMore = () => {
    // Navigate to pricing/how it works page
    navigate('/how-it-works');
  };

  // Don't show if dismissed or if more than 30 days remaining
  if (isDismissed || daysRemaining > 30 || daysRemaining < 0) {
    return null;
  }

  // Show urgency if less than 14 days remaining
  const isUrgent = daysRemaining <= 14;

  return (
    <Card className={`border-2 ${isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20 bg-primary/5'} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      
      <CardContent className="pt-6 relative z-10">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isUrgent ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <Sparkles className={`h-6 w-6 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">Your Beta Period is Ending Soon!</h3>
                <Badge variant={isUrgent ? "destructive" : "default"} className="text-xs">
                  {daysRemaining} days left
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Keep 50% off the published plan rate before beta ends on{' '}
                <span className="font-semibold text-foreground">
                  {betaEndDate?.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">50% off published rate</p>
                  <p className="text-xs text-muted-foreground">50% off the published plan rate after paid plans launch</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Beta Perks Included</p>
                  <p className="text-xs text-muted-foreground">Early access to all new features</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={handleClaimDiscount}
                className={`gap-2 ${isUrgent ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              >
                <Sparkles className="h-4 w-4" />
                Join pricing waitlist
              </Button>
              <Button variant="outline" onClick={handleLearnMore}>
                Learn More
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              💚 Thanks for being one of our first 100 beta farmers!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
