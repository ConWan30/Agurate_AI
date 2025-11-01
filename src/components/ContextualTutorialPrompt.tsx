import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContextualTutorialPromptProps {
  condition: boolean;
  message: string;
  tutorialLink: string;
}

export function ContextualTutorialPrompt({ 
  condition, 
  message, 
  tutorialLink 
}: ContextualTutorialPromptProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !condition) return null;

  return (
    <Card className="border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-500">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            onClick={() => navigate(tutorialLink)}
            className="whitespace-nowrap"
          >
            Learn How
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setDismissed(true)}
            className="h-9 w-9 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
