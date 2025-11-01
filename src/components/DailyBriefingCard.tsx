import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Sunrise, TrendingUp, AlertTriangle, CheckCircle2, Droplets, Thermometer, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface BriefingData {
  date: string;
  fieldsSummary: {
    total: number;
    healthy: number;
    needingAttention: number;
    critical: number;
  };
  topPriorities: Array<{
    fieldName: string;
    fieldId: string;
    issue: string;
    urgency: 'high' | 'medium' | 'low';
    action: string;
  }>;
  weatherInsights: {
    temperature: number;
    precipitation: number;
    recommendation: string;
  };
  achievements: string[];
}

export function DailyBriefingCard() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateDailyBriefing();
  }, []);

  const generateDailyBriefing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch fields and recent assessments
      const { data: fields } = await supabase
        .from('fields')
        .select('id, name, crop_type')
        .eq('user_id', user.id);

      if (!fields || fields.length === 0) {
        setLoading(false);
        return;
      }

      // Get latest assessment for each field
      const fieldAssessments = await Promise.all(
        fields.map(async (field) => {
          const { data: assessment } = await supabase
            .from('assessments')
            .select('health_score, stress_level, analyzed_at')
            .eq('field_id', field.id)
            .order('analyzed_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...field,
            latestAssessment: assessment
          };
        })
      );

      // Calculate field summary
      const healthyCount = fieldAssessments.filter(f => 
        f.latestAssessment?.health_score >= 75
      ).length;
      const needingAttentionCount = fieldAssessments.filter(f => 
        f.latestAssessment && f.latestAssessment.health_score >= 50 && f.latestAssessment.health_score < 75
      ).length;
      const criticalCount = fieldAssessments.filter(f => 
        f.latestAssessment && f.latestAssessment.health_score < 50
      ).length;

      // Generate priorities
      const priorities = fieldAssessments
        .filter(f => f.latestAssessment && f.latestAssessment.health_score < 75)
        .map(field => ({
          fieldName: field.name,
          fieldId: field.id,
          issue: field.latestAssessment!.stress_level === 'severe' 
            ? `Severe stress detected (${field.latestAssessment!.health_score}% health)`
            : `Moderate stress (${field.latestAssessment!.health_score}% health)`,
          urgency: field.latestAssessment!.health_score < 50 ? 'high' as const : 'medium' as const,
          action: field.latestAssessment!.health_score < 50 
            ? 'Immediate inspection recommended'
            : 'Monitor closely, consider treatment'
        }))
        .sort((a, b) => {
          const urgencyOrder = { high: 0, medium: 1, low: 2 };
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        })
        .slice(0, 3);

      // Mock weather insights (in production, fetch from weather API)
      const weatherInsights = {
        temperature: 87,
        precipitation: 0.3,
        recommendation: 'Warm and dry conditions. Consider irrigation for stressed fields.'
      };

      // Generate achievements
      const achievements = [];
      if (healthyCount > 0) {
        achievements.push(`${healthyCount} field${healthyCount > 1 ? 's' : ''} in excellent health`);
      }
      if (criticalCount === 0) {
        achievements.push('No critical issues detected');
      }

      setBriefing({
        date: format(new Date(), 'MMMM d, yyyy'),
        fieldsSummary: {
          total: fields.length,
          healthy: healthyCount,
          needingAttention: needingAttentionCount,
          critical: criticalCount
        },
        topPriorities: priorities,
        weatherInsights,
        achievements
      });
    } catch (error) {
      console.error('Error generating daily briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="field-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle>Loading daily briefing...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!briefing) {
    return null;
  }

  return (
    <Card className="field-card border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow">
              <Sunrise className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Good Morning! ☀️</CardTitle>
              <CardDescription>{briefing.date}</CardDescription>
            </div>
          </div>
          <Badge variant="default" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Daily Briefing
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fields Summary */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Field Status Overview</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{briefing.fieldsSummary.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-2xl font-bold text-primary">{briefing.fieldsSummary.healthy}</div>
              <div className="text-xs text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-health-moderate/10 border border-health-moderate/20">
              <div className="text-2xl font-bold text-health-moderate">{briefing.fieldsSummary.needingAttention}</div>
              <div className="text-xs text-muted-foreground">Attention</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="text-2xl font-bold text-destructive">{briefing.fieldsSummary.critical}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
          </div>
        </div>

        {/* Top Priorities */}
        {briefing.topPriorities.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Today's Priorities</h3>
            <div className="space-y-2">
              {briefing.topPriorities.map((priority, idx) => (
                <Link 
                  key={idx}
                  to={`/fields`}
                  className="block group"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <div className={`mt-1 ${
                      priority.urgency === 'high' ? 'text-destructive' : 'text-health-moderate'
                    }`}>
                      {priority.urgency === 'high' ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <TrendingUp className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{priority.fieldName}</p>
                        <Badge 
                          variant={priority.urgency === 'high' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {priority.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{priority.issue}</p>
                      <p className="text-xs text-muted-foreground mt-1">→ {priority.action}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Weather Insights */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-secondary" />
            Today's Weather Impact
          </h3>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-health-moderate" />
              <span className="text-sm font-medium">{briefing.weatherInsights.temperature}°F</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium">{briefing.weatherInsights.precipitation}" rain</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{briefing.weatherInsights.recommendation}</p>
        </div>

        {/* Achievements */}
        {briefing.achievements.length > 0 && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Wins 🎉
            </h3>
            <ul className="space-y-1">
              {briefing.achievements.map((achievement, idx) => (
                <li key={idx} className="text-sm flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <Button className="w-full" asChild>
          <Link to="/fields">
            View All Fields
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
