import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PeerComparisonData {
  treatment_type: string;
  success_rate: number;
  avg_effectiveness: number;
  sample_size: number;
}

interface PeerComparisonCardProps {
  fieldId: string;
  treatmentType: string;
  cropType: string;
  stressLevel?: string;
  currentHealthScore?: number;
  className?: string;
}

function formatPeerMetric(value: unknown, suffix = ''): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n)}${suffix}`;
}

export function PeerComparisonCard({
  fieldId,
  treatmentType,
  cropType,
  currentHealthScore,
  className
}: PeerComparisonCardProps) {
  const [comparisonData, setComparisonData] = useState<PeerComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fieldId) {
      setLoading(false);
      setComparisonData([]);
      return;
    }
    loadPeerComparison();
  }, [fieldId, treatmentType, cropType]);

  const loadPeerComparison = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_peer_comparison', {
        p_field_id: fieldId,
        p_crop_type: cropType,
        p_problem: treatmentType,
      });

      if (error) throw error;
      setComparisonData((data || []) as PeerComparisonData[]);
    } catch (error) {
      console.error('Error loading peer comparison:', error);
      toast.error('Failed to load peer comparison data');
      setComparisonData([]);
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
  const sampleSize = Number.isFinite(Number(topTreatment.sample_size))
    ? Number(topTreatment.sample_size)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Community Treatment Comparison
        </CardTitle>
        <CardDescription>
          Self-reported anonymous outcomes from {sampleSize} record
          {sampleSize !== 1 ? 's' : ''} for similar {cropType} cases
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Most Successful Treatment
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {topTreatment.treatment_type || treatmentType}
              </p>
            </div>
            <Badge variant="default" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatPeerMetric(topTreatment.success_rate, '%')} Success
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Avg. Effectiveness</p>
              <p className="text-lg font-bold text-success">
                {formatPeerMetric(topTreatment.avg_effectiveness, '/100')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sample Size</p>
              <p className="text-lg font-bold">
                {sampleSize} outcomes
              </p>
            </div>
          </div>
        </div>

        {comparisonData.length > 1 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm">All Treatment Options</h4>
            <div className="space-y-2">
              {comparisonData.map((treatment, idx) => (
                <div
                  key={`${treatment.treatment_type}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {treatment.treatment_type || `${treatmentType} ${idx + 1}`}
                      </span>
                      {idx === 0 && (
                        <Badge variant="default" className="text-xs">Best</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{formatPeerMetric(treatment.sample_size)} outcomes</span>
                      <span>{formatPeerMetric(treatment.success_rate, '%')} success</span>
                      <span>{formatPeerMetric(treatment.avg_effectiveness, '/100')} effectiveness</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentHealthScore != null && Number.isFinite(Number(currentHealthScore)) && topTreatment && (
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <h4 className="font-semibold text-sm mb-2">Community context</h4>
            <p className="text-sm text-muted-foreground">
              Self-reported peer outcomes for similar {cropType} cases show about{' '}
              <span className="font-semibold text-success">{formatPeerMetric(topTreatment.success_rate, '%')}</span>{' '}
              success with {topTreatment.treatment_type}. Your current health score is{' '}
              <span className="font-semibold">{Math.round(Number(currentHealthScore))}%</span>. This is
              anonymized community signal, not a guaranteed result.
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Data is anonymized, aggregated, and self-reported. Your individual data remains private.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
