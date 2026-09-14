import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, TrendingDown, Minus, Loader2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ProgressiveImage } from '@/components/ui/progressive-image';
import { formatHealthPercent } from '@/lib/health-score';
import { resolveCropImageUrl, resolveCropImageUrls } from '@/lib/crop-image';

interface Assessment {
  id: string;
  image_url: string;
  health_score: number | null;
  stress_level: string | null;
  analyzed_at: string;
  symptoms?: string[] | null;
  field_id: string;
}

interface ComparisonResult {
  health_trend: 'improving' | 'declining' | 'stable' | 'unknown';
  health_change: number | null;
  health_scores_recorded?: boolean;
  symptom_progression: string[];
  visual_changes: string[];
  treatment_effectiveness?: string | null;
  projected_recovery?: string | null;
}

interface ImageHistoryComparisonProps {
  fieldId: string;
  currentAssessmentId?: string;
  onClose?: () => void;
}

export function ImageHistoryComparison({ fieldId, currentAssessmentId, onClose }: ImageHistoryComparisonProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment1, setSelectedAssessment1] = useState<string | null>(null);
  const [selectedAssessment2, setSelectedAssessment2] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [fieldId]);

  const loadAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('id, image_url, health_score, stress_level, analyzed_at, symptoms, field_id')
        .eq('field_id', fieldId)
        .order('analyzed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const withUrls = await resolveCropImageUrls(
        supabase,
        (data || []) as Assessment[]
      );
      setAssessments(withUrls);
      
      // Auto-select most recent and second most recent if available
      if (withUrls.length >= 2) {
        setSelectedAssessment1(currentAssessmentId || withUrls[0].id);
        setSelectedAssessment2(withUrls[1].id);
      } else if (withUrls.length === 1) {
        setSelectedAssessment1(currentAssessmentId || withUrls[0].id);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error('Failed to load assessment history');
    } finally {
      setLoading(false);
    }
  };

  const compareImages = async () => {
    if (!selectedAssessment1 || !selectedAssessment2) {
      toast.error('Please select two assessments to compare');
      return;
    }

    if (selectedAssessment1 === selectedAssessment2) {
      toast.error('Please select two different assessments');
      return;
    }

    setComparing(true);
    try {
      const assessment1 = assessments.find(a => a.id === selectedAssessment1);
      const assessment2 = assessments.find(a => a.id === selectedAssessment2);

      if (!assessment1 || !assessment2) {
        throw new Error('Assessments not found');
      }

      // Fresh signed URLs for the vision model (paths or legacy signed URLs)
      const [image1Url, image2Url] = await Promise.all([
        resolveCropImageUrl(supabase, assessment1.image_url),
        resolveCropImageUrl(supabase, assessment2.image_url),
      ]);
      if (!image1Url || !image2Url) {
        throw new Error('Could not resolve assessment image URLs');
      }

      // Call Edge Function for image comparison
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          image1_url: image1Url,
          image2_url: image2Url,
          assessment1_id: assessment1.id,
          assessment2_id: assessment2.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Comparison failed');
      }

      const result = await response.json();
      if (!result?.health_trend || !Array.isArray(result.visual_changes)) {
        throw new Error('Comparison response missing required fields');
      }
      setComparisonResult(result);
    } catch (error) {
      console.error('Error comparing images:', error);
      toast.error('Failed to compare images');
      // Fail closed — never invent visual comparison from score math alone
      setComparisonResult(null);
    } finally {
      setComparing(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-success';
      case 'declining':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading assessment history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assessments.length < 2) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Need at least 2 assessments to compare. Upload more images to track progress over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const assessment1 = assessments.find(a => a.id === selectedAssessment1);
  const assessment2 = assessments.find(a => a.id === selectedAssessment2);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image History Comparison
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assessment Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">First Assessment</label>
            <Select
              value={selectedAssessment1 || ''}
              onValueChange={setSelectedAssessment1}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {format(new Date(assessment.analyzed_at), 'MMM d, yyyy')} - {formatHealthPercent(assessment.health_score)} health
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Second Assessment</label>
            <Select
              value={selectedAssessment2 || ''}
              onValueChange={setSelectedAssessment2}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {format(new Date(assessment.analyzed_at), 'MMM d, yyyy')} - {formatHealthPercent(assessment.health_score)} health
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Compare Button */}
        <Button
          onClick={compareImages}
          disabled={comparing || !selectedAssessment1 || !selectedAssessment2}
          className="w-full"
        >
          {comparing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Comparing Images...
            </>
          ) : (
            'Compare Images'
          )}
        </Button>

        {/* Image Comparison View */}
        {assessment1 && assessment2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {format(new Date(assessment1.analyzed_at), 'MMM d, yyyy')}
                  </CardTitle>
                  <Badge variant={assessment1.stress_level === 'severe' ? 'destructive' : assessment1.stress_level === 'moderate' ? 'default' : 'outline'}>
                    {formatHealthPercent(assessment1.health_score)} health
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ProgressiveImage
                  src={assessment1.image_url}
                  alt="Assessment 1"
                  className="w-full h-48 object-cover rounded-lg"
                />
                {assessment1.symptoms && assessment1.symptoms.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Symptoms: {assessment1.symptoms.join(', ')}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {format(new Date(assessment2.analyzed_at), 'MMM d, yyyy')}
                  </CardTitle>
                  <Badge variant={assessment2.stress_level === 'severe' ? 'destructive' : assessment2.stress_level === 'moderate' ? 'default' : 'outline'}>
                    {formatHealthPercent(assessment2.health_score)} health
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ProgressiveImage
                  src={assessment2.image_url}
                  alt="Assessment 2"
                  className="w-full h-48 object-cover rounded-lg"
                />
                {assessment2.symptoms && assessment2.symptoms.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Symptoms: {assessment2.symptoms.join(', ')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comparison Results */}
        {comparisonResult && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTrendIcon(comparisonResult.health_trend)}
                <span className={getTrendColor(comparisonResult.health_trend)}>
                  Comparison Results
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Health Trend</span>
                  <Badge variant={comparisonResult.health_trend === 'improving' ? 'default' : comparisonResult.health_trend === 'declining' ? 'destructive' : 'outline'}>
                    {comparisonResult.health_trend.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {comparisonResult.health_change != null &&
                  Number.isFinite(comparisonResult.health_change) &&
                  comparisonResult.health_scores_recorded !== false
                    ? `Health score changed by ${comparisonResult.health_change > 0 ? '+' : ''}${comparisonResult.health_change}%`
                    : 'Health score change not available — one or both assessments lack a recorded score.'}
                </p>
              </div>

              {comparisonResult.visual_changes && comparisonResult.visual_changes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Visual Changes</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {comparisonResult.visual_changes.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}

              {comparisonResult.symptom_progression && comparisonResult.symptom_progression.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Symptom Progression</h4>
                  <div className="flex flex-wrap gap-2">
                    {comparisonResult.symptom_progression.map((symptom, idx) => (
                      <Badge key={idx} variant="outline">{symptom}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {comparisonResult.treatment_effectiveness && (
                <div className="p-3 bg-success/10 rounded-lg">
                  <h4 className="font-medium mb-1">Treatment Effectiveness</h4>
                  <p className="text-sm">{comparisonResult.treatment_effectiveness}</p>
                </div>
              )}

              {comparisonResult.projected_recovery && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-medium mb-1">Projected Recovery</h4>
                  <p className="text-sm">{comparisonResult.projected_recovery}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

