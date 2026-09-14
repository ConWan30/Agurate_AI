import { useState, useEffect } from 'react';
import { Scan, TrendingUp, Brain, FileText, CheckCircle2, ArrowRight, X, AlertTriangle, Sprout, Cloud, Zap, Target, Compass, MapPin, Users, Leaf, GraduationCap, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTutorialTracking } from '@/hooks/use-tutorial-tracking';

interface InteractiveTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InteractiveTutorial({ open, onOpenChange }: InteractiveTutorialProps) {
  const [step, setStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { trackEvent } = useTutorialTracking('interactive');

  useEffect(() => {
    if (open) {
      trackEvent('welcome', 'started');
      setStartTime(Date.now());
    }
  }, [open]);

  // Simulate scanning animation
  useEffect(() => {
    if (step === 1 && open) {
      setScanProgress(0);
      setIsAnimating(true);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsAnimating(false);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step, open]);

  const steps = [
    {
      icon: Compass,
      title: 'Welcome to the Louisiana Delta',
      description: 'Your AI-powered partner in precision agriculture',
      content: (
        <div className="space-y-6">
          {/* Animated Hero Section */}
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-8">
            <div className="absolute inset-0 field-shimmer opacity-30" />
            <div className="relative z-10 text-center space-y-4">
              <Sprout className="h-16 w-16 mx-auto text-primary animate-bounce delta-wave" />
              <h3 className="text-2xl font-bold text-gradient-delta">AgurateAI Platform</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Where Louisiana farming tradition meets AI-assisted field tools
              </p>
            </div>
            {/* Floating elements */}
            <Cloud className="absolute top-4 right-4 h-8 w-8 text-secondary/30 cotton-drift" />
            <MapPin className="absolute bottom-4 left-4 h-6 w-6 text-primary/30 animate-pulse" />
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg glass-strong hover-lift cursor-pointer transition-all group">
              <Scan className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold mb-1">AI Scanner</p>
              <p className="text-xs text-muted-foreground">Fast phone-camera crop health read</p>
            </div>
            <div className="p-4 rounded-lg glass-strong hover-lift cursor-pointer transition-all group">
              <TrendingUp className="h-8 w-8 text-secondary mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold mb-1">Predictions</p>
              <p className="text-xs text-muted-foreground">7-day stress forecasting</p>
            </div>
            <div className="p-4 rounded-lg glass-strong hover-lift cursor-pointer transition-all group">
              <Brain className="h-8 w-8 text-accent mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold mb-1">Delta AI</p>
              <p className="text-xs text-muted-foreground">Research-backed advisor</p>
            </div>
            <div className="p-4 rounded-lg glass-strong hover-lift cursor-pointer transition-all group">
              <FileText className="h-8 w-8 text-success mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold mb-1">Insurance</p>
              <p className="text-xs text-muted-foreground">Field notes for claims</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <Target className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Follow James's journey</span> – an illustrative Louisiana Delta scenario showing how a grower might use AI on a multi-field operation
            </p>
          </div>
        </div>
      ),
      action: "Begin Journey →"
    },
    {
      icon: Scan,
      title: 'AI Crop Scanner in Action',
      description: 'Tuesday, 6:35 AM - Section B, Morehouse Parish',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            James notices yellowing leaves in Section B. He pulls out his phone and opens AgurateAI Scanner...
          </p>

          {/* Interactive Scanning Simulation */}
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-success/5 via-warning/5 to-destructive/5">
            <div className="aspect-video flex items-center justify-center p-6">
              {scanProgress === 0 && (
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="relative">
                    <Scan className="h-20 w-20 text-primary mx-auto animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">📱 Camera Opens</p>
                    <p className="text-xs text-muted-foreground">Focuses on yellowing leaves</p>
                  </div>
                </div>
              )}
              
              {scanProgress > 0 && scanProgress < 100 && (
                <div className="w-full space-y-4 animate-fade-in">
                  <div className="text-center">
                    <Zap className="h-16 w-16 text-primary mx-auto mb-3 animate-spin" />
                    <p className="text-sm font-semibold mb-2">AI Analysis in Progress...</p>
                  </div>
                  <Progress value={scanProgress} className="h-3" />
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div className={scanProgress > 30 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                      Vision AI
                      {scanProgress > 30 && <CheckCircle2 className="h-3 w-3 inline ml-1" />}
                    </div>
                    <div className={scanProgress > 60 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                      Pattern Match
                      {scanProgress > 60 && <CheckCircle2 className="h-3 w-3 inline ml-1" />}
                    </div>
                    <div className={scanProgress > 90 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                      Assessment
                      {scanProgress > 90 && <CheckCircle2 className="h-3 w-3 inline ml-1" />}
                    </div>
                  </div>
                </div>
              )}

              {scanProgress === 100 && (
                <div className="w-full space-y-3 animate-scale-in">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success animate-bounce" />
                    <span className="text-lg font-bold text-success">Analysis Complete!</span>
                  </div>
                  
                  <Card className="border-warning/30 bg-warning/5">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Health Score</span>
                        <Badge className="bg-warning text-warning-foreground">Example</Badge>
                      </div>
                      <Progress value={68} className="h-2" />
                      <p className="text-xs text-muted-foreground">Moderate Stress Detected</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-card border">
                      <p className="text-muted-foreground mb-1">Issue</p>
                      <p className="font-semibold">K Deficiency</p>
                    </div>
                    <div className="p-2 rounded bg-card border">
                      <p className="text-muted-foreground mb-1">Confidence</p>
                      <p className="font-semibold text-success">Model estimate</p>
                    </div>
                    <div className="p-2 rounded bg-card border">
                      <p className="text-muted-foreground mb-1">Location</p>
                      <p className="font-semibold text-xs">Row 14</p>
                    </div>
                    <div className="p-2 rounded bg-card border">
                      <p className="text-muted-foreground mb-1">Time</p>
                      <p className="font-semibold">1.2s</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg glass border border-primary/20">
            <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold mb-1">Why This Matters</p>
              <p className="text-xs text-muted-foreground">
                Traditional field assessment takes 3-7 days waiting for extension agent. 
                <span className="font-semibold text-foreground"> AgurateAI walks through an illustrative scan flow</span>, 
                enabling immediate action before damage spreads.
              </p>
            </div>
          </div>
        </div>
      ),
      action: 'Next: Predictions →'
    },
    {
      icon: TrendingUp,
      title: 'Core Feature #2: Predictive Analytics',
      description: '6:40 AM - James checks the 7-day forecast',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            James taps "Predictions." The AI combines his field history, current assessment, and 
            weather forecasts to predict stress levels for the next 7 days.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-health-good/10 border border-health-good/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-health-good" />
                <span className="text-sm font-medium">Today - Thursday</span>
              </div>
              <Badge className="bg-health-good text-white">Low Risk</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-health-moderate/10 border border-health-moderate/30 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-health-moderate" />
                <span className="text-sm font-medium">Friday - Saturday</span>
              </div>
              <Badge className="bg-health-moderate text-white">Medium Risk</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-health-severe/10 border border-health-severe/30 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-health-severe" />
                <span className="text-sm font-medium">Sunday - Monday</span>
              </div>
              <Badge variant="destructive">High Risk - Heat Wave</Badge>
            </div>
          </div>

          <Card className="border-health-severe/30 bg-health-severe/5">
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
              AI framed around public LSU research patterns: <span className="font-bold">Soybeans + potassium deficiency + 
              Louisiana heat = elevated yield-loss risk.</span> Farmers act before damage is visible.
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
                <p className="text-sm font-medium mb-2">Delta AI (illustrative demo reply):</p>
                <p className="text-sm text-muted-foreground">
                  "For soybeans heading into a forecast heat stretch in the Delta, publicly available LSU AgCenter nutrient guidance often discusses potassium management. In the live product, any rates or timing should come from your recorded soil tests and local AgCenter guidance — this demo does not invent a prescription.
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>• Review your latest soil-test K notes (farmer-recorded)</li>
                  <li>• Check the heat-wave window in your weather forecast</li>
                  <li>• Prefer cooler application windows when treating</li>
                  <li>• Re-assess after stress passes — recovery timing varies</li>
                  <li>• Ask your parish agent before changing rates</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Illustrative decision-aid demo only — not an LSU prescription or measured outcome.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 Research-informed value:</p>
            <p className="text-sm text-muted-foreground">
              Guidance is framed around publicly available LSU AgCenter research for Delta conditions.
              AgurateAI is not an official LSU partner and does not claim that farmer interactions train LSU models.
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
                  <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" />
                  <span>Illustrative pre-storm baseline photos and health trend</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" />
                  <span>Illustrative post-storm damage photos with location tags</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" />
                  <span>Illustrative AI damage assessment (example confidence only)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" />
                  <span>Weather data: Hail event confirmed (NOAA)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" />
                  <span>Timeline: Complete photo record (14 days)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-health-severe/20 bg-health-severe/5">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Waiting on paper trails</p>
                <p className="text-2xl font-bold text-health-severe">Slow</p>
              </CardContent>
            </Card>
            
            <Card className="border-health-good/20 bg-health-good/5">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">With timestamped field notes</p>
                <p className="text-2xl font-bold text-health-good">Ready sooner</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">🎯 Documentation benefit:</p>
            <p className="text-sm text-muted-foreground">
              James uses timestamped AI field notes to support his insurance claim. Clearer evidence can
              help adjusters review cases — outcomes vary by carrier and are not guaranteed.
            </p>
          </div>
        </div>
      ),
      action: 'See The Impact'
    },
    {
      icon: CheckCircle2,
      title: 'Research-informed Delta guidance',
      description: 'Framed around public LSU AgCenter research — not an official partnership',
      content: (
        <div className="space-y-4">
          <p className="text-lg font-medium">James's story repeats across Louisiana Delta farms:</p>
          
          <div className="grid gap-3">
            <Card className="border-primary/20 bg-gradient-to-r from-green-500/5 to-blue-500/5">
              <CardContent className="p-4">
                <p className="font-semibold mb-1">📱 For Farmers</p>
                <p className="text-sm text-muted-foreground">
                  Research-framed guidance • Proactive decisions • Clearer insurance documentation
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
              <CardContent className="p-4">
                <p className="font-semibold mb-1">🎓 Research framing</p>
                <p className="text-sm text-muted-foreground">
                  Public LSU AgCenter guidance cited as context — not an official endorsement or data-sharing partnership
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
              <CardContent className="p-4">
                <p className="font-semibold mb-1">🌾 For Louisiana</p>
                <p className="text-sm text-muted-foreground">
                  Decision support for Delta conditions • Documented field history
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
      action: 'Next: Field Maps'
    },
    {
      icon: MapPin,
      title: 'Core Feature #5: Interactive Field Maps',
      description: 'Visualize crop health across your entire operation',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Every assessment James makes is <span className="font-bold">GPS-tagged automatically</span>, 
            creating a living map of his 400-acre operation.
          </p>
          <Card className="border-primary/30 bg-gradient-to-br from-green-500/5 to-blue-500/5">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/30">
                  <MapPin className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Healthy: 72%</p>
                </div>
                <div className="text-center p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                  <MapPin className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Moderate: 23%</p>
                </div>
                <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/30">
                  <MapPin className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Severe: 5%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Heat map shows Section B needs immediate attention</p>
            </CardContent>
          </Card>
        </div>
      ),
      action: 'Next: Weather Timeline'
    },
    {
      icon: Cloud,
      title: 'Core Feature #6: Weather Timeline',
      description: 'Understand environmental impact on crop health',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            AgurateAI correlates <span className="font-bold">every assessment with weather patterns</span>, 
            revealing cause-and-effect relationships James never saw before.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <span>June 8: Heat wave (98°F)</span>
              <ArrowRight className="h-4 w-4" />
              <span className="text-destructive">Health dropped 32%</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <span>June 15: Rainfall (2.3")</span>
              <ArrowRight className="h-4 w-4" />
              <span className="text-primary">Health recovered 18%</span>
            </div>
          </div>
        </div>
      ),
      action: 'Next: Cooperatives'
    },
    {
      icon: Users,
      title: 'Core Feature #7: Community Intelligence',
      description: 'Shared wisdom across Louisiana Delta farms',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            James joins <span className="font-bold">Delta Farmers Co-op</span> with 24 neighboring farms. 
            Anonymous data sharing creates early warning systems.
          </p>
          <Card className="border-primary/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardContent className="p-4">
              <p className="font-semibold mb-2 text-sm">🚨 Early Outbreak Alert:</p>
              <p className="text-xs text-muted-foreground">
                "3 farms within 10 miles reported possible <span className="font-bold text-destructive">rice blast</span> symptoms.
                Check your fields soon. Public LSU AgCenter disease guides discuss preventative options — confirm with your parish agent before treating."
              </p>
              <Badge className="mt-2 text-xs">Helped James act before stress worsened</Badge>
            </CardContent>
          </Card>
        </div>
      ),
      action: 'Next: Conservation'
    },
    {
      icon: Leaf,
      title: 'Core Feature #8: Conservation Tracking',
      description: 'Sustainable farming meets profitability',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            James logs his <span className="font-bold">conservation practices</span> for USDA documentation.
            AgurateAI helps organize practice history — it does not promise dollar savings.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">No-Till + Cover Crops</p>
                <p className="text-sm font-bold text-green-600">Conservation practices</p>
                <p className="text-xs text-muted-foreground">Track locally; savings vary</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Multi-year outlook</p>
                <p className="text-sm font-bold text-green-600">Illustrative only</p>
                <p className="text-xs text-muted-foreground">Not a guaranteed return</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      action: 'Next: LSU directory'
    },
    {
      icon: GraduationCap,
      title: 'Core Feature #9: LSU AgCenter directory',
      description: 'Public researcher profiles — contact via official LSU channels',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            When AI guidance is not enough, James can browse a <span className="font-bold">public LSU AgCenter researcher directory</span> and reach specialists through official LSU channels. AgurateAI does not broker introductions.
          </p>
          <Card className="border-primary/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardContent className="p-4">
              <p className="font-semibold mb-2 text-sm">🎓 Example public profile:</p>
              <p className="text-sm font-medium mb-1">Dr. Sarah Martinez</p>
              <p className="text-xs text-muted-foreground">
                Rice Pathology Specialist • Louisiana Delta research focus
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Contact through official LSU AgCenter channels. AgurateAI stores your consultation note locally and does not send cases to researchers.
              </p>
            </CardContent>
          </Card>
        </div>
      ),
      action: 'Next: Analytics'
    },
    {
      icon: BarChart3,
      title: 'Core Feature #10: Comprehensive Analytics',
      description: 'Data-driven insights for better decisions',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            James reviews his <span className="font-bold">complete farming dashboard</span>, 
            tracking field performance, treatment effectiveness, and ROI.
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-primary/5 rounded border border-primary/20">
              <p className="text-sm font-semibold mb-1">This Season&apos;s Activity:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="font-bold">127</span> assessments</div>
                <div><span className="font-bold">Illustrative</span> planning value</div>
                <div><span className="font-bold">4</span> issues flagged early</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Example walkthrough only — not a verified customer result.
          </p>
        </div>
      ),
      action: 'Start Using AgurateAI'
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    trackEvent(`step-${step}`, 'completed', timeSpent);
    
    if (step < steps.length - 1) {
      setStep(step + 1);
      setStartTime(Date.now());
    } else {
      trackEvent('all', 'completed', timeSpent);
      onOpenChange(false);
      setStep(0);
    }
  };

  const handleSkip = () => {
    trackEvent(`step-${step}`, 'skipped');
    onOpenChange(false);
    setStep(0);
  };

  const tutorialContent = (
    <>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-xl gradient-delta shadow-glow flex items-center justify-center">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{currentStep.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">{currentStep.content}</div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step ? 'w-12 bg-primary' : idx < step ? 'w-8 bg-primary/60' : 'w-6 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={handleSkip}>
          <X className="h-4 w-4 mr-2" />
          {step === steps.length - 1 ? 'Close' : 'Skip'}
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              ← Back
            </Button>
          )}
          <Button onClick={handleNext} className="gradient-delta text-white">
            {currentStep.action}
            {step < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] px-4 pb-4">
          {tutorialContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {tutorialContent}
      </DialogContent>
    </Dialog>
  );
}
