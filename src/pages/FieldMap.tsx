import { useEffect, useState } from 'react';
import { formatAcreage } from '@/lib/agricultural-utils';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Badge } from '@/components/ui/badge';
import { MapPin, Activity } from 'lucide-react';
import FieldMapLeaflet from '@/components/FieldMapLeaflet';
import bgFieldAerial from "@/assets/bg-field-aerial.jpg";
import TutorialTooltip from '@/components/TutorialTooltip';
import { hasHealthScore, toHealthPercent } from '@/lib/health-score';
import { formatStressLabel, normalizeStressLevel, stressBadgeType } from '@/lib/stress-level';
import { useToast } from '@/hooks/use-toast';

interface Field { id: string; name: string; crop_type: string; location_lat: number; location_lng: number; acreage: number | null; health_score?: number; stress_level?: string; }
interface Assessment { id: string; field_id: string; health_score: number; stress_level: string; analyzed_at: string; photo_location_lat: number | null; photo_location_lng: number | null; }

export default function FieldMap() {
  const [fields, setFields] = useState<Field[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => { void fetchFieldsAndAssessments(); }, []);

  const fetchFieldsAndAssessments = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Sign in to view your field map.');
      const [{ data: fieldsData, error: fieldsError }, { data: assessmentsData, error: assessmentsError }] = await Promise.all([
        supabase.from('fields').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('assessments').select('*').order('analyzed_at', { ascending: false }),
      ]);
      if (fieldsError) throw fieldsError;
      if (assessmentsError) throw assessmentsError;
      const validFields = (fieldsData || []).filter((f) => f.location_lat != null && f.location_lng != null && Number.isFinite(Number(f.location_lat)) && Number.isFinite(Number(f.location_lng)));
      const fieldIds = new Set(validFields.map((field) => field.id));
      const latestAssessments: Record<string, Assessment> = {};
      (assessmentsData || []).forEach((assessment) => { if (fieldIds.has(assessment.field_id) && !latestAssessments[assessment.field_id]) latestAssessments[assessment.field_id] = assessment; });
      const latest = Object.values(latestAssessments);
      setAssessments(latest);
      setFields(validFields.map((field) => ({ ...field, health_score: latestAssessments[field.id]?.health_score, stress_level: latestAssessments[field.id]?.stress_level })));
    } catch (error: unknown) {
      setFields([]); setAssessments([]);
      toast({ title: 'Couldn’t load field map', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const getHealthColor = (healthScore: number | null | undefined) => { if (!hasHealthScore(healthScore)) return 'bg-muted-foreground/40'; const pct = toHealthPercent(healthScore); if (pct >= 75) return 'bg-health-good'; if (pct >= 50) return 'bg-health-moderate'; return 'bg-health-severe'; };
  const tutorialSteps = [
    { target: 'field-map-header', id: 'header', title: 'Step 1: Interactive Map', content: 'Visualize your registered fields and recorded assessments on an interactive GPS map.', position: 'bottom' as const },
    { target: 'map-view', id: 'map', title: 'Step 2: Color-Coded Observations', content: 'Markers summarize recorded health scores. Treat them as decision aids, not diagnoses.', position: 'top' as const },
    { target: 'field-stats', id: 'stats', title: 'Step 3: Field Stats', content: 'Review field and assessment summaries for additional context.', position: 'top' as const },
  ];

  return <><TutorialTooltip steps={tutorialSteps} storageKey="field-map-tutorial-shown" /><div className="min-h-screen bg-gradient-subtle pb-24">
    <div id="field-map-header" className="py-12 mb-8 relative overflow-hidden" style={{ backgroundImage: `linear-gradient(135deg, rgba(22, 163, 74, 0.92) 0%, rgba(21, 128, 61, 0.88) 100%), url(${bgFieldAerial})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><div className="max-w-7xl mx-auto px-4 text-center space-y-4 relative z-10"><h1 className="text-4xl md:text-5xl font-heading font-bold text-white drop-shadow-lg">Field Map</h1><p className="text-lg text-white/90 max-w-2xl mx-auto">Map your registered fields and review recorded crop-health observations. Current analysis evidence remains bounded to Morehouse Parish soybean observations.</p></div></div>
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      <AnimatedCard><CardHeader><CardTitle className="font-heading flex items-center gap-2"><MapPin className="h-5 w-5" aria-hidden="true" />Field Health Overview</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-4"><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-health-good border-2 border-white shadow-md" /><span className="text-sm">Higher recorded score (75-100%)</span></div><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-health-moderate border-2 border-white shadow-md" /><span className="text-sm">Moderate recorded score (50-74%)</span></div><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-health-severe border-2 border-white shadow-md" /><span className="text-sm">Lower recorded score (0-49%)</span></div><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-muted-foreground/40 border-2 border-white shadow-md" /><span className="text-sm">No assessment yet</span></div></CardContent></AnimatedCard>
      {isLoading ? <AnimatedCard delay={100}><CardContent className="p-6"><LoadingState message="Loading field map..." /></CardContent></AnimatedCard> : fields.length > 0 ? <FieldMapLeaflet fields={fields} /> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{fields.map((field, idx) => { const assessment = assessments.find(a => a.field_id === field.id); const healthScore = assessment?.health_score; const hasScore = hasHealthScore(healthScore); return <AnimatedCard key={field.id} delay={idx * 50} hover><CardContent className="p-6 space-y-4"><div className="flex items-start justify-between"><div><h3 className="font-heading font-bold text-lg">{field.name}</h3><p className="text-sm text-muted-foreground">{field.crop_type} • {formatAcreage(field.acreage)}</p></div><div className={`w-6 h-6 rounded-full ${getHealthColor(healthScore)} border-2 border-white shadow-md`} aria-label={hasScore ? `Recorded health score: ${toHealthPercent(healthScore).toFixed(0)}%` : 'No assessment yet'} /></div>{assessment && hasScore ? <div className="space-y-2"><div className="flex items-center gap-2"><Activity className="h-4 w-4" aria-hidden="true" /><span className="font-mono font-semibold">Recorded score: {toHealthPercent(healthScore).toFixed(0)}%</span></div>{normalizeStressLevel(assessment.stress_level) ? <AgriculturalBadge type={stressBadgeType(assessment.stress_level)}>{formatStressLabel(assessment.stress_level)}</AgriculturalBadge> : <Badge variant="outline">Stress not recorded</Badge>}<p className="text-xs text-muted-foreground">Last analyzed: <time dateTime={assessment.analyzed_at}>{new Date(assessment.analyzed_at).toLocaleDateString()}</time></p></div> : <p className="text-sm text-muted-foreground">No assessment yet</p>}<div className="pt-2 border-t"><p className="text-xs text-muted-foreground">📍 {Number(field.location_lat).toFixed(4)}, {Number(field.location_lng).toFixed(4)}</p></div></CardContent></AnimatedCard>; })}</div>
      {fields.length === 0 && !isLoading && <Card className="field-card border-dashed"><CardContent className="p-12 text-center space-y-4"><MapPin className="h-16 w-16 mx-auto text-muted-foreground" /><div><h3 className="text-lg font-semibold">No Mapped Fields</h3><p className="text-sm text-muted-foreground">Add a field with valid GPS coordinates to see it on the map.</p></div></CardContent></Card>}
      <div id="field-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card className="field-card"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-primary">{fields.length}</p><p className="text-sm text-muted-foreground">Mapped Fields</p></CardContent></Card><Card className="field-card"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-health-good">{assessments.filter(a => normalizeStressLevel(a.stress_level) === 'healthy').length}</p><p className="text-sm text-muted-foreground">Healthy-Labeled Observations</p></CardContent></Card><Card className="field-card"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-health-severe">{assessments.filter(a => normalizeStressLevel(a.stress_level) === 'severe').length}</p><p className="text-sm text-muted-foreground">Severe-Labeled Observations</p></CardContent></Card></div>
    </div>
  </div></>;
}
