import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp } from "lucide-react";

export function BetaCountdown() {
  const [signupCount, setSignupCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const BETA_LIMIT = 100;
  const spotsRemaining = Math.max(0, BETA_LIMIT - signupCount);
  const percentFilled = (signupCount / BETA_LIMIT) * 100;
  const isNearlyFull = spotsRemaining <= 20;
  const isFull = spotsRemaining === 0;

  useEffect(() => {
    fetchBetaCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('beta-signups')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'beta_farmer=eq.true'
        },
        () => {
          fetchBetaCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBetaCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_beta_farmer_count');

      if (error) throw error;
      setSignupCount(typeof data === 'number' ? data : 0);
    } catch (error) {
      console.error('Error fetching beta count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-accent rounded w-3/4"></div>
            <div className="h-2 bg-accent rounded"></div>
            <div className="h-3 bg-accent rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isFull) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <Badge variant="destructive" className="text-sm">
              Beta Program Full
            </Badge>
            <p className="text-sm text-muted-foreground">
              We've reached 100 beta farmers! Join the waitlist to be notified when we launch.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${isNearlyFull ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className={`h-5 w-5 ${isNearlyFull ? 'text-destructive' : 'text-primary'}`} />
              <h3 className="font-semibold">Beta Program Status</h3>
            </div>
            <Badge 
              variant={isNearlyFull ? "destructive" : "default"}
              className="font-bold"
            >
              {spotsRemaining} spots left
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={percentFilled} 
              className={`h-3 ${isNearlyFull ? '[&>div]:bg-destructive' : ''}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{signupCount} beta farmers</span>
              <span>{BETA_LIMIT} limit</span>
            </div>
          </div>

          {/* Urgency Message */}
          {isNearlyFull && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Spots Filling Fast!
                </p>
                <p className="text-xs text-muted-foreground">
                  Closed beta enrollment is limited. Beta farmers may keep 50% off the published plan rate after launch.
                </p>
              </div>
            </div>
          )}

          {/* Benefits Reminder */}
          {!isNearlyFull && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Beta Benefits:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Free access during the closed beta</li>
                <li>Possible 50% off published rate when paid plans launch</li>
                <li>Direct founder support</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
