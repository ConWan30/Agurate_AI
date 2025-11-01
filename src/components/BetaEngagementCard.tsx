import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Target, Zap, TrendingUp } from "lucide-react";

export function BetaEngagementCard() {
  const navigate = useNavigate();

  const { data: engagementData } = useQuery({
    queryKey: ['beta-engagement'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch tutorial completions
      const { data: completions } = await supabase
        .from('tutorial_completions')
        .select('tutorial_id')
        .eq('user_id', user.id)
        .eq('action', 'completed');

      // Fetch recent assessments
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id')
        .gte('analyzed_at', oneWeekAgo.toISOString());

      // Count unique features used (approximation based on page visits)
      const tutorialSet = new Set(completions?.map(c => c.tutorial_id) || []);
      const featuresUsed = tutorialSet.size;

      return {
        tutorialsCompleted: featuresUsed,
        totalTutorials: 10,
        scansThisWeek: assessments?.length || 0,
        featuresUsed
      };
    }
  });

  if (!engagementData) return null;

  const progressPercentage = (engagementData.tutorialsCompleted / engagementData.totalTutorials) * 100;
  const isAllExplored = engagementData.tutorialsCompleted === engagementData.totalTutorials;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Beta Journey
            </CardTitle>
            <CardDescription>
              Track your progress as an AgurateAI pioneer
            </CardDescription>
          </div>
          {isAllExplored && (
            <Badge className="bg-primary text-primary-foreground">
              🌟 Master
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar: Features explored */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Features Explored</span>
            <span className="text-muted-foreground">
              {engagementData.tutorialsCompleted}/{engagementData.totalTutorials}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Activity stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold">{engagementData.scansThisWeek}</p>
            </div>
            <p className="text-xs text-muted-foreground">Scans This Week</p>
          </div>
          <div className="bg-card border rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold">{engagementData.featuresUsed}/10</p>
            </div>
            <p className="text-xs text-muted-foreground">Tools Mastered</p>
          </div>
        </div>

        {/* Achievement badges */}
        <div className="flex gap-2 flex-wrap">
          {engagementData.scansThisWeek >= 5 && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              🔥 Weekly Scanner
            </Badge>
          )}
          {engagementData.tutorialsCompleted >= 5 && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              🎓 Tutorial Pro
            </Badge>
          )}
          {isAllExplored && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              ⭐ Feature Master
            </Badge>
          )}
        </div>

        {/* Call to action for incomplete tutorials */}
        {!isAllExplored && (
          <Button 
            variant="outline" 
            className="w-full border-primary/50 hover:bg-primary/10"
            onClick={() => navigate('/tutorials')}
          >
            Explore {engagementData.totalTutorials - engagementData.tutorialsCompleted} More Features →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
