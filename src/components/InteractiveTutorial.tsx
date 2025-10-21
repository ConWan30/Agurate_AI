import { useState } from 'react';
import { Scan, TrendingUp, Brain, FileText, CheckCircle2, ArrowRight, X, AlertTriangle } from 'lucide-react';
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
      icon: Scan,
      title: 'Meet James: Louisiana Delta Farmer',
      description: 'A real-world story of AI-powered precision agriculture',
      content: (
        <div className="space-y-4">
          <p className="text-lg font-medium">Tuesday, 6:30 AM - Morehouse Parish, Louisiana</p>
          <p className="text-muted-foreground leading-relaxed">
            James walks his 400-acre soybean field. He notices some yellowing leaves in Section B. 
            In the past, he'd have to wait days for an extension agent visit or risk applying the 
            wrong treatment. Not anymore.
          </p>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <Scan className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Instant AI crop diagnosis from smartphone</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">7-day stress forecasts based on weather</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">LSU AgCenter research at his fingertips</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Automatic insurance documentation</span>
            </div>
          </div>
          <p className="text-sm text-primary font-medium pt-2">Let's see how James uses AgurateAI...</p>
        </div>
      ),
      action: "Start James's Story"
    },
    {
      icon: Scan,
      title: 'Core Feature #1: AI Crop Scanner',
      description: '6:35 AM - James scans the yellowing leaves',
      content: (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-green-500/20 to-yellow-500/20 flex items-center justify-center border-2 border-dashed border-primary/30">
              <div className="text-center">
                <Scan className="h-16 w-16 text-primary mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-medium">Opens phone camera • Takes 3 photos • GPS auto-tagged</p>
              </div>
            </div>
          </div>
          
          <Card className="border-primary/30 bg-gradient-to-br from-green-500/5 to-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold mb-1">AI Analysis Complete (1.2 seconds)</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Health Score: <span className="font-bold text-yellow-600">68%</span> (Moderate Stress)</p>
                    <p>• Likely Issue: <span className="font-medium">Potassium Deficiency</span></p>
                    <p>• Confidence: <span className="font-bold">94%</span></p>
                    <p>• Location: Section B, Row 14 (GPS tagged)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 LSU Pitch Value:</p>
            <p className="text-sm text-muted-foreground">
              Farmers get <span className="font-bold">instant diagnosis</span> anywhere in the field. 
              No extension agent needed for first-level assessment. Multiplies AgCenter reach by 1000x.
            </p>
          </div>
        </div>
      ),
      action: 'Next: Predictions'
    },
    {
      icon: TrendingUp,
      title: 'Core Feature #2: Predictive Analytics',
      description: '6:40 AM - James checks the 7-day forecast',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            James taps "Predictions." The AI combines his field history, current diagnosis, and 
            weather forecasts to predict stress levels for the next 7 days.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Today - Thursday</span>
              </div>
              <Badge className="bg-green-600 text-white">Low Risk</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Friday - Saturday</span>
              </div>
              <Badge className="bg-yellow-600 text-white">Medium Risk</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Sunday - Monday</span>
              </div>
              <Badge variant="destructive">High Risk - Heat Wave</Badge>
            </div>
          </div>

          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4">
              <p className="font-semibold mb-2">⚠️ Proactive Alert</p>
              <p className="text-sm text-muted-foreground">
                98°F+ temps forecasted Sunday-Monday. Combined with potassium deficiency, 
                expect severe stress. <span className="font-bold">Recommend treatment by Friday.</span>
              </p>
            </CardContent>
          </Card>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 LSU Research Integration:</p>
            <p className="text-sm text-muted-foreground">
              AI trained on LSU historical data: <span className="font-bold">Soybeans + potassium deficiency + 
              Louisiana heat = 72% yield loss risk.</span> Farmers act before damage is visible.
            </p>
          </div>
        </div>
      ),
      action: 'Next: Delta AI'
    },
    {
      icon: Brain,
      title: 'Core Feature #3: Delta Intelligence AI',
      description: '6:45 AM - James asks the AI advisor',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="font-semibold">Delta Intelligence Chat</span>
            </div>
            
            <div className="space-y-3">
              <div className="bg-card/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">James asks:</p>
                <p className="text-sm text-muted-foreground italic">
                  "Best potassium treatment for soybeans in Louisiana before a heat wave?"
                </p>
              </div>

              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Delta AI (LSU-trained):</p>
                <p className="text-sm text-muted-foreground">
                  "Based on LSU AgCenter research for Morehouse Parish soybeans:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>• Apply 60-80 lbs K₂O/acre via foliar spray</li>
                  <li>• Apply by Friday (before heat stress)</li>
                  <li>• Early morning application (before 10 AM)</li>
                  <li>• Expected recovery: 5-7 days</li>
                  <li>• Prevents 50-70% yield loss in heat events</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Source: LSU AgCenter Publication #3412 - Soybean Nutrient Management
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 LSU Partnership Value:</p>
            <p className="text-sm text-muted-foreground">
              Every farmer interaction feeds research data back to LSU. AI learns from 
              <span className="font-bold"> thousands of real Delta fields</span>, continuously improving 
              recommendations. Research becomes living, not static.
            </p>
          </div>
        </div>
      ),
      action: 'Next: Insurance'
    },
    {
      icon: FileText,
      title: 'Core Feature #4: Insurance Claims',
      description: 'Two weeks later - Automated damage documentation',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Despite treatment, a freak hailstorm hits Tuesday night. James needs to file an insurance 
            claim. In the past, this took <span className="font-bold">weeks of paperwork</span>.
          </p>

          <Card className="border-primary/30 bg-gradient-to-br from-blue-500/5 to-green-500/5">
            <CardContent className="p-4">
              <p className="font-semibold mb-3">📋 Auto-Generated Claim Package:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Pre-storm baseline: 23 photos, Health Score 68% → 92%</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Post-storm damage: 18 photos, Health Score 41%, GPS-tagged</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>AI damage assessment: Severe (87% confidence)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Weather data: Hail event confirmed (NOAA)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Timeline: Complete photo record (14 days)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-3 text-center">
                <p className="text-sm text-muted-foreground mb-1">Old Process</p>
                <p className="text-2xl font-bold text-red-700">21 days</p>
                <p className="text-xs text-muted-foreground">to file claim</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-3 text-center">
                <p className="text-sm text-muted-foreground mb-1">With AgurateAI</p>
                <p className="text-2xl font-bold text-green-700">8 minutes</p>
                <p className="text-xs text-muted-foreground">auto-generated</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 Farmer ROI:</p>
            <p className="text-sm text-muted-foreground">
              James gets his insurance payout <span className="font-bold">3 weeks faster</span> due to 
              AI-verified documentation. Stronger claims = better settlements. <span className="font-bold">$12,400 
              saved</span> in this scenario.
            </p>
          </div>
        </div>
      ),
      action: 'See The Impact'
    },
    {
      icon: CheckCircle2,
      title: 'The LSU AgCenter Partnership',
      description: 'Transforming Louisiana agriculture together',
      content: (
        <div className="space-y-4">
          <p className="text-lg font-medium">James's story repeats across Louisiana Delta farms:</p>
          
          <div className="grid gap-3">
            <Card className="border-primary/20 bg-gradient-to-r from-green-500/5 to-blue-500/5">
              <CardContent className="p-4">
                <p className="font-semibold mb-1">📱 For Farmers</p>
                <p className="text-sm text-muted-foreground">
                  Instant expertise • Proactive decisions • Faster insurance payouts
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
              <CardContent className="p-4">
                <p className="font-semibold mb-1">🎓 For LSU AgCenter</p>
                <p className="text-sm text-muted-foreground">
                  1000x reach multiplier • Live research feedback • Real Delta data
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
              <CardContent className="p-4">
                <p className="font-semibold mb-1">🌾 For Louisiana</p>
                <p className="text-sm text-muted-foreground">
                  Higher yields • Less crop loss • Leading precision ag innovation
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/30">
            <p className="text-center font-bold text-lg mb-2">Ready to be like James?</p>
            <p className="text-center text-sm text-muted-foreground">
              Start using the 4 core features that transformed his farm
            </p>
          </div>
        </div>
      ),
      action: 'Start Using AgurateAI'
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
