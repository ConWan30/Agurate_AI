import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Activity } from 'lucide-react';

interface Field {
  id: string;
  name: string;
  crop_type: string;
  location_lat: number;
  location_lng: number;
  acreage: number | null;
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

  useEffect(() => {
    fetchFieldsAndAssessments();
  }, []);

  const fetchFieldsAndAssessments = async () => {
    // Fetch user's fields
    const { data: fieldsData } = await supabase
      .from('fields')
      .select('*')
      .order('created_at', { ascending: false });

    const validFields = (fieldsData || []).filter(
      f => f.location_lat && f.location_lng
    );
    setFields(validFields);

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
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold text-gradient-delta">
            Delta Field Command Center
          </h1>
          <p className="text-muted-foreground">
            Real-time spatial visualization of crop health across Louisiana Delta
          </p>
        </div>

        {/* Legend */}
        <Card className="field-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
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
        </Card>

        {/* Map Placeholder - Full interactive map requires leaflet setup */}
        <Card className="field-card">
          <CardContent className="p-6">
            <div className="bg-muted rounded-lg p-8 text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Interactive Map View</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Leaflet integration requires additional configuration.
                View your fields below in list format.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => {
            const assessment = assessments.find(a => a.field_id === field.id);
            const healthScore = assessment?.health_score || 0.5;

            return (
              <Card key={field.id} className="field-card hover-lift">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">{field.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {field.crop_type} • {field.acreage || 'N/A'} acres
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full ${getHealthColor(healthScore)} border-2 border-white shadow-md`} />
                  </div>

                  {assessment && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="font-semibold">
                          Health: {(healthScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Badge variant={getStressBadgeVariant(assessment.stress_level)}>
                        {assessment.stress_level}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Last analyzed: {new Date(assessment.analyzed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      📍 {field.location_lat.toFixed(4)}, {field.location_lng.toFixed(4)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {fields.length === 0 && (
          <Card className="field-card">
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Fields Registered</h3>
              <p className="text-sm text-muted-foreground">
                Add fields with GPS coordinates to see them on the map.
              </p>
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
