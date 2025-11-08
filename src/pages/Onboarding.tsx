import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DeltaConversationalForm } from '@/components/forms/DeltaConversationalForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, List } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingWizard } from '@/components/OnboardingWizard';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [onboardingPath, setOnboardingPath] = useState<'quick' | 'wizard' | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate('/dashboard');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };

  interface OnboardingExtractedData {
    farm_name?: string;
    full_name?: string;
    parish?: string;
    primary_crops?: string[];
    total_acreage?: number;
    phone?: string;
    field_name?: string;
    field_crop_type?: string;
    field_acreage?: number;
    field_location_lat?: number;
    field_location_lng?: number;
    field_notes?: string;
    [key: string]: unknown;
  }

  const handleComplete = async (extractedData: OnboardingExtractedData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('🎯 Onboarding data extracted:', extractedData);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          farm_name: extractedData.farm_name,
          full_name: extractedData.full_name,
          parish: extractedData.parish,
          primary_crops: extractedData.primary_crops,
          total_acreage: extractedData.total_acreage,
          phone: extractedData.phone,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          beta_farmer: true,
          beta_signup_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // ✅ CREATE FIRST FIELD AUTOMATICALLY if field data was collected
      // Check if the conversational form extracted field information
      if (extractedData.field_name && extractedData.field_crop_type) {
        console.log('🌾 Creating first field from onboarding data...');
        
        interface FieldData {
          user_id: string;
          name: string;
          crop_type: string;
          acreage?: number;
          location_lat?: number;
          location_lng?: number;
          notes?: string;
          rice_variety?: string;
          soybean_variety?: string;
          cotton_variety?: string;
          corn_hybrid?: string;
        }

        const fieldData: FieldData = {
          user_id: user.id,
          name: extractedData.field_name!,
          crop_type: extractedData.field_crop_type!,
          acreage: extractedData.field_acreage || extractedData.total_acreage,
        };

        // Add optional field data
          if (extractedData.field_location_lat) fieldData.location_lat = parseFloat(String(extractedData.field_location_lat));
        if (extractedData.field_location_lng) fieldData.location_lng = parseFloat(String(extractedData.field_location_lng));
        if (extractedData.field_notes) fieldData.notes = String(extractedData.field_notes);
        
        // Add variety based on crop type
        if (extractedData.field_crop_type === 'rice' && extractedData.rice_variety) {
          fieldData.rice_variety = String(extractedData.rice_variety);
        } else if (extractedData.field_crop_type === 'soybean' && extractedData.soybean_variety) {
          fieldData.soybean_variety = String(extractedData.soybean_variety);
        } else if (extractedData.field_crop_type === 'cotton' && extractedData.cotton_variety) {
          fieldData.cotton_variety = String(extractedData.cotton_variety);
        } else if (extractedData.field_crop_type === 'corn' && extractedData.corn_hybrid) {
          fieldData.corn_hybrid = String(extractedData.corn_hybrid);
        }

        const { data: newField, error: fieldError } = await supabase
          .from('fields')
          .insert(fieldData)
          .select()
          .single();

        if (fieldError) {
          console.error('❌ Error creating field:', fieldError);
        } else {
          console.log('✅ First field created successfully:', newField);
          toast.success(`🌾 ${fieldData.name} field created!`);
        }
      }

      toast.success('🎉 Welcome to AgurateAI! Your profile is all set.');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    }
  };

  const handleAbandon = () => {
    toast.error('Onboarding is required to use AgurateAI');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Path Selection Screen
  if (!onboardingPath) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-heading mb-2">
              Welcome to AgurateAI! 🌾
            </CardTitle>
            <CardDescription className="text-lg">
              Choose your onboarding style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Setup - Recommended */}
              <Card 
                className="border-2 border-primary cursor-pointer hover:border-primary/80 transition-all hover:shadow-lg"
                onClick={() => setOnboardingPath('quick')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Quick Setup
                    </CardTitle>
                  </div>
                  <Badge className="w-fit bg-primary text-primary-foreground">Recommended</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have a conversation with Delta Intelligence to set up your farm profile. 
                    Fast, natural, and personalized.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-health-good" />
                      <span>AI-powered data extraction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-health-good" />
                      <span>Parish-specific guidance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-health-good" />
                      <span>~2-3 minutes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Step-by-Step Wizard */}
              <Card 
                className="border-2 cursor-pointer hover:border-primary/80 transition-all hover:shadow-lg"
                onClick={() => setOnboardingPath('wizard')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <List className="h-5 w-5 text-secondary" />
                    Step-by-Step
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Traditional form-based setup with clear steps. 
                    Perfect if you prefer structured forms.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-health-good" />
                      <span>Clear step-by-step process</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-health-good" />
                      <span>All fields visible upfront</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-health-good" />
                      <span>~5-7 minutes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Selected Path
  if (onboardingPath === 'quick') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Quick Setup with Delta Intelligence 🌾</h1>
            <p className="text-lg text-muted-foreground">
              Let's have a conversation to set up your farm profile
            </p>
          </div>

          <DeltaConversationalForm
            formType="onboarding"
            onComplete={handleComplete}
            onAbandon={handleAbandon}
          />
        </div>
      </div>
    );
  }

  if (onboardingPath === 'wizard') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <OnboardingWizard
          open={true}
          onComplete={async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Not authenticated');

              await supabase
                .from('profiles')
                .update({
                  onboarding_completed: true,
                  onboarding_completed_at: new Date().toISOString()
                })
                .eq('id', user.id);

              toast.success('🎉 Welcome to AgurateAI!');
              setTimeout(() => navigate('/dashboard'), 1500);
            } catch (error) {
              console.error('Error completing onboarding:', error);
              toast.error('Failed to complete onboarding');
            }
          }}
          onSkip={() => {
            toast.error('Onboarding is required to use AgurateAI');
          }}
        />
      </div>
    );
  }

  return null;
}
