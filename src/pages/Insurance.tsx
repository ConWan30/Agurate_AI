import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'
import { formatAcreage } from "@/lib/agricultural-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Download, Plus, Calendar, TrendingDown, Eye } from 'lucide-react';
import { InsuranceClaimDetail } from '@/components/InsuranceClaimDetail';
import { downloadClaimPDF, ClaimData } from '@/lib/pdfGenerator';
import bgCropDamage from "@/assets/bg-crop-damage.jpg";

import { DeltaConversationalForm } from "@/components/forms/DeltaConversationalForm";
import { Sparkles } from "lucide-react";
import TutorialTooltip from '@/components/TutorialTooltip';
import { formatHealthPercent, hasHealthScore } from '@/lib/health-score';
import { parseLossPercentage, requireLossPercentage } from '@/lib/loss-percentage';
import { validateExtractedData } from '@/lib/conversational-form-validation';

export default function Insurance() {
  const [open, setOpen] = useState(false);
  const [conversationalOpen, setConversationalOpen] = useState(false);
  const [detailClaimId, setDetailClaimId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: claims } = useQuery({
    queryKey: ['insurance-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_claims')
        .select(`
          *,
          field:fields(name, crop_type, acreage),
          assessment:assessments(health_score, stress_level, analyzed_at)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: fields } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createClaim = useMutation({
    mutationFn: async (formData: FormData) => {
      const rawLoss = formData.get('estimated_loss_percentage');
      const estimated_loss_percentage =
        rawLoss === null || rawLoss === ''
          ? null
          : requireLossPercentage(rawLoss);
      const validated = validateExtractedData('insurance-claim', {
        field_id: formData.get('field_id'),
        event_type: formData.get('event_type'),
        event_date: formData.get('event_date'),
        description: formData.get('description') || 'Claim filed via form',
        estimated_loss_percentage: estimated_loss_percentage ?? undefined,
      });
      const { error } = await supabase.from('insurance_claims').insert([{
        field_id: validated.field_id,
        event_type: validated.event_type,
        event_date: validated.event_date,
        estimated_loss_percentage: validated.estimated_loss_percentage ?? null,
        description: validated.description,
        status: 'draft'
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      toast.success('Insurance claim created');
      setOpen(false);
    }
  });

  const exportClaim = async (claimId: string) => {
    const claim = claims?.find(c => c.id === claimId);
    if (!claim) return;

    try {
      // Transform to ClaimData format
      const claimData: ClaimData = {
        id: claim.id,
        event_type: claim.event_type,
        event_date: claim.event_date,
        estimated_loss_percentage: claim.estimated_loss_percentage,
        description: claim.description || '',
        status: claim.status,
        created_at: claim.created_at,
        field: {
          name: claim.field?.name || 'Unknown Field',
          crop_type: claim.field?.crop_type || 'unknown',
          acreage:
            claim.field?.acreage != null && Number.isFinite(Number(claim.field.acreage))
              ? Number(claim.field.acreage)
              : null,
        },
        assessment: claim.assessment ? {
          health_score: claim.assessment.health_score,
          stress_level: claim.assessment.stress_level,
          analyzed_at: claim.assessment.analyzed_at,
        } : undefined
      };

      downloadClaimPDF(claimData);
      toast.success('Professional PDF report downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  interface InsuranceClaimData {
    fieldId?: string;
    field_id?: string;
    eventType?: string;
    event_type?: string;
    eventDate?: string;
    event_date?: string;
    estimatedLossPercentage?: number | string;
    estimated_loss_percentage?: number | string;
    description?: string;
    [key: string]: unknown;
  }

  const handleConversationalComplete = async (extractedData: InsuranceClaimData) => {
    try {
      const estimated_loss_percentage = parseLossPercentage(
        extractedData.estimatedLossPercentage ?? extractedData.estimated_loss_percentage,
      );
      if (
        (extractedData.estimatedLossPercentage != null ||
          extractedData.estimated_loss_percentage != null) &&
        estimated_loss_percentage == null
      ) {
        throw new Error('Estimated loss must be a number between 0 and 100');
      }
      const validated = validateExtractedData('insurance-claim', {
        field_id: extractedData.fieldId || extractedData.field_id,
        event_type: extractedData.eventType || extractedData.event_type,
        event_date: extractedData.eventDate || extractedData.event_date,
        description: extractedData.description,
        estimated_loss_percentage: estimated_loss_percentage ?? undefined,
      });
      const { error } = await supabase.from('insurance_claims').insert([{
        field_id: validated.field_id,
        event_type: validated.event_type,
        event_date: validated.event_date,
        estimated_loss_percentage: validated.estimated_loss_percentage ?? null,
        description: validated.description,
        status: 'draft'
      }]);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      toast.success('🎉 Insurance claim created successfully!', {
        description: 'Delta Intelligence made it easy for you.'
      });
      setConversationalOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create claim';
      toast.error('Failed to create claim', {
        description: errorMessage
      });
    }
  };

  const tutorialSteps = [
    {
      target: 'insurance-header',
      id: 'header',
      title: 'Step 1: Insurance Claims',
      content: 'Document crop damage with GPS-stamped photos to support insurance claim documentation.',
      position: 'bottom' as const,
    },
    {
      target: 'create-claim',
      id: 'create',
      title: 'Step 2: Create Claim',
      content: 'Click "Create Claim" to start documenting damage - link field assessments as evidence.',
      position: 'bottom' as const,
    },
    {
      target: 'claims-list',
      id: 'list',
      title: 'Step 3: Export & Submit',
      content: 'Export claims to PDF with all evidence photos and GPS data for your adjuster!',
      position: 'top' as const,
    },
  ];

  return (
    <>
      <TutorialTooltip steps={tutorialSteps} storageKey="insurance-tutorial-shown" />
      <div className="min-h-screen bg-gradient-subtle pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Header */}
        <div 
          id="insurance-header"
          className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-delta-mist"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(185, 28, 28, 0.90) 0%, rgba(153, 27, 27, 0.88) 100%), url(${bgCropDamage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
                Insurance Claims
              </h1>
              <p className="text-white/90 text-base md:text-lg">
                Document crop damage for insurance providers with AI-assisted, timestamped field notes — not insurer verification
              </p>
            </div>
            <Dialog open={conversationalOpen} onOpenChange={setConversationalOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="lg" className="gap-2 hidden md:flex">
                  <Sparkles className="h-4 w-4" />
                  Create Claim with Delta AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] p-0" hideCloseButton>
                <DeltaConversationalForm
                  formType="insurance-claim"
                  onComplete={handleConversationalComplete}
                  onAbandon={() => setConversationalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Mobile Create Button */}
        <div className="md:hidden">
          <Button onClick={() => setConversationalOpen(true)} className="w-full gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Create Claim with Delta AI
          </Button>
        </div>

        {/* Educational Section */}
        <Card className="field-card bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              What is Insurance Claims Management?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Purpose</h3>
                <p className="text-sm text-muted-foreground">
                  Document crop damage events with AI-backed evidence to support insurance claim documentation. 
                  Link your AgurateAI crop assessments directly to insurance claims to provide objective, 
                  timestamped health data that supports your loss estimates.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">When to Use</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>After weather events (flood, drought, hail, wind damage)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Disease outbreak or pest infestation detected by AI</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Unexplained crop stress documented over time</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">How to Use</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-background rounded-lg">
                  <div className="font-semibold text-primary mb-1">1. Create Claim</div>
                  <p className="text-muted-foreground">
                    Click "New Claim" and select the affected field, event type, and date
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="font-semibold text-primary mb-1">2. Link AI Data</div>
                  <p className="text-muted-foreground">
                    You can link field assessments from the same field as claim evidence
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="font-semibold text-primary mb-1">3. Export Report</div>
                  <p className="text-muted-foreground">
                    Download formatted report with AI analysis to submit to your insurance provider
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-health-good/10 border border-health-good/20 rounded-lg">
              <p className="text-sm font-medium text-health-good mb-1">📋 Documentation support</p>
              <p className="text-sm text-muted-foreground">
                Timestamped crop-health records can help support insurance conversations. Settlement
                speed and payout amounts vary by carrier and are not guaranteed by AgurateAI.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {claims?.length === 0 ? (
            <Card className="field-card">
              <CardContent className="pt-6 text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No insurance claims yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a claim to document crop damage for insurance providers
                </p>
              </CardContent>
            </Card>
          ) : (
            claims?.map((claim, index) => (
              <AnimatedCard key={claim.id} delay={index * 50} hover={true}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 font-heading">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                        {claim.field?.name}
                      </CardTitle>
                      <CardDescription>
                        {claim.field?.crop_type} • {formatAcreage(claim.field?.acreage)}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        claim.status === 'approved' ? 'default' :
                        claim.status === 'submitted' ? 'secondary' :
                        claim.status === 'denied' ? 'destructive' : 'outline'
                      }
                      aria-label={`Claim status: ${claim.status}`}
                    >
                      {claim.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(claim.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span>
                        {claim.estimated_loss_percentage != null &&
                        Number.isFinite(Number(claim.estimated_loss_percentage))
                          ? `${claim.estimated_loss_percentage}% Est. Loss`
                          : 'Est. Loss not recorded'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Event Type:</p>
                    <p className="text-sm text-muted-foreground capitalize">{claim.event_type}</p>
                  </div>

                  {claim.description && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">{claim.description}</p>
                    </div>
                  )}

                  {claim.assessment && (
                    <div className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium mb-2">AI Assessment Data:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Health Score:</span>
                          <span className="ml-2 font-semibold">
                            {hasHealthScore(claim.assessment.health_score)
                              ? `${formatHealthPercent(claim.assessment.health_score)}`
                              : 'Not recorded'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stress Level:</span>
                          <span className="ml-2 font-semibold capitalize">
                            {claim.assessment.stress_level || 'not recorded'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="gap-2 focus-ring"
                      onClick={() => setDetailClaimId(claim.id)}
                      aria-label={`View details for ${claim.field?.name} claim`}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2 focus-ring"
                      onClick={() => exportClaim(claim.id)}
                      aria-label={`Export ${claim.field?.name} claim as PDF`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </AnimatedCard>
            ))
          )}
        </div>

        {detailClaimId && (
          <InsuranceClaimDetail
            claimId={detailClaimId}
            open={!!detailClaimId}
            onClose={() => setDetailClaimId(null)}
          />
        )}
      </div>
      </div>
    </>
  );
}
