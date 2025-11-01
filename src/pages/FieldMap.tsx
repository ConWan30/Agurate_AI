import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Badge } from '@/components/ui/badge';
import { MapPin, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FieldMapLeaflet from '@/components/FieldMapLeaflet';
import bgFieldAerial from "@/assets/bg-field-aerial.jpg";

interface Field {
  id: string;
  name: string;
  crop_type: string;
  location_lat: number;
  location_lng: number;
  acreage: number | null;
  health_score?: number;
  stress_level?: string;
}

interface Assessment {
  id: string;
  field_id: string;
  health_score: number;
  stress_level: string;
  analyzed_at: string;
  photo_location_lat: number | null;
  photo_location_lng: number | null;
}

export default function FieldMap() {
  const [fields, setFields] = useState<Field[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFieldsAndAssessments();
  }, []);

  const fetchFieldsAndAssessments = async () => {
    setIsLoading(true);
    
    // Fetch user's fields
    const { data: fieldsData } = await supabase
      .from('fields')
      .select('*')
      .order('created_at', { ascending: false });

    const validFields = (fieldsData || []).filter(
      f => f.location_lat && f.location_lng
    );

    // Fetch latest assessment for each field
    const { data: assessmentsData } = await supabase
      .from('assessments')
      .select('*')
      .order('analyzed_at', { ascending: false });

    // Group by field, take most recent
    const latestAssessments: { [key: string]: Assessment } = {};
    assessmentsData?.forEach(assessment => {
      if (!latestAssessments[assessment.field_id]) {
        latestAssessments[assessment.field_id] = assessment;
      }
    });

    setAssessments(Object.values(latestAssessments));

    // Merge health data into fields
    const fieldsWithHealth = validFields.map(field => {
      const assessment = Object.values(latestAssessments).find(a => a.field_id === field.id);
      return {
        ...field,
        health_score: assessment?.health_score,
        stress_level: assessment?.stress_level,
      };
    });

    setFields(fieldsWithHealth);
    setIsLoading(false);
  };

  const getHealthColor = (healthScore: number) => {
    if (healthScore >= 0.75) return 'bg-green-500';
    if (healthScore >= 0.50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStressBadgeVariant = (stressLevel: string) => {
    switch (stressLevel?.toLowerCase()) {
      case 'healthy': return 'default';
      case 'moderate': return 'secondary';
      case 'severe': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-24">
      {/* Hero Header */}
      <div 
        className="py-12 mb-8 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(22, 163, 74, 0.92) 0%, rgba(21, 128, 61, 0.88) 100%), url(${bgFieldAerial})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4 relative z-10">
          <h1 className="text-5xl font-heading font-bold text-white drop-shadow-lg">
            Delta Field Command Center
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Real-time spatial visualization of crop health across Louisiana Delta
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">

        {/* Legend */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              Field Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-md" />
              <span className="text-sm">Healthy (75-100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-md" />
              <span className="text-sm">Moderate (50-74%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md" />
              <span className="text-sm">Severe (0-49%)</span>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Interactive Map */}
        {isLoading ? (
          <AnimatedCard delay={100}>
            <CardContent className="p-6 space-y-3">
              <LoadingState message="Loading field map..." />
            </CardContent>
          </AnimatedCard>
        ) : fields.length > 0 ? (
          <FieldMapLeaflet fields={fields} />
        ) : null}

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field, idx) => {
            const assessment = assessments.find(a => a.field_id === field.id);
            const healthScore = assessment?.health_score || 0.5;

            return (
              <AnimatedCard key={field.id} delay={idx * 50} hover>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold text-lg">{field.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {field.crop_type} • {field.acreage || 'N/A'} acres
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full ${getHealthColor(healthScore)} border-2 border-white shadow-md`} aria-label={`Health indicator: ${(healthScore * 100).toFixed(0)}%`} />
                  </div>

                  {assessment && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" aria-hidden="true" />
                        <span className="font-mono font-semibold">
                          Health: {(healthScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <AgriculturalBadge type={
                        assessment.stress_level?.toLowerCase() === 'healthy' ? 'healthy' :
                        assessment.stress_level?.toLowerCase() === 'moderate' ? 'moderate' : 'severe'
                      }>
                        {assessment.stress_level}
                      </AgriculturalBadge>
                      <p className="text-xs text-muted-foreground">
                        Last analyzed: <time dateTime={assessment.analyzed_at}>{new Date(assessment.analyzed_at).toLocaleDateString()}</time>
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      📍 {field.location_lat.toFixed(4)}, {field.location_lng.toFixed(4)}
                    </p>
                  </div>
                </CardContent>
              </AnimatedCard>
            );
          })}
        </div>

        {fields.length === 0 && (
          <Card className="field-card border-dashed">
            <CardContent className="p-12 text-center space-y-4">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Fields Registered</h3>
                <p className="text-sm text-muted-foreground">
                  Add fields with GPS coordinates to see them on the map
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="field-card">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-primary">{fields.length}</p>
              <p className="text-sm text-muted-foreground">Total Fields</p>
            </CardContent>
          </Card>
          <Card className="field-card">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {assessments.filter(a => a.stress_level === 'healthy').length}
              </p>
              <p className="text-sm text-muted-foreground">Healthy Fields</p>
            </CardContent>
          </Card>
          <Card className="field-card">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-red-600">
                {assessments.filter(a => a.stress_level === 'severe').length}
              </p>
              <p className="text-sm text-muted-foreground">Fields Need Attention</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
