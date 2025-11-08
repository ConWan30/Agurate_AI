import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-handler';

interface TreatmentOutcomeDialogProps {
  open: boolean;
  onClose: () => void;
  recommendation: {
    id: string;
    recommendation_text: string;
    category: string;
    estimated_cost?: number;
  };
  fieldId: string;
  fieldName: string;
  cropType: string;
  healthScoreBefore: number; // 0-100
  stressLevel?: string;
  symptoms?: string[];
}

export function TreatmentOutcomeDialog({
  open,
  onClose,
  recommendation,
  fieldId,
  fieldName,
  cropType,
  healthScoreBefore,
  stressLevel,
  symptoms = []
}: TreatmentOutcomeDialogProps) {
  const { toast } = useToast();
  const [outcome, setOutcome] = useState<'success' | 'partial' | 'failure' | null>(null);
  const [healthScoreAfter, setHealthScoreAfter] = useState<string>('');
  const [daysAfter, setDaysAfter] = useState<string>('');
  const [costPerAcre, setCostPerAcre] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract treatment type from category
  const getTreatmentType = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('pest') || categoryLower.includes('disease')) return 'fungicide';
    if (categoryLower.includes('fertil')) return 'fertilizer';
    if (categoryLower.includes('irrigat')) return 'irrigation';
    if (categoryLower.includes('herbic')) return 'herbicide';
    return 'general';
  };

  // Extract treatment name from recommendation text
  const extractTreatmentName = (text: string): string => {
    // Common treatment names to look for
    const treatments = [
      'azoxystrobin', 'propiconazole', 'tebuconazole', 'flutriafol',
      'urea', 'ammonium', 'nitrogen', 'phosphorus', 'potassium',
      'glyphosate', '2,4-D', 'atrazine'
    ];
    
    const textLower = text.toLowerCase();
    for (const treatment of treatments) {
      if (textLower.includes(treatment)) {
        return treatment;
      }
    }
    
    // Fallback: extract first few words
    return text.split(' ').slice(0, 3).join(' ');
  };

  const handleSubmit = async () => {
    if (!outcome) {
      toast({
        title: 'Please select an outcome',
        variant: 'destructive'
      });
      return;
    }

    if (!healthScoreAfter || !daysAfter) {
      toast({
        title: 'Please provide health score and days after treatment',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Please sign in to log treatment outcomes',
          variant: 'destructive'
        });
        return;
      }

      const healthAfter = parseFloat(healthScoreAfter);
      const days = parseInt(daysAfter);
      const cost = costPerAcre ? parseFloat(costPerAcre) : (recommendation.estimated_cost || 0);

      if (isNaN(healthAfter) || healthAfter < 0 || healthAfter > 100) {
        toast({
          title: 'Health score must be between 0 and 100',
          variant: 'destructive'
        });
        return;
      }

      if (isNaN(days) || days < 0) {
        toast({
          title: 'Days after treatment must be a positive number',
          variant: 'destructive'
        });
        return;
      }

      const improvement = healthAfter - healthScoreBefore;
      const improvementPercentage = healthScoreBefore > 0 
        ? (improvement / healthScoreBefore) * 100 
        : 0;
      
      const success = outcome === 'success' || (outcome === 'partial' && improvementPercentage > 5);

      const { error } = await supabase
        .from('peer_treatment_outcomes')
        .insert({
          user_id: user.id,
          field_id: fieldId,
          treatment_type: getTreatmentType(recommendation.category),
          treatment_name: extractTreatmentName(recommendation.recommendation_text),
          application_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          health_score_before: healthScoreBefore,
          health_score_after: healthAfter,
          health_score_after_days: days,
          success,
          improvement_percentage: improvementPercentage,
          cost_per_acre: cost,
          crop_type: cropType,
          stress_level_before: stressLevel || null,
          symptoms_before: symptoms,
          symptoms_after: [], // Could be enhanced later
          anonymized: true
        });

      if (error) throw error;

      toast({
        title: 'Treatment outcome logged successfully!',
        description: 'Your feedback helps improve recommendations for all farmers.',
      });

      // Reset form
      setOutcome(null);
      setHealthScoreAfter('');
      setDaysAfter('');
      setCostPerAcre('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error logging treatment outcome:', error);
      toast({
        title: 'Failed to log treatment outcome',
        description: getErrorMessage(error),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Treatment Outcome</DialogTitle>
          <DialogDescription>
            Help improve recommendations by sharing your treatment results. Your data is anonymized for community comparison.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Treatment Info */}
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Treatment:</p>
            <p className="text-sm text-muted-foreground">{recommendation.recommendation_text}</p>
            <p className="text-xs text-muted-foreground mt-1">Field: {fieldName}</p>
          </div>

          {/* Outcome Selection */}
          <div className="space-y-3">
            <Label>How did the treatment work?</Label>
            <RadioGroup value={outcome || ''} onValueChange={(value) => setOutcome(value as typeof outcome)}>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="success" id="success" />
                <Label htmlFor="success" className="flex-1 cursor-pointer flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Successful - Significant improvement</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="flex-1 cursor-pointer flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>Partial - Some improvement</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="failure" id="failure" />
                <Label htmlFor="failure" className="flex-1 cursor-pointer flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Not effective - No improvement</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Health Score After */}
          <div className="space-y-2">
            <Label htmlFor="healthAfter">Health Score After Treatment (0-100)</Label>
            <Input
              id="healthAfter"
              type="number"
              min="0"
              max="100"
              value={healthScoreAfter}
              onChange={(e) => setHealthScoreAfter(e.target.value)}
              placeholder="e.g., 85"
            />
            <p className="text-xs text-muted-foreground">
              Current health score: {healthScoreBefore.toFixed(0)}%
            </p>
          </div>

          {/* Days After Treatment */}
          <div className="space-y-2">
            <Label htmlFor="daysAfter">Days After Treatment</Label>
            <Input
              id="daysAfter"
              type="number"
              min="1"
              value={daysAfter}
              onChange={(e) => setDaysAfter(e.target.value)}
              placeholder="e.g., 7"
            />
            <p className="text-xs text-muted-foreground">
              How many days after applying the treatment did you measure this?
            </p>
          </div>

          {/* Cost Per Acre */}
          <div className="space-y-2">
            <Label htmlFor="costPerAcre">Cost Per Acre (Optional)</Label>
            <Input
              id="costPerAcre"
              type="number"
              min="0"
              step="0.01"
              value={costPerAcre}
              onChange={(e) => setCostPerAcre(e.target.value)}
              placeholder={`e.g., ${recommendation.estimated_cost?.toFixed(2) || '30.00'}`}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !outcome}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                'Log Outcome'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

