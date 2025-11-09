import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, DollarSign, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PeerComparisonData {
  treatment_name: string;
  farmer_count: number;
  avg_health_before: number;
  avg_health_after: number;
  avg_improvement: number;
  avg_days_to_improvement: number;
  avg_cost_per_acre: number;
  success_rate: number;
  success_count: number;
}

interface PeerComparisonCardProps {
  treatmentType: string;
  cropType: string;
  stressLevel?: string;
  currentHealthScore?: number;
  className?: string;
}

export function PeerComparisonCard({
  treatmentType,
  cropType,
  stressLevel,
  currentHealthScore,
  className
}: PeerComparisonCardProps) {
  const [comparisonData, setComparisonData] = useState<PeerComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeerComparison();
  }, [treatmentType, cropType, stressLevel]);

  const loadPeerComparison = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_peer_comparison', {
        p_field_id: '',  // TODO: Pass actual field ID
        p_crop_type: cropType,
        p_problem: treatmentType,
      });

      if (error) throw error;
      setComparisonData((data || []) as any[] as PeerComparisonData[]);
    } catch (error) {
      console.error('Error loading peer comparison:', error);
      toast.error('Failed to load peer comparison data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Treatment Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-muted-foreground">Loading community data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comparisonData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Treatment Comparison
          </CardTitle>
          <CardDescription>
            See how other farmers in your area have handled similar situations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No community data available yet. Be the first to share your treatment outcomes!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topTreatment = comparisonData[0];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Community Treatment Comparison
        </CardTitle>
        <CardDescription>
          Anonymous data from {topTreatment.farmer_count} farmer{topTreatment.farmer_count !== 1 ? 's' : ''} in your area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Recommendation */}
        <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Most Successful Treatment
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {topTreatment.treatment_name || treatmentType}
              </p>
            </div>
            <Badge variant="default" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {topTreatment.success_rate}% Success
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Average Improvement</p>
              <p className="text-lg font-bold text-success">
                +{topTreatment.avg_improvement.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time to Improvement</p>
              <p className="text-lg font-bold">
                {topTreatment.avg_days_to_improvement.toFixed(0)} days
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average Cost</p>
              <p className="text-lg font-bold flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {topTreatment.avg_cost_per_acre.toFixed(2)}/acre
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Health Score Change</p>
              <p className="text-lg font-bold">
                {topTreatment.avg_health_before.toFixed(0)}% → {topTreatment.avg_health_after.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* All Treatments Comparison */}
        {comparisonData.length > 1 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm">All Treatment Options</h4>
            <div className="space-y-2">
              {comparisonData.map((treatment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {treatment.treatment_name || `${treatmentType} ${idx + 1}`}
                      </span>
                      {idx === 0 && (
                        <Badge variant="default" className="text-xs">Best</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{treatment.farmer_count} farmers</span>
                      <span>{treatment.success_rate}% success</span>
                      <span>+{treatment.avg_improvement.toFixed(1)}% improvement</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${treatment.avg_cost_per_acre.toFixed(0)}/acre
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projected Outcome */}
        {currentHealthScore && topTreatment && (
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <h4 className="font-semibold text-sm mb-2">Your Projected Outcome</h4>
            <p className="text-sm text-muted-foreground">
              Based on community average, your health score could improve from{' '}
              <span className="font-semibold">{currentHealthScore}%</span> to approximately{' '}
              <span className="font-semibold text-success">
                {Math.min(100, Math.round(currentHealthScore + topTreatment.avg_improvement))}%
              </span>{' '}
              within {topTreatment.avg_days_to_improvement.toFixed(0)} days.
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Data is anonymized and aggregated. Your individual data remains private.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

