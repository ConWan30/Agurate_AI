import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Button } from '@/components/ui/button';
import { DeltaConversationalForm } from '@/components/forms/DeltaConversationalForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sprout, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TutorialTooltip from '@/components/TutorialTooltip';
import bgHandsSoil from '@/assets/bg-hands-soil.jpg';
import { ConservationPredictionCard } from '@/components/ConservationPredictionCard';
import { ConservationPrediction } from '@/types/enhanced-features';

export default function ConservationPractices() {
  const [conversationalOpen, setConversationalOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Fetch conservation predictions for the user's fields (table has field_id, not user_id)
  const { data: predictions } = useQuery({
    queryKey: ['conservation-predictions'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: ownedFields, error: fieldsError } = await supabase
          .from('fields')
          .select('id')
          .eq('user_id', user.id);

        if (fieldsError) {
          console.error('Error fetching fields for predictions:', fieldsError);
          return [];
        }

        const fieldIds = (ownedFields ?? []).map((f) => f.id);
        if (fieldIds.length === 0) return [];

        const { data, error } = await supabase
          .from('conservation_predictions')
          .select('*')
          .in('field_id', fieldIds)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Error fetching predictions:', error);
          return [];
        }
        return (data ?? []) as ConservationPrediction[];
      } catch (err) {
        console.error(err);
        return [];
      }
    }
  }) as { data: ConservationPrediction[] | undefined };

  // Fetch user fields
  const { data: fields = [] } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  interface ConservationPracticesData {
    field_id: string;
    tillage_type?: string;
    cover_crops?: boolean;
    crop_rotation?: boolean;
    buffer_strips?: boolean;
    precision_fertilization?: boolean;
    notes?: string;
    [key: string]: unknown;
  }

  const handleConversationalComplete = async (extractedData: ConservationPracticesData) => {
    try {
      // Conservation practices would typically be stored in a conservation_practices table
      // or as JSONB on the fields table. For now, we'll update the field's notes.
      
      const practicesText = `
Conservation Practices:
- Tillage: ${extractedData.tillage_type}
- Cover Crops: ${extractedData.cover_crops ? 'Yes' : 'No'}
- Crop Rotation: ${extractedData.crop_rotation ? 'Yes' : 'No'}
- Buffer Strips: ${extractedData.buffer_strips ? 'Yes' : 'No'}
- Precision Fertilization: ${extractedData.precision_fertilization ? 'Yes' : 'No'}
${extractedData.notes ? `\nNotes: ${extractedData.notes}` : ''}
      `.trim();

      const { error } = await supabase
        .from('fields')
        .update({
          notes: practicesText
        })
        .eq('id', extractedData.field_id);

      if (error) throw error;

      toast.success('🌱 Conservation practices documented successfully!');
      setConversationalOpen(false);
      setSelectedFieldId(null);

    } catch (error) {
      console.error('Error saving conservation practices:', error);
      toast.error('Failed to save conservation practices. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <TutorialTooltip
        steps={[
          { id: "welcome", title: "Conservation Practices", content: "Document conservation practices as a USDA records aid (not a compliance guarantee) and track ROI notes", position: "bottom" },
          { id: "delta-ai", title: "Delta AI Assistant", content: "Use conversational form for easy documentation of your practices", position: "bottom" },
          { id: "predictions", title: "Predictive Analytics", content: "Review planning indexes and environmental notes for conservation — not guaranteed dollar forecasts", position: "bottom" },
          { id: "field-tracking", title: "Field-by-Field", content: "Monitor practices and performance for each field independently", position: "bottom" }
        ]}
        storageKey="tutorial-conservation-shown"
      />
      {/* Hero Section */}
      <div
        className="relative h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${bgHandsSoil})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center text-white">
          <h1 className="text-5xl font-heading font-bold mb-4">Conservation Practices</h1>
          <p className="text-xl text-white/90 max-w-2xl mb-6">
            Document your sustainable farming practices as a documentation aid for your USDA records (not a compliance guarantee) and explore conservation methods framed around publicly available LSU AgCenter research.
          </p>
          <Button
            size="lg"
            onClick={() => setConversationalOpen(true)}
            className="w-fit bg-white text-primary hover:bg-white/90 focus-ring"
            aria-label="Document conservation practices with AI assistant"
          >
            <Sprout className="mr-2 h-5 w-5" aria-hidden="true" />
            Document Practices with Delta AI
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <AnimatedCard>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
              <CardTitle className="font-heading">Cost Savings</CardTitle>
              <CardDescription>
                Reduced tillage and cover crops can lower input costs and protect soil — results vary by farm and season
              </CardDescription>
            </CardHeader>
          </AnimatedCard>

          <AnimatedCard delay={100}>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
              <CardTitle className="font-heading">Soil Health</CardTitle>
              <CardDescription>
                Improve soil organic matter and water retention over time
              </CardDescription>
            </CardHeader>
          </AnimatedCard>

          <AnimatedCard delay={200}>
            <CardHeader>
              <Sprout className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
              <CardTitle className="font-heading">USDA Compliance</CardTitle>
              <CardDescription>
                Qualify for Climate-Smart Agriculture and conservation programs
              </CardDescription>
            </CardHeader>
          </AnimatedCard>
        </div>

        {/* Conservation Predictions */}
        {predictions && predictions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Conservation Impact Predictions</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {predictions.map((prediction) => (
                <ConservationPredictionCard 
                  key={prediction.id} 
                  prediction={prediction} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Fields List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Fields</CardTitle>
            <CardDescription>
              Document conservation practices for each field
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sprout className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No fields yet</p>
                <p className="text-sm">Add a field first to document conservation practices</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {fields.map((field: any) => (
                  <Card key={field.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{field.name}</h3>
                          <div className="flex gap-2 flex-wrap mb-2">
                            <Badge variant="secondary">{field.crop_type}</Badge>
                            <Badge variant="outline">{field.acreage} acres</Badge>
                          </div>
                          {field.notes && (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {field.notes.length > 150 
                                ? `${field.notes.substring(0, 150)}...` 
                                : field.notes
                              }
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedFieldId(field.id);
                            setConversationalOpen(true);
                          }}
                          variant="outline"
                        >
                          <Sprout className="mr-2 h-4 w-4" />
                          Document Practices
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Educational Section */}
        <Card className="mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle>Conservation Practice Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">No-Till / Reduced-Till</h4>
              <p className="text-sm text-muted-foreground">
                Can reduce fuel use and improve moisture retention and erosion control — outcomes vary by soil, crop, and season. See LSU AgCenter / NRCS guidance for local estimates.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cover Crops</h4>
              <p className="text-sm text-muted-foreground">
                Often used for nitrogen contribution, weed suppression, and soil organic matter — results depend on species, timing, and management. Confirm with local extension resources.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Precision Fertilization</h4>
              <p className="text-sm text-muted-foreground">
                May lower input costs and nutrient runoff versus blanket rates when calibrated to soil tests and field conditions — not a guaranteed yield lift.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversational Form Dialog */}
      <Dialog open={conversationalOpen} onOpenChange={setConversationalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0" hideCloseButton>
          <DeltaConversationalForm
            formType="conservation-practices"
            context={{ fieldId: selectedFieldId }}
            onComplete={handleConversationalComplete}
            onAbandon={() => {
              setConversationalOpen(false);
              setSelectedFieldId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
