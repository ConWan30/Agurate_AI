import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TutorialFeedbackDialogProps {
  tutorialId: string;
  tutorialName: string;
  open: boolean;
  onClose: () => void;
}

export function TutorialFeedbackDialog({ 
  tutorialId, 
  tutorialName,
  open, 
  onClose 
}: TutorialFeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('tutorial_feedback').insert({
        tutorial_id: tutorialId,
        rating,
        comment: comment.trim() || null,
        user_id: user.id
      });
      if (error) throw error;

      toast.success('Thanks for your feedback! It helps us improve AgurateAI.');
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was the {tutorialName} tutorial?</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Star rating */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Rate your experience</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`h-10 w-10 cursor-pointer transition-all ${
                    (hoveredRating || rating) >= star
                      ? 'fill-primary text-primary scale-110'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {rating === 5 && "Excellent! 🌟"}
                {rating === 4 && "Great! 👍"}
                {rating === 3 && "Good"}
                {rating === 2 && "Needs improvement"}
                {rating === 1 && "Poor"}
              </p>
            )}
          </div>

          {/* Optional comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Any suggestions to improve this tutorial? (Optional)
            </label>
            <Textarea
              placeholder="Tell us what we can do better..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
