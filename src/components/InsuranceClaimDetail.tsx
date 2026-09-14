import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Camera, FileText, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { resolveCropImageUrls } from '@/lib/crop-image';

type ClaimDetailProps = {
  claimId: string;
  open: boolean;
  onClose: () => void;
};

export function InsuranceClaimDetail({ claimId, open, onClose }: ClaimDetailProps) {
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: claim } = useQuery({
    queryKey: ['insurance-claim', claimId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_claims')
        .select(`
          *,
          field:fields(name, crop_type, acreage, location_lat, location_lng),
          linked_assessments:claim_assessments(
            assessment:assessments(
              id,
              image_url,
              health_score,
              stress_level,
              symptoms,
              analyzed_at,
              weather_temp_f,
              weather_precipitation_mm
            )
          )
        `)
        .eq('id', claimId)
        .single();
      
      if (error) throw error;

      const linked = data.linked_assessments ?? [];
      const assessments = linked
        .map((la: { assessment: { id: string; image_url: string } | null }) => la.assessment)
        .filter((a): a is { id: string; image_url: string } => Boolean(a));
      const resolved = await resolveCropImageUrls(supabase, assessments);
      const byId = new Map(resolved.map((a) => [a.id, a.image_url]));

      return {
        ...data,
        linked_assessments: linked.map(
          (la: { assessment: { id: string; image_url: string } | null }) => ({
            ...la,
            assessment: la.assessment
              ? {
                  ...la.assessment,
                  image_url: byId.get(la.assessment.id) ?? la.assessment.image_url,
                }
              : null,
          })
        ),
      };
    },
    enabled: open
  });

  const { data: availableAssessments } = useQuery({
    queryKey: ['field-assessments', claim?.field_id],
    queryFn: async () => {
      if (!claim?.field_id) return [];
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('field_id', claim.field_id)
        .order('analyzed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return resolveCropImageUrls(supabase, data ?? []);
    },
    enabled: !!claim?.field_id && open
  });

  const linkAssessment = useMutation({
    mutationFn: async (assessmentId: string) => {
      const { error } = await supabase.from('claim_assessments').insert({
        claim_id: claimId,
        assessment_id: assessmentId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claim', claimId] });
      toast.success('Assessment linked to claim');
    }
  });

  const unlinkAssessment = useMutation({
    mutationFn: async (assessmentId: string) => {
      const { error } = await supabase
        .from('claim_assessments')
        .delete()
        .eq('claim_id', claimId)
        .eq('assessment_id', assessmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claim', claimId] });
      toast.success('Assessment unlinked');
    }
  });

  const submitClaim = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('insurance_claims')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          notes: notes || claim?.notes
        })
        .eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      queryClient.invalidateQueries({ queryKey: ['insurance-claim', claimId] });
      toast.success('Claim submitted successfully');
      onClose();
    }
  });

  const linkedAssessmentIds = claim?.linked_assessments?.map((la: any) => la.assessment?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Insurance Claim Details</DialogTitle>
            <Badge variant={
              claim?.status === 'submitted' ? 'default' :
              claim?.status === 'approved' ? 'default' :
              claim?.status === 'denied' ? 'destructive' : 'outline'
            }>
              {claim?.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Claim Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Field</p>
                  <p className="font-semibold">{claim?.field?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {claim?.field?.crop_type} • {claim?.field?.acreage} acres
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Event Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <p className="font-semibold">
                      {claim?.event_date && new Date(claim.event_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Event Type</p>
                  <p className="font-semibold capitalize">{claim?.event_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Estimated Loss</p>
                  <p className="font-semibold text-destructive">{claim?.estimated_loss_percentage}%</p>
                </div>
              </div>

              {claim?.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{claim.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Evidence */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo Evidence ({claim?.linked_assessments?.length || 0})
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {claim?.linked_assessments?.map((la: any) => {
                const assessment = la.assessment;
                if (!assessment) return null;

                return (
                  <Card key={assessment.id} className="overflow-hidden">
                    <img 
                      src={assessment.image_url} 
                      alt="Crop assessment" 
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Health: {assessment.health_score}/100</span>
                        <span className="capitalize">{assessment.stress_level}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(assessment.analyzed_at).toLocaleDateString()}
                      </p>
                      {assessment.symptoms && (
                        <p className="text-xs text-muted-foreground">
                          {assessment.symptoms.join(', ')}
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => unlinkAssessment.mutate(assessment.id)}
                        disabled={claim?.status !== 'draft'}
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {claim?.status === 'draft' && availableAssessments && availableAssessments.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Add more evidence:</p>
                <div className="grid grid-cols-3 gap-2">
                  {availableAssessments
                    .filter(a => !linkedAssessmentIds.includes(a.id))
                    .map(assessment => (
                      <button
                        key={assessment.id}
                        onClick={() => linkAssessment.mutate(assessment.id)}
                        className="relative rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img 
                          src={assessment.image_url} 
                          alt="Assessment" 
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">+ Add</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {claim?.status === 'draft' && (
            <div>
              <Label>Additional Notes for Adjuster</Label>
              <Textarea
                value={notes || claim?.notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information for the insurance adjuster..."
                rows={4}
                className="mt-2"
              />
            </div>
          )}

          {claim?.notes && claim?.status !== 'draft' && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Adjuster Notes</p>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{claim.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {claim?.status === 'draft' && (
              <Button
                onClick={() => submitClaim.mutate()}
                className="flex-1 gap-2"
                disabled={!claim?.linked_assessments || claim.linked_assessments.length === 0}
              >
                <Send className="h-4 w-4" />
                Submit Claim
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}