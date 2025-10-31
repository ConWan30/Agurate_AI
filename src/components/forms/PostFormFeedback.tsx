import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, Send } from 'lucide-react';
import { FormType } from '@/hooks/use-conversational-form';

interface PostFormFeedbackProps {
  sessionId: string;
  formType: FormType;
  onComplete: () => void;
}

export const PostFormFeedback = ({ sessionId, formType, onComplete }: PostFormFeedbackProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [preferredMethod, setPreferredMethod] = useState<'conversational' | 'traditional' | ''>('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    if (!preferredMethod) {
      toast.error('Please select your preferred method');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save feedback
      const { error } = await supabase
        .from('beta_feedback')
        .insert({
          user_id: user.id,
          category: 'conversational-forms',
          rating,
          message: feedback,
          feature_context: JSON.stringify({
            sessionId,
            formType,
            preferredMethod,
            timestamp: new Date().toISOString()
          })
        });

      if (error) throw error;

      toast.success('Thank you for your feedback! 🎉');
      onComplete();

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>How was your experience? ⭐</CardTitle>
        <CardDescription>
          Your feedback helps us improve AgurateAI for all Louisiana Delta farmers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>Overall Experience</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Method */}
        <div className="space-y-2">
          <Label>Which form method do you prefer?</Label>
          <RadioGroup value={preferredMethod} onValueChange={(value) => setPreferredMethod(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="conversational" id="conversational" />
              <Label htmlFor="conversational" className="cursor-pointer">
                Conversational (Delta AI) - More intuitive and helpful
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="traditional" id="traditional" />
              <Label htmlFor="traditional" className="cursor-pointer">
                Traditional Form - More familiar and direct
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Feedback Text */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any suggestions for improvement? What did you like or dislike?"
            maxLength={1000}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {feedback.length}/1000 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || !preferredMethod}
            className="flex-1"
          >
            {submitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onComplete}
            disabled={submitting}
          >
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
