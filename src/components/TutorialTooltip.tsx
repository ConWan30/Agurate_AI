import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialTooltipProps {
  steps: TutorialStep[];
  storageKey: string;
}

export default function TutorialTooltip({ steps, storageKey }: TutorialTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasCompletedTutorial = localStorage.getItem(storageKey);
    if (!hasCompletedTutorial) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 animate-scale-in">
        {/* Decorative elements */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <Sparkles className="h-8 w-8 text-primary animate-pulse cotton-drift" />
        </div>
        
        <Card className="relative border-2 border-primary/50 shadow-glow overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 gradient-delta opacity-5 field-shimmer" />
          
          <CardContent className="relative pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/30">
                  {step.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleComplete}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'w-10 bg-primary shadow-glow'
                        : idx < currentStep
                        ? 'w-6 bg-primary/60'
                        : 'w-2 bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="hover-lift"
                  >
                    ← Back
                  </Button>
                )}
                <Button 
                  onClick={handleNext} 
                  size="sm"
                  className="gradient-delta text-white hover-lift shadow-field"
                >
                  {currentStep < steps.length - 1 ? 'Next →' : '✓ Got it!'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
