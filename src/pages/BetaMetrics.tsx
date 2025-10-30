import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Star, MessageSquare, Award, Trophy, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface BetaMetrics {
  total_signups: number;
  active_users_7d: number;
  active_users_30d: number;
  total_assessments: number;
  avg_rating: number;
  feedback_count: number;
  completed_onboarding: number;
  public_success_stories: number;
}

export default function BetaMetrics() {
  const [metrics, setMetrics] = useState<BetaMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();

    // Real-time updates
    const channel = supabase
      .channel('beta-metrics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_metrics')
        .select('*')
        .single();

      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching beta metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const BETA_LIMIT = 100;
  const signupProgress = metrics ? (metrics.total_signups / BETA_LIMIT) * 100 : 0;
  const onboardingRate = metrics && metrics.total_signups > 0 
    ? (metrics.completed_onboarding / metrics.total_signups) * 100 
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-accent rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-accent rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-display font-bold">Beta Program Metrics</h1>
          </div>
          <p className="text-muted-foreground">Real-time dashboard of beta program performance</p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Beta Progress */}
      <Card className="mb-8 border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Beta Program Status
          </CardTitle>
          <CardDescription>Progress toward 100 beta farmer goal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  <AnimatedCounter value={metrics?.total_signups || 0} duration={1500} />
                  <span className="text-muted-foreground text-xl">/{BETA_LIMIT}</span>
                </div>
                <p className="text-sm text-muted-foreground">Beta Farmers Signed Up</p>
              </div>
              <Badge 
                variant={signupProgress >= 80 ? "destructive" : "default"}
                className="text-lg px-4 py-2"
              >
                {(100 - signupProgress).toFixed(0)}% Available
              </Badge>
            </div>
            <Progress value={signupProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 hover:border-primary transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Users (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <AnimatedCounter value={metrics?.active_users_7d || 0} duration={1500} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics && metrics.total_signups > 0 
                ? `${((metrics.active_users_7d / metrics.total_signups) * 100).toFixed(0)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Users (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <AnimatedCounter value={metrics?.active_users_30d || 0} duration={1500} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics && metrics.total_signups > 0 
                ? `${((metrics.active_users_30d / metrics.total_signups) * 100).toFixed(0)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <AnimatedCounter value={metrics?.total_assessments || 0} duration={1500} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics && metrics.active_users_30d > 0 
                ? `${(metrics.total_assessments / metrics.active_users_30d).toFixed(1)} per farmer`
                : '0 per farmer'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <AnimatedCounter value={metrics?.avg_rating || 0} duration={1500} decimals={1} />
              <span className="text-lg text-muted-foreground">/5.0</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              From {metrics?.feedback_count || 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Onboarding Completion
            </CardTitle>
            <CardDescription>Farmers who completed onboarding wizard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  <AnimatedCounter value={metrics?.completed_onboarding || 0} duration={1500} />
                  <span className="text-muted-foreground text-xl">/{metrics?.total_signups || 0}</span>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {onboardingRate.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={onboardingRate} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {onboardingRate >= 80 ? 'Excellent completion rate!' : 'Room for improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Success Stories
            </CardTitle>
            <CardDescription>Public success stories shared by farmers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">
                <AnimatedCounter value={metrics?.public_success_stories || 0} duration={1500} />
              </div>
              <p className="text-sm text-muted-foreground">
                {metrics && metrics.total_signups > 0
                  ? `${((metrics.public_success_stories / metrics.total_signups) * 100).toFixed(1)}% share rate`
                  : '0% share rate'}
              </p>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to="/community-insights">
                  View Success Stories
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
