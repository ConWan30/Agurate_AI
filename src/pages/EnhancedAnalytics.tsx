import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PredictiveAnalyticsDashboard } from '@/components/PredictiveAnalyticsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Zap } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PredictiveModel } from '@/types/enhanced-features';

interface Field {
  id: string;
  name: string;
  crop_type: string;
}

export default function EnhancedAnalytics() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [predictions, setPredictions] = useState<PredictiveModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedFieldId) {
      fetchPredictions();
    }
  }, [selectedFieldId]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('fields')
        .select('id, name, crop_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setFields(data);
        setSelectedFieldId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const { data } = await supabase
        .from('predictive_models')
        .select('*')
        .eq('field_id', selectedFieldId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setPredictions(data as PredictiveModel[]);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-glow">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Brain className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Unified AI Intelligence
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Enhanced Predictive Analytics
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            AI-powered insights combining crop analysis, weather patterns, conservation practices, and community intelligence
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
      </div>

      {/* Field Selector */}
      {fields.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Field for Analysis</label>
                  <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name} ({field.crop_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Predictive Analytics Dashboard */}
          {selectedFieldId && (
            <PredictiveAnalyticsDashboard predictions={predictions} />
          )}

          {/* Feature Highlights */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Unified Context</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI analyzes your field using historical assessments, conservation practices, variety performance, 
                  weather patterns, and community insights for comprehensive predictions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-lg">30-Day Forecasting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Extended prediction horizon gives you more time to plan interventions, order supplies, 
                  and optimize treatment timing based on weather and crop development stages.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-secondary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary/10">
                    <Zap className="h-5 w-5 text-secondary" />
                  </div>
                  <CardTitle className="text-lg">LSU-Validated</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All predictions and recommendations are cross-referenced with LSU AgCenter research data 
                  and validated against proven agricultural practices for Louisiana Delta conditions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="No fields registered"
          description="Register your first field to start receiving enhanced predictive analytics"
          actionLabel="Add Field"
          onAction={() => navigate('/fields')}
        />
      )}
    </div>
  );
}
