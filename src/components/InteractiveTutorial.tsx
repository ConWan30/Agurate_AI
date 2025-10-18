import { useState } from 'react';
import { Camera, MapPin, TrendingUp, Layers, Brain, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface InteractiveTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InteractiveTutorial({ open, onOpenChange }: InteractiveTutorialProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      icon: Camera,
      title: 'Welcome to AgurateAI',
      description: 'AI-powered crop health intelligence for Louisiana Delta farmers',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            This interactive tutorial will show you how to use AgurateAI to monitor your crops, 
            detect stress early, and get actionable recommendations.
          </p>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm">Take field photos with GPS auto-tagging</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm">Get AI-powered health analysis in seconds</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm">Receive LSU AgCenter-based recommendations</span>
            </div>
          </div>
        </div>
      ),
      action: 'Start Tutorial'
    },
    {
      icon: MapPin,
      title: 'Step 1: Create Your Fields',
      description: 'Add your crop fields with GPS coordinates',
      content: (
        <div className="space-y-4">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80" 
            alt="Field example" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start by adding your fields in the "My Fields" section. Include crop type (corn, cotton, 
            soybeans, rice), acreage, and GPS coordinates. This helps the AI provide region-specific insights.
          </p>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Pro Tip:</p>
              <p className="text-sm text-muted-foreground">
                GPS coordinates enable weather correlation and zone-specific treatment recommendations
              </p>
            </CardContent>
          </Card>
        </div>
      ),
      action: 'Next: Scan Crops'
    },
    {
      icon: Camera,
      title: 'Step 2: Mobile Field Scanner',
      description: 'Capture crop images with AR overlay',
      content: (
        <div className="space-y-4">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80" 
              alt="Crop scan" 
              className="w-full h-48 object-cover rounded-lg"
            />
            <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
              AR Mode
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Use the Mobile Field Scanner to take photos of your crops. Toggle AR mode for real-time 
            health overlays showing stress levels and confidence scores right on your camera feed.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-700">95%</p>
                <p className="text-xs text-muted-foreground">Health Score</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">&lt;2s</p>
                <p className="text-xs text-muted-foreground">AR Response</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      action: 'Next: AI Analysis'
    },
    {
      icon: Brain,
      title: 'Step 3: AI Analysis',
      description: 'Google Gemini analyzes crop health instantly',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="font-semibold">AI Vision Processing</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Detecting visual stress indicators</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Analyzing leaf color & disease patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Cross-referencing with weather data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Applying LSU AgCenter guidelines</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The AI provides health scores, stress levels, confidence ratings, and specific symptoms 
            detected. All analysis is tailored for Louisiana Delta conditions.
          </p>
        </div>
      ),
      action: 'Next: Predictions'
    },
    {
      icon: TrendingUp,
      title: 'Step 4: Predictive Analytics',
      description: 'Forecast crop stress 7 days ahead',
      content: (
        <div className="space-y-4">
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80" 
            alt="Analytics dashboard" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on your field history and weather patterns, AgurateAI predicts potential stress 
            events 3-7 days in advance. Get proactive recommendations before issues become visible.
          </p>
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-sm font-medium">High Risk Days</span>
              <Badge variant="outline" className="bg-red-500/20 text-red-700 border-red-500/30">
                2 detected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <span className="text-sm font-medium">Medium Risk Days</span>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                3 detected
              </Badge>
            </div>
          </div>
        </div>
      ),
      action: 'Next: Benefits'
    },
    {
      icon: Layers,
      title: 'You\'re All Set!',
      description: 'Start monitoring your crops with AI',
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <Card className="border-primary/20 hover-lift cursor-pointer" onClick={() => {
              onOpenChange(false);
              navigate('/fields');
            }}>
              <CardContent className="p-4 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Add Your First Field</p>
                  <p className="text-xs text-muted-foreground">Create fields to start tracking</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover-lift cursor-pointer" onClick={() => {
              onOpenChange(false);
              navigate('/scanner');
            }}>
              <CardContent className="p-4 flex items-center gap-3">
                <Camera className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Try the Field Scanner</p>
                  <p className="text-xs text-muted-foreground">Capture your first crop image</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover-lift cursor-pointer" onClick={() => {
              onOpenChange(false);
              navigate('/how-it-works');
            }}>
              <CardContent className="p-4 flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Learn How It Works</p>
                  <p className="text-xs text-muted-foreground">Deep dive into the AI technology</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      action: 'Get Started'
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onOpenChange(false);
      setStep(0);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-delta shadow-glow flex items-center justify-center">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {currentStep.content}
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step 
                  ? 'w-8 bg-primary' 
                  : idx < step 
                  ? 'w-2 bg-primary/50' 
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <Button variant="ghost" onClick={handleSkip} className="gap-2">
            <X className="h-4 w-4" />
            {step === steps.length - 1 ? 'Close' : 'Skip Tutorial'}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="gap-2">
              {currentStep.action}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
