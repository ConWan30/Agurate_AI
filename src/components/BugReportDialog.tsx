import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bug, Camera } from "lucide-react";

interface BugReportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BugReportDialog({ open, onClose }: BugReportDialogProps) {
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'screenshot.png', { type: 'image/png' });
          setScreenshot(file);
          toast({
            title: "Screenshot captured",
            description: "Screenshot will be included with your bug report.",
          });
        }
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Screenshot failed",
        description: "Unable to capture screenshot. You can still submit the report.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing description",
        description: "Please describe the bug you encountered.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let screenshotPath: string | null = null;

      // Upload screenshot if available — persist storage path (not a 1h signed URL)
      if (screenshot) {
        // Owner-prefixed path required by crop-images storage RLS
        const fileName = `${user.id}/bug-reports/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('crop-images')
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;
        screenshotPath = fileName;
      }

      // Insert bug report
      const { data: report, error } = await supabase.from('bug_reports').insert({
        user_id: user.id,
        description: description.trim(),
        screenshot_url: screenshotPath,
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        status: 'open',
      }).select('id').maybeSingle();

      if (error) throw error;
      if (!report) {
        throw new Error('Bug report was not saved (insert returned no row or not permitted)');
      }

      toast({
        title: "🐛 Bug report submitted",
        description: "Thank you! We'll investigate and fix this as soon as possible.",
      });

      setDescription("");
      setScreenshot(null);
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit bug report';
      toast({
        variant: "destructive",
        title: "Error submitting bug report",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us fix issues by describing what went wrong
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">What happened? *</Label>
            <Textarea
              id="description"
              placeholder="Describe the bug: what you were doing, what you expected to happen, and what actually happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          {/* Screenshot Capture */}
          <div className="space-y-2">
            <Label>Screenshot (optional)</Label>
            <Button
              variant="outline"
              onClick={handleScreenshot}
              className="w-full"
              type="button"
            >
              <Camera className="h-4 w-4 mr-2" />
              {screenshot ? 'Screenshot Captured ✓' : 'Capture Screenshot'}
            </Button>
            {screenshot && (
              <p className="text-xs text-muted-foreground">
                Screenshot will be included with your report
              </p>
            )}
          </div>

          {/* Technical Info Note */}
          <div className="p-3 bg-accent rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Automatically included:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Current page URL</li>
              <li>Browser information</li>
              <li>Your account ID (for follow-up)</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
