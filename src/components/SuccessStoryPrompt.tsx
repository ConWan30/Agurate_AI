import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, DollarSign, MapPin } from "lucide-react";

interface SuccessStoryPromptProps {
  open: boolean;
  onClose: () => void;
  assessmentId?: string;
}

export function SuccessStoryPrompt({ open, onClose, assessmentId }: SuccessStoryPromptProps) {
  const [problemEncountered, setProblemEncountered] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [outcome, setOutcome] = useState("");
  const [estimatedSavings, setEstimatedSavings] = useState("");
  const [acresProtected, setAcresProtected] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [allowPublicUse, setAllowPublicUse] = useState(false);
  const [allowName, setAllowName] = useState(false);
  const [allowFarmName, setAllowFarmName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!problemEncountered || !actionTaken || !outcome || !testimonial) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill out all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const parsedSavings = estimatedSavings.trim()
        ? Number(estimatedSavings)
        : null;
      const parsedAcres = acresProtected.trim()
        ? Number(acresProtected)
        : null;
      if (parsedSavings != null && (!Number.isFinite(parsedSavings) || parsedSavings < 0)) {
        toast({
          variant: "destructive",
          title: "Invalid savings amount",
          description: "Estimated savings must be a number greater than or equal to 0.",
        });
        return;
      }
      if (parsedAcres != null && (!Number.isFinite(parsedAcres) || parsedAcres < 0)) {
        toast({
          variant: "destructive",
          title: "Invalid acres protected",
          description: "Acres protected must be a number greater than or equal to 0.",
        });
        return;
      }

      const { error } = await supabase.from('success_stories').insert({
        user_id: user.id,
        assessment_id: assessmentId,
        problem_encountered: problemEncountered.trim(),
        action_taken: actionTaken.trim(),
        outcome: outcome.trim(),
        estimated_savings: parsedSavings,
        acres_protected: parsedAcres,
        testimonial: testimonial.trim(),
        allow_public_use: allowPublicUse,
        allow_name: allowName,
        allow_farm_name: allowFarmName,
      });

      if (error) throw error;

      toast({
        title: "🏆 Success story saved!",
        description: "Thanks for sharing. Public display requires moderation approval before it appears publicly.",
      });
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save success story';
      toast({
        variant: "destructive",
        title: "Error saving success story",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-primary" />
            Share Your Success Story
          </DialogTitle>
          <DialogDescription>
            Your experience helps other Louisiana farmers and improves this closed beta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Problem Encountered */}
          <div className="space-y-2">
            <Label htmlFor="problem">What crop problem did you encounter? *</Label>
            <Textarea
              id="problem"
              placeholder="e.g., Noticed yellowing leaves on 50 acres of soybeans..."
              value={problemEncountered}
              onChange={(e) => setProblemEncountered(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Taken */}
          <div className="space-y-2">
            <Label htmlFor="action">What action did you take based on AgurateAI? *</Label>
            <Textarea
              id="action"
              placeholder="e.g., AI detected early stage soybean rust. Applied fungicide within 24 hours..."
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              rows={3}
            />
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">What was the result? *</Label>
            <Textarea
              id="outcome"
              placeholder="e.g., Stopped disease spread, saved majority of crop, yield only decreased 5%..."
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
            />
          </div>

          {/* Financial Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="savings" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Estimated Savings
              </Label>
              <Input
                id="savings"
                type="number"
                placeholder="e.g., 15000"
                value={estimatedSavings}
                onChange={(e) => setEstimatedSavings(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acres" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Acres Protected
              </Label>
              <Input
                id="acres"
                type="number"
                placeholder="e.g., 180"
                value={acresProtected}
                onChange={(e) => setAcresProtected(e.target.value)}
              />
            </div>
          </div>

          {/* Testimonial */}
          <div className="space-y-2">
            <Label htmlFor="testimonial">Your testimonial (in your own words) *</Label>
            <Textarea
              id="testimonial"
              placeholder="e.g., AgurateAI helped me spot stress earlier than I would have on my own. Here's what changed for my fields..."
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              rows={4}
            />
          </div>

          {/* Permission Settings */}
          <div className="space-y-3 p-4 bg-accent rounded-lg">
            <p className="text-sm font-medium">Privacy Preferences</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public"
                  checked={allowPublicUse}
                  onCheckedChange={(checked) => setAllowPublicUse(checked as boolean)}
                />
                <label
                  htmlFor="public"
                  className="text-sm cursor-pointer leading-tight"
                >
                  Allow AgurateAI to share this story publicly (website, presentations, closed-beta materials)
                </label>
              </div>
              {allowPublicUse && (
                <>
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="name"
                      checked={allowName}
                      onCheckedChange={(checked) => setAllowName(checked as boolean)}
                    />
                    <label htmlFor="name" className="text-sm cursor-pointer">
                      Include my name
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="farmName"
                      checked={allowFarmName}
                      onCheckedChange={(checked) => setAllowFarmName(checked as boolean)}
                    />
                    <label htmlFor="farmName" className="text-sm cursor-pointer">
                      Include my farm name
                    </label>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your story will help other Louisiana farmers during this closed beta. 
              You can remain anonymous if preferred.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Share Success Story'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
