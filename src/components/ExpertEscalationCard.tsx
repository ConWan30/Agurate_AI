import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, Clock, FileText, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LSUResearcher {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  typical_response_time: string;
}

interface ExpertEscalationCardProps {
  issueType: string;
  issueDescription: string;
  confidenceScore?: number;
  fieldId?: string;
  assessmentId?: string;
  aiAnalysis?: Record<string, unknown>;
  onEscalationCreated?: (consultationId: string) => void;
  className?: string;
}

export function ExpertEscalationCard({
  issueType,
  issueDescription,
  confidenceScore = 0,
  fieldId,
  assessmentId,
  aiAnalysis,
  onEscalationCreated,
  className
}: ExpertEscalationCardProps) {
  const [researcher, setResearcher] = useState<LSUResearcher | null>(null);
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [consultationCreated, setConsultationCreated] = useState(false);

  // Determine if escalation is recommended
  const shouldEscalate = confidenceScore < 70 || issueType === 'unusual' || issueType === 'complex';

  // Load matching researcher when component mounts
  useEffect(() => {
    if (shouldEscalate) {
      loadMatchingResearcher();
    }
  }, [shouldEscalate]);

  const loadMatchingResearcher = async () => {
    setLoading(true);
    try {
      // Map issue type to specialties
      const specialties: string[] = [];
      if (issueType.includes('disease')) specialties.push('disease_diagnostics');
      if (issueType.includes('pest')) specialties.push('pest_management');
      if (issueType.includes('nutrient')) specialties.push('soil_health');
      if (issueType.includes('rice')) specialties.push('rice_specialist');
      if (issueType.includes('soybean')) specialties.push('soybean_pathology');

      const { data, error } = await supabase.rpc('find_matching_researcher', {
        p_crop_type: specialties.length > 0 ? specialties[0] : issueType,
        p_issue_type: issueType,
      });

      if (error) throw error;
      const match = Array.isArray(data) ? data[0] : data;
      if (match) {
        setResearcher({
          id: match.id,
          name: match.name,
          title: match.department || 'LSU AgCenter',
          specialties: match.expertise || [],
          typical_response_time: match.availability || 'varies',
        });
      }
    } catch (error) {
      console.error('Error loading researcher:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEscalation = async () => {
    if (!researcher) {
      toast.error('No researcher available');
      return;
    }

    setEscalating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('expert_consultations')
        .insert({
          farmer_id: user.id,
          field_id: fieldId || null,
          assessment_id: assessmentId || null,
          researcher_id: researcher.id,
          question: issueDescription,
          status: 'pending',
          priority: confidenceScore < 50 ? 'urgent' : confidenceScore < 70 ? 'high' : 'medium',
        })
        .select()
        .single();

      if (error) throw error;

      setConsultationCreated(true);
      toast.success('Consultation note saved. This does not email LSU staff — use public AgCenter channels for follow-up.');
      
      if (onEscalationCreated) {
        onEscalationCreated(data.id);
      }
    } catch (error) {
      console.error('Error creating escalation:', error);
      toast.error('Failed to request expert consultation');
    } finally {
      setEscalating(false);
    }
  };

  if (!shouldEscalate && !researcher) {
    return null; // Don't show if escalation not needed
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Expert Consultation Available
        </CardTitle>
        <CardDescription>
          Save a consultation note and use public LSU AgCenter channels for complex cases
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shouldEscalate && (
          <Alert variant="default" className="border-primary/20 bg-primary/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Expert Review Recommended</AlertTitle>
            <AlertDescription>
              {confidenceScore < 70
                ? `AI confidence is ${confidenceScore}%. An expert review is recommended for the most accurate diagnosis.`
                : 'This case may benefit from expert consultation for specialized guidance.'}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-muted-foreground">Finding matching researcher...</span>
          </div>
        ) : researcher ? (
          <>
            {consultationCreated ? (
              <Alert variant="default" className="border-success/20 bg-success/5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertTitle>Consultation Requested</AlertTitle>
                <AlertDescription>
                  Your consultation note was saved locally in AgurateAI. Contact {researcher.name} through official LSU AgCenter channels — we do not broker introductions.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {researcher.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{researcher.title}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Typical response: {researcher.typical_response_time}</span>
                  </div>

                  {researcher.specialties && researcher.specialties.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {researcher.specialties.slice(0, 3).map((specialty, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {specialty.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={createEscalation}
                  disabled={escalating}
                  className="w-full"
                >
                  {escalating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving consultation note...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Save Consultation Note
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Saves a note in AgurateAI only. It does not email or notify LSU staff — use public AgCenter channels for follow-up.
                </p>
              </>
            )}
          </>
        ) : (
          <Alert variant="default">
            <AlertDescription>
              No available researchers found for this issue type. Please try again later or contact LSU AgCenter directly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

