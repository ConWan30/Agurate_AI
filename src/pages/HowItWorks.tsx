import { Camera, Cloud, Brain, FileText, TrendingUp, Layers, MapPin, Zap, ArrowRight, ArrowLeft, Database, GitBranch, Network, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { useNavigate, Link } from 'react-router-dom';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import bgDeltaRice from "@/assets/bg-delta-rice.jpg";

export default function HowItWorks() {
  const navigate = useNavigate();

  const aiPipeline = [
    {
      icon: Database,
      title: 'Context Gathering',
      description: 'AI pulls your last 10 assessments, conservation practices, variety performance, weather history, community insights, and water stress predictions',
      tech: 'Unified Intelligence Pool Query',
      color: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
    },
    {
      icon: Brain,
      title: 'Enhanced Vision Analysis',
      description: 'Gemini 2.5 analyzes your photo WITH full field context—comparing to historical progression, variety-specific disease signatures, weather patterns, and successful community interventions',
      tech: 'Gemini 2.5 Pro + Unified Context',
      color: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
    },
    {
      icon: GitBranch,
      title: 'Parallel AI Enrichment',
      description: 'Simultaneously runs water stress prediction, conservation impact assessment, variety recommendations, community pattern matching, and predictive analytics—all informed by vision results',
      tech: 'Multi-Model Parallel Processing',
      color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20'
    },
    {
      icon: Network,
      title: 'Intelligence Pool Update',
      description: 'New insights are fed back into the central pool, creating patterns that enhance all future analyses for your field and similar farms',
      tech: 'Circular Data Enrichment',
      color: 'bg-green-500/10 text-green-700 border-green-500/20'
    },
    {
      icon: TrendingUp,
      title: 'Unified Recommendations',
      description: 'AI synthesizes all parallel analyses into prioritized actions, matching you with LSU researchers if needed, and updating predictive forecasts',
      tech: 'Multi-Source Recommendation Engine',
      color: 'bg-orange-500/10 text-orange-700 border-orange-500/20'
    },
    {
      icon: Layers,
      title: 'Continuous Learning',
      description: 'Every analysis makes the system smarter—building variety-specific disease libraries, weather correlation patterns, and conservation effectiveness data',
      tech: 'Self-Improving Intelligence',
      color: 'bg-pink-500/10 text-pink-700 border-pink-500/20'
    }
  ];

  const dataFlow = [
    { from: 'Field Photo/Video', to: 'Secure Cloud Storage', detail: 'Supabase Storage (encrypted)' },
    { from: 'Media URL', to: 'AI Analysis', detail: 'Lovable AI Gateway (Video/Image)' },
    { from: 'Visual Symptoms', to: 'Database', detail: 'PostgreSQL with RLS' },
    { from: 'Weather API', to: 'Correlation Engine', detail: 'Real-time enrichment' },
    { from: 'Historical Data', to: 'Predictions', detail: 'Pattern recognition' },
  ];

  const useCases = [
    {
      icon: Zap,
      title: 'Early Disease Detection',
      scenario: 'Detect cotton blight 10+ days before visible to naked eye',
      impact: 'Save entire crop by treating early',
      savings: '$500-2000/acre'
    },
    {
      icon: Cloud,
      title: 'Weather Stress Prevention',
      scenario: 'Predict heat stress 5-7 days ahead during Louisiana summers',
      impact: 'Adjust irrigation before damage occurs',
      savings: '15-30% yield protection'
    },
    {
      icon: MapPin,
      title: 'Drone-Powered Field Mapping',
      scenario: 'Upload drone video to identify stressed zones across entire 50-acre field in one analysis',
      impact: 'Comprehensive aerial view shows patterns invisible from ground level',
      savings: '60% faster field assessment'
    },
    {
      icon: TrendingUp,
      title: 'Seasonal Planning',
      scenario: 'Historical analysis shows optimal planting window for your specific field',
      impact: 'Plant at peak time for soil/weather conditions',
      savings: '10-20% yield increase'
    }
  ];

  const enhancedFeatures = [
    {
      icon: DollarSign,
      title: 'Automated ROI Calculator',
      description: 'AI calculates real-time return on investment for every recommendation, factoring in treatment costs, yield protection, and market prices',
      benefit: '$8K-20K annual savings documented',
      color: 'bg-health-good/10 text-health-good border-health-good/20'
    },
    {
      icon: Brain,
      title: 'Daily AI Briefing',
      description: 'Wake up to personalized field intelligence: overnight weather impacts, urgent actions needed, and 7-day stress forecasts delivered to your dashboard',
      benefit: '10 minutes saved daily',
      color: 'bg-secondary/10 text-secondary border-secondary/20'
    },
    {
      icon: FileText,
      title: 'Conversational Forms',
      description: 'Just talk to your phone—AI extracts field data, planting dates, and crop varieties from natural conversation. Voice-to-data in seconds',
      benefit: '80% faster data entry',
      color: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
    },
    {
      icon: Cloud,
      title: 'Water Stress Intelligence',
      description: 'Predictive irrigation alerts using soil moisture patterns, weather forecasts, and crop-specific water needs. Prevent stress before it starts',
      benefit: '25% water savings',
      color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20'
    },
    {
      icon: TrendingUp,
      title: 'Variety Performance Tracking',
      description: 'Compare rice, soybean, cotton, and corn varieties against LSU recommendations. AI matches your soil type and climate to top-performing cultivars',
      benefit: '12-18% yield increase',
      color: 'bg-orange-500/10 text-orange-700 border-orange-500/20'
    },
    {
      icon: Network,
      title: 'Community Intelligence',
      description: 'Anonymous farmer network shares disease outbreaks, treatment successes, and yield trends. Early warnings when pests hit neighboring farms',
      benefit: '3-7 day early alerts',
      color: 'bg-pink-500/10 text-pink-700 border-pink-500/20'
    },
    {
      icon: Layers,
      title: 'Conservation Practice ROI',
      description: 'Track cover crops, no-till, and precision fertilization impact on soil health, input costs, and yield. AI predicts long-term financial benefits',
      benefit: '$40-120/acre savings',
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
    },
    {
      icon: MapPin,
      title: 'LSU Researcher Access',
      description: 'AI matches your crop issue to the right LSU AgCenter specialist. Direct contact info for pathologists, soil scientists, and extension agents',
      benefit: 'Expert help in <24hrs',
      color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
    }
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Back to home link */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* Hero Header with Background */}
      <div 
        className="py-20 mb-12 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(34, 197, 94, 0.92) 0%, rgba(22, 163, 74, 0.88) 100%), url(${bgDeltaRice})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Decorative floating elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-6xl mx-auto px-4 text-center space-y-6 relative z-10 animate-fade-in">
          <Badge variant="outline" className="glass border-primary-foreground/40 text-primary-foreground backdrop-blur-md shadow-glow">
            <Zap className="h-3 w-3 mr-1" />
            AI Transparency
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground drop-shadow-lg">
            How AgurateAI Works
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            A unified AI intelligence system where every analysis enriches every other—creating exponentially smarter insights for Louisiana Delta farmers
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-12">

        {/* Unified Intelligence System Overview */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Network className="h-3 w-3 mr-1" />
              Unified AI Intelligence
            </Badge>
            <h2 className="text-4xl font-heading font-bold">Synergistic Data Flow</h2>
            <p className="text-lg text-muted-foreground">
              Unlike traditional AI that analyzes each photo in isolation, AgurateAI creates a <strong>circular intelligence network</strong> where every data point enhances every other analysis
            </p>
          </div>

          {/* Central Intelligence Pool Diagram */}
          <AnimatedCard className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 mb-4">
                  <Database className="h-10 w-10 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-2">Central AI Intelligence Pool</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Every analysis feeds insights into a unified context that makes all future analyses exponentially smarter
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Camera, label: 'Historical Image Progression', desc: 'Visual symptom evolution patterns' },
                  { icon: TrendingUp, label: 'Variety-Specific Signatures', desc: 'Disease resistance & stress traits' },
                  { icon: Cloud, label: 'Weather Correlation Patterns', desc: 'Symptom triggers from climate data' },
                  { icon: Layers, label: 'Conservation Practice Impact', desc: 'Soil health improvement tracking' },
                  { icon: Network, label: 'Community Success Patterns', desc: 'Proven interventions from peers' },
                  { icon: Brain, label: 'Predictive Analytics Feed', desc: 'Yield trajectories & risk forecasts' }
                ].map((item, idx) => (
                  <div key={idx} className="text-center p-4 bg-background/50 rounded-lg border">
                    <item.icon className="h-8 w-8 mx-auto mb-3 text-primary" aria-hidden="true" />
                    <h4 className="font-heading font-semibold mb-1 text-sm">{item.label}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </AnimatedCard>
        </section>

        {/* Enhanced AI Pipeline */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="bg-purple/10 text-purple border-purple/20">
              <Brain className="h-3 w-3 mr-1" />
              Context-Aware Analysis
            </Badge>
            <h2 className="text-4xl font-heading font-bold">Enhanced Gemini Vision</h2>
            <p className="text-lg text-muted-foreground">
              Every crop photo analysis is enriched with comprehensive field intelligence
            </p>
          </div>

          {/* Clean Pipeline Flow */}
          <div className="relative max-w-4xl mx-auto">
            <div className="space-y-4">
              {aiPipeline.map((step, idx) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const { ref, hasIntersected } = useIntersectionObserver({ freezeOnceVisible: true });
                const isLast = idx === aiPipeline.length - 1;
                
                return (
                  <div 
                    key={idx} 
                    ref={ref}
                    className={`${hasIntersected ? 'animate-fade-in opacity-100' : 'opacity-0'} stagger-${Math.min(idx + 1, 5)}`}
                  >
                    <div className="relative">
                      <Card className="field-card hover-lift border-2 transition-all group">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-6">
                            {/* Step Number & Icon */}
                            <div className="flex-shrink-0">
                              <div className="relative">
                                <div className={`h-16 w-16 rounded-2xl ${step.color} flex flex-col items-center justify-center shadow-field group-hover:scale-110 transition-transform`}>
                                  <step.icon className="h-7 w-7 mb-1" aria-hidden="true" />
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-heading font-bold mb-2">{step.title}</h3>
                              <p className="text-muted-foreground leading-relaxed mb-3">
                                {step.description}
                              </p>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border text-xs font-mono">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                                {step.tech}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Connecting Arrow */}
                      {!isLast && (
                        <div className="flex justify-center py-2">
                          <ArrowRight className="h-6 w-6 text-primary/40 rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Data Flow */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold">Data Flow & Privacy</h2>
            <p className="text-muted-foreground">Your data is encrypted and secure at every step</p>
          </div>

          <Card className="field-card">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {dataFlow.map((flow, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <p className="font-semibold">{flow.from}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      {idx < dataFlow.length - 1 && (
                        <div className="h-12 w-0.5 bg-gradient-to-b from-primary to-transparent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{flow.to}</p>
                      <p className="text-xs text-muted-foreground">{flow.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Model Transparency */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold">AI Model Details</h2>
            <p className="text-muted-foreground">Built on cutting-edge AI technology</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="field-card border-primary/20">
              <CardHeader>
                <CardTitle>Vision Model</CardTitle>
                <CardDescription>Google Gemini 2.5 Pro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Context Window:</span>
                  <span className="font-semibold">2M tokens</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Media Analysis:</span>
                  <span className="font-semibold">Image + Video</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Output style:</span>
                  <span className="font-semibold">Confidence-aware</span>
                </div>
              </CardContent>
            </Card>

            <Card className="field-card border-primary/20">
              <CardHeader>
                <CardTitle>Prediction Model</CardTitle>
                <CardDescription>Pattern Recognition AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Forecast Range:</span>
                  <span className="font-semibold">7 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data Sources:</span>
                  <span className="font-semibold">Field + Weather</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold">Closed beta</span>
                </div>
              </CardContent>
            </Card>

            <Card className="field-card border-primary/20">
              <CardHeader>
                <CardTitle>AR Analysis</CardTitle>
                <CardDescription>Real-time Processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-semibold">&lt;2 seconds</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overlay Type:</span>
                  <span className="font-semibold">Live Vision</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Edge Processing:</span>
                  <span className="font-semibold">Cloud-based</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Enhanced Features Showcase */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Enhanced Intelligence
            </Badge>
            <h2 className="text-4xl font-display font-bold">8 Game-Changing Features</h2>
            <p className="text-lg text-muted-foreground">
              Every feature designed to save Louisiana Delta farmers time, money, and stress
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enhancedFeatures.map((feature, idx) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const { ref, hasIntersected } = useIntersectionObserver({ freezeOnceVisible: true });
              
              return (
                <Card 
                  key={idx} 
                  ref={ref}
                  className={`field-card hover-lift border-2 ${hasIntersected ? 'animate-fade-in opacity-100' : 'opacity-0'} stagger-${Math.min(idx + 1, 5)}`}
                >
                  <CardHeader>
                    <div className={`inline-flex h-12 w-12 rounded-xl ${feature.color} items-center justify-center mb-3`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="pt-2 border-t">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                        ✨ {feature.benefit}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Real-World Use Cases */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold">Real-World Impact</h2>
            <p className="text-muted-foreground">How Louisiana Delta farmers use AgurateAI</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {useCases.map((useCase, idx) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const { ref, hasIntersected } = useIntersectionObserver({ freezeOnceVisible: true });
              return (
                <div 
                  key={idx}
                  ref={ref}
                  className={`${hasIntersected ? 'animate-scale-in opacity-100' : 'opacity-0'} stagger-${Math.min(idx + 1, 5)}`}
                >
                  <Card className="field-card hover-lift glass-strong">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl gradient-delta shadow-glow flex items-center justify-center animate-glow-pulse">
                          <useCase.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{useCase.title}</CardTitle>
                      </div>
                      <CardDescription className="text-base">{useCase.scenario}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <p className="text-sm font-medium mb-1">Impact:</p>
                        <p className="text-sm text-muted-foreground">{useCase.impact}</p>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-health-good/10 border border-health-good/20 rounded-lg">
                        <span className="text-sm font-medium text-health-good">Estimated Savings:</span>
                        <span className="text-lg font-bold text-health-good">{useCase.savings}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center space-y-6 pt-12">
          <Badge className="shadow-card">
            <Zap className="h-3 w-3 mr-1" />
            Get Started Today
          </Badge>
          <h3 className="text-3xl md:text-4xl font-display font-bold">Ready to Try It?</h3>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start analyzing your crops with AI-powered intelligence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <MagneticButton 
              size="lg" 
              variant="magnetic" 
              onClick={() => navigate('/scanner')} 
              className="gap-2 shadow-glow hover:shadow-field"
            >
              <Camera className="h-5 w-5" />
              Start Field Scan
            </MagneticButton>
            <MagneticButton 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/predictions')} 
              className="gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              View Predictions
            </MagneticButton>
          </div>
        </div>
      </div>
    </div>
  );
}
