import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DeltaConversationalForm } from '@/components/forms/DeltaConversationalForm';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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

  const handleComplete = async (extractedData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to AgurateAI! 🌾</h1>
          <p className="text-lg text-muted-foreground">
            Let's get your farm set up in just a few minutes
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
