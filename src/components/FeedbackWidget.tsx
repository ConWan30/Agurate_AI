import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, X, Star } from "lucide-react";

interface FeedbackWidgetProps {
  featureContext?: string;
  onClose?: () => void;
  compact?: boolean;
}

export function FeedbackWidget({ featureContext, onClose, compact = false }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleQuickFeedback = async (isPositive: boolean) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('beta_feedback').insert({
        user_id: user.id,
        rating: isPositive ? 5 : 2,
        category: 'general',
        message: isPositive ? 'Positive feedback' : 'Negative feedback',
        feature_context: featureContext,
      });

      if (error) throw error;

      toast({
        title: "Thanks for your feedback!",
        description: "Your input helps us improve AgurateAI.",
      });
      setSubmitted(true);
      setTimeout(() => onClose?.(), 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error submitting feedback",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedFeedback = async () => {
    if (rating === 0 || !category || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill out all fields before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('beta_feedback').insert({
        user_id: user.id,
        rating,
        category,
        message: message.trim(),
        feature_context: featureContext,
      });

      if (error) throw error;

      toast({
        title: "✅ Feedback submitted!",
        description: "Thank you for helping us improve AgurateAI.",
      });
      setSubmitted(true);
      setTimeout(() => onClose?.(), 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error submitting feedback",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <ThumbsUp className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium">Thanks for your feedback!</p>
            <p className="text-sm text-muted-foreground">
              Your input helps us build a better platform for Louisiana farmers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-sm font-medium text-center">Was this helpful?</p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickFeedback(true)}
                disabled={isSubmitting}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickFeedback(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                No
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Share Your Feedback</CardTitle>
            <CardDescription>
              Help us improve AgurateAI for Louisiana farmers
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div className="space-y-2">
          <Label>How would you rate this feature?</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Feedback Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="bug_report">Bug Report</SelectItem>
              <SelectItem value="improvement">Improvement Suggestion</SelectItem>
              <SelectItem value="accuracy">AI Accuracy Feedback</SelectItem>
              <SelectItem value="usability">Usability Issue</SelectItem>
              <SelectItem value="general">General Feedback</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Your Feedback</Label>
          <Textarea
            id="feedback"
            placeholder="Tell us what's working well or what could be better..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleDetailedFeedback}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}
