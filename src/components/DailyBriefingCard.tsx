import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Sunrise, TrendingUp, AlertTriangle, CheckCircle2, Droplets, Thermometer, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { hasHealthScore, toHealthPercent } from '@/lib/health-score';

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
    recommendation: string | null;
  } | null;
  achievements: string[];
}

export function DailyBriefingCard() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sprayWindow, setSprayWindow] = useState<string | null>(null);

  useEffect(() => {
    generateDailyBriefing();
  }, []);

  const generateDailyBriefing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch fields to check if user has any
      const { data: fields } = await supabase
        .from('fields')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!fields || fields.length === 0) {
        setLoading(false);
        return;
      }

      // Call Edge Function for AI-generated briefing with weather
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-daily-briefing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate briefing');
      }

      const data = await response.json();
      if (data.error || !Array.isArray(data.priorities) || data.priorities.length === 0) {
        throw new Error(data.error || 'Daily briefing unavailable');
      }

      // Fetch fields for summary
      const { data: allFields } = await supabase
        .from('fields')
        .select('id, name, crop_type')
        .eq('user_id', user.id);

      if (!allFields) return;

      // Get latest assessment for each field for summary
      const fieldAssessments = await Promise.all(
        allFields.map(async (field) => {
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
        f.latestAssessment && hasHealthScore(f.latestAssessment.health_score) && toHealthPercent(f.latestAssessment.health_score) >= 75
      ).length;
      const needingAttentionCount = fieldAssessments.filter(f => 
        f.latestAssessment && hasHealthScore(f.latestAssessment.health_score)
          && toHealthPercent(f.latestAssessment.health_score) >= 50
          && toHealthPercent(f.latestAssessment.health_score) < 75
      ).length;
      const criticalCount = fieldAssessments.filter(f => 
        f.latestAssessment && hasHealthScore(f.latestAssessment.health_score) && toHealthPercent(f.latestAssessment.health_score) < 50
      ).length;

      // Map AI priorities — require model-provided fields (no invented issue/action copy)
      const priorities = data.priorities
        .filter(
          (p: { fieldName?: string; issue?: string; action?: string; urgency?: string }) =>
            Boolean(p?.fieldName && p?.issue && p?.action)
        )
        .map((p: { fieldName: string; issue: string; action: string; urgency?: string }) => {
          const field = allFields.find(f => f.name === p.fieldName);
          return {
            fieldName: p.fieldName,
            fieldId: field?.id || '',
            issue: p.issue,
            urgency: (p.urgency === 'high' || p.urgency === 'low' || p.urgency === 'medium'
              ? p.urgency
              : null) as 'high' | 'medium' | 'low' | null,
            action: p.action,
          };
        })
        .filter((p): p is {
          fieldName: string;
          fieldId: string;
          issue: string;
          urgency: 'high' | 'medium' | 'low';
          action: string;
        } => p.urgency != null);

      if (priorities.length === 0) {
        throw new Error('Daily briefing priorities incomplete');
      }

      // Weather insights from API — omit section when payload missing (never invent 0°F / 0")
      const weatherInsights =
        data.weather && data.weather.highTemp != null && data.weather.precipitation != null
          ? {
              temperature: data.weather.highTemp,
              precipitation: data.weather.precipitation,
              recommendation:
                typeof data.weatherRecommendation === 'string' && data.weatherRecommendation.trim()
                  ? data.weatherRecommendation.trim()
                  : data.weather.lowTemp != null
                    ? `High: ${data.weather.highTemp}°F, Low: ${data.weather.lowTemp}°F`
                    : `High: ${data.weather.highTemp}°F`,
            }
          : null;

      setSprayWindow(
        typeof data.sprayWindow === 'string' && data.sprayWindow.trim()
          ? data.sprayWindow.trim()
          : null
      );
      setBriefing({
        date: format(new Date(data.date || new Date()), 'MMMM d, yyyy'),
        fieldsSummary: {
          total: allFields.length,
          healthy: healthyCount,
          needingAttention: needingAttentionCount,
          critical: criticalCount
        },
        topPriorities: priorities,
        weatherInsights,
        achievements: data.achievements || []
      });
    } catch (error) {
      console.error('Error generating daily briefing:', error);
      // Fallback to basic briefing on error
      setLoading(false);
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

        {/* Weather Insights — only when API provided real weather (not invented zeros) */}
        {briefing.weatherInsights && (
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
              <span className="text-sm font-medium">{briefing.weatherInsights.precipitation.toFixed(1)}mm rain</span>
            </div>
          </div>
          {briefing.weatherInsights.recommendation && (
            <p className="text-sm text-muted-foreground">{briefing.weatherInsights.recommendation}</p>
          )}
          {sprayWindow && (
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Spray Window:</strong> {sprayWindow}
            </p>
          )}
        </div>
        )}
        {!briefing.weatherInsights && sprayWindow && (
          <p className="text-xs text-muted-foreground">
            <strong>Spray Window:</strong> {sprayWindow}
          </p>
        )}

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
