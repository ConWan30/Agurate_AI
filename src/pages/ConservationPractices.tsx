import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeltaConversationalForm } from '@/components/forms/DeltaConversationalForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sprout, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import bgHandsSoil from '@/assets/bg-hands-soil.jpg';

export default function ConservationPractices() {
  const [conversationalOpen, setConversationalOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

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

  const handleConversationalComplete = async (extractedData: any) => {
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
      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${bgHandsSoil})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center text-white">
          <h1 className="text-5xl font-bold mb-4">Conservation Practices</h1>
          <p className="text-xl text-white/90 max-w-2xl mb-6">
            Document your sustainable farming practices for USDA compliance and discover cost savings through LSU AgCenter-validated conservation methods.
          </p>
          <Button
            size="lg"
            onClick={() => setConversationalOpen(true)}
            className="w-fit bg-white text-primary hover:bg-white/90"
          >
            <Sprout className="mr-2 h-5 w-5" />
            Document Practices with Delta AI
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Cost Savings</CardTitle>
              <CardDescription>
                Save $20-50 per acre annually through reduced tillage and cover crops
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Soil Health</CardTitle>
              <CardDescription>
                Improve soil organic matter and water retention over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sprout className="h-8 w-8 text-primary mb-2" />
              <CardTitle>USDA Compliance</CardTitle>
              <CardDescription>
                Qualify for Climate-Smart Agriculture and conservation programs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

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
            <CardTitle>Conservation Practice Benefits (LSU AgCenter Research)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">No-Till / Reduced-Till</h4>
              <p className="text-sm text-muted-foreground">
                • Fuel savings: $8-12/acre • Soil moisture retention: +15-20% • Erosion reduction: 70-90%
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cover Crops</h4>
              <p className="text-sm text-muted-foreground">
                • Nitrogen credit: $15-30/acre • Weed suppression: 50-70% • Soil organic matter: +0.1-0.3% annually
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Precision Fertilization</h4>
              <p className="text-sm text-muted-foreground">
                • Input cost savings: 10-20% • Environmental impact: -30% nitrogen runoff • Yield improvement: 5-10%
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
