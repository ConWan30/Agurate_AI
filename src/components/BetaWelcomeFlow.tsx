import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Gift, 
  CheckCircle, 
  TrendingDown, 
  MessageSquare, 
  Headphones 
} from 'lucide-react';
import { toast } from 'sonner';

interface BetaWelcomeFlowProps {
  userId: string;
  onComplete?: () => void;
}

export function BetaWelcomeFlow({ userId, onComplete }: BetaWelcomeFlowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('beta_farmer, beta_welcome_shown, beta_signup_date')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: betaCount } = useQuery({
    queryKey: ['beta-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('beta_farmer', true);

      if (error) throw error;
      return count || 0;
    }
  });

  useEffect(() => {
    if (profile?.beta_farmer && !profile?.beta_welcome_shown) {
      setIsOpen(true);
    }
  }, [profile]);

  const handleGetStarted = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ beta_welcome_shown: true })
        .eq('id', userId);

      if (error) throw error;

      setIsOpen(false);
      toast.success('Welcome to AgurateAI! 🎉');
      
      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error marking beta welcome as shown:', error);
      toast.error('Failed to complete welcome flow');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-accent to-accent/50 border-2 border-primary shadow-glow"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Welcome to AgurateAI Beta</DialogTitle>
        <DialogDescription className="sr-only">
          Your beta benefits and what to expect during the beta period
        </DialogDescription>
        
        {/* Celebration Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground mb-4 animate-bounce">
            <Sparkles className="h-10 w-10" />
          </div>
          <h2 className="text-4xl font-heading font-bold text-foreground mb-2">
            Welcome to AgurateAI Beta! 🎉
          </h2>
          <p className="text-xl text-muted-foreground">
            You're Beta Farmer #{betaCount} of 100
          </p>
        </div>

        {/* Beta Benefits */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Your Beta Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-health-good flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-foreground">FREE Unlimited Access</p>
                <p className="text-sm text-muted-foreground">
                  All 17 features completely free during beta (6-12 months)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingDown className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-foreground">Lifetime 50% Discount</p>
                <p className="text-sm text-muted-foreground">
                  Lock in 50% off the published plan rate for life after beta
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-foreground">Shape Product Development</p>
                <p className="text-sm text-muted-foreground">
                  Your feedback directly influences new features
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Headphones className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-foreground">Direct Founder Support</p>
                <p className="text-sm text-muted-foreground">
                  Priority support and bug fixes during beta
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expectations */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">What to Expect During Beta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Features may evolve based on feedback</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Bug reports are encouraged (helps us improve)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>New features may be added during beta</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Beta ends when we reach 100 farmers or graduate to a public launch</span>
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex gap-3">
          <Button 
            onClick={handleGetStarted}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            Get Started →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
