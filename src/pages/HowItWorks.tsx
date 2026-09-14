import { Camera, Cloud, Brain, FileText, TrendingUp, Layers, MapPin, Zap, ArrowRight, ArrowLeft, Database, GitBranch, Network, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { useNavigate, Link } from 'react-router-dom';
import { PipelineStepCard, FeatureRevealCard, UseCaseRevealCard } from '@/components/HowItWorksRevealCards';
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
      title: 'Contextual Enrichment',
      description: 'Follow-on helpers can add water-stress context, conservation notes, variety cues, and community patterns when those features are available for your field',
      tech: 'Contextual enrichment helpers',
      color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20'
    },
    {
      icon: Network,
      title: 'Intelligence Pool Update',
      description: 'New observations can be stored with your field history so later reviews have more local context (not a guarantee of better accuracy for other farms)',
      tech: 'Field history context',
      color: 'bg-green-500/10 text-green-700 border-green-500/20'
    },
    {
      icon: TrendingUp,
      title: 'Unified Recommendations',
      description: 'Results are summarized into suggested next steps and can surface the public LSU researcher directory when relevant — framed as decision support, not a validated diagnosis',
      tech: 'Decision-aid summary',
      color: 'bg-orange-500/10 text-orange-700 border-orange-500/20'
    },
    {
      icon: Layers,
      title: 'Field History Retention',
      description: 'Analyses are stored for your fields so later reviews can reference variety notes, weather context, and conservation observations over time',
      tech: 'Per-field history',
      color: 'bg-pink-500/10 text-pink-700 border-pink-500/20'
    }
  ];

  const dataFlow = [
    { from: 'Field Photo/Video', to: 'Secure Cloud Storage', detail: 'Supabase Storage (encrypted)' },
    { from: 'Media URL', to: 'AI Analysis', detail: 'Lovable AI Gateway (Video/Image)' },
    { from: 'Visual Symptoms', to: 'Database', detail: 'PostgreSQL with RLS' },
    { from: 'Weather API', to: 'Correlation Engine', detail: 'Weather context enrichment' },
    { from: 'Historical Data', to: 'Predictions', detail: 'Pattern recognition' },
  ];

  const useCases = [
    {
      icon: Zap,
      title: 'Early Disease Detection',
      scenario: 'Flag possible soybean foliar stress earlier than visual scouting alone',
      impact: 'Act sooner with a research-framed treatment plan',
      savings: 'Earlier intervention window'
    },
    {
      icon: Cloud,
      title: 'Weather Stress Prevention',
      scenario: 'Explore multi-day heat-stress outlooks during Louisiana summers (illustrative decision aid)',
      impact: 'Adjust irrigation before damage occurs',
      savings: 'Proactive irrigation cues'
    },
    {
      icon: MapPin,
      title: 'Aerial / Field Video Mapping',
      scenario: 'Upload field or aerial video to review stressed zones across a larger area in one pass',
      impact: 'Broader coverage can highlight patterns that are harder to see from ground level',
      savings: 'Broader field coverage'
    },
    {
      icon: TrendingUp,
      title: 'Seasonal Planning',
      scenario: 'Historical notes can inform planting-window discussion for your field (illustrative planning aid)',
      impact: 'Use past season context when choosing planting timing',
      savings: 'Better-informed timing discussions'
    }
  ];

  const enhancedFeatures = [
    {
      icon: DollarSign,
      title: 'Automated ROI Calculator',
      description: 'Optional planning calculator estimates treatment costs vs. illustrative yield protection using placeholder or last-known market figures—not live brokerage quotes',
      benefit: 'Planning estimates',
      color: 'bg-health-good/10 text-health-good border-health-good/20'
    },
    {
      icon: Brain,
      title: 'Daily AI Briefing',
      description: 'Optional daily briefing summarizes overnight weather context, suggested actions, and multi-day stress outlooks on your dashboard',
      benefit: 'Daily action focus',
      color: 'bg-secondary/10 text-secondary border-secondary/20'
    },
    {
      icon: FileText,
      title: 'Conversational Forms',
      description: 'Just talk to your phone—AI extracts field data, planting dates, and crop varieties from natural conversation. Voice-to-data as a decision aid',
      benefit: 'Faster form completion',
      color: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
    },
    {
      icon: Cloud,
      title: 'Water Stress Intelligence',
      description: 'Irrigation decision-aid alerts using soil moisture patterns, weather forecasts, and crop-specific water needs when those data sources are available',
      benefit: 'Stress prevention focus',
      color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20'
    },
    {
      icon: TrendingUp,
      title: 'Variety Performance Tracking',
      description: 'Soybean variety context for Morehouse Parish, framed against published LSU guidance — research aid, not a cultivar prescription',
      benefit: 'Research-informed picks',
      color: 'bg-orange-500/10 text-orange-700 border-orange-500/20'
    },
    {
      icon: Network,
      title: 'Community Intelligence',
      description: 'Peer comparison modules are deferred for this pilot; focus stays on your own Morehouse soybean records',
      benefit: 'Neighbor early warnings',
      color: 'bg-pink-500/10 text-pink-700 border-pink-500/20'
    },
    {
      icon: Layers,
      title: 'Conservation Practice ROI',
      description: 'Conservation ROI modules are deferred until the soybean wedge is validated — no invented dollar savings in the pilot UI',
      benefit: 'Practice cost tracking',
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
    },
    {
      icon: MapPin,
      title: 'LSU Researcher Directory',
      description: 'Browse a public directory of LSU AgCenter specialists. Contact pathologists, soil scientists, and extension agents through official LSU channels',
      benefit: 'Public specialist links',
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
            A unified analysis workflow where each scan can inform the next—helping Louisiana Delta growers review field context as a decision aid
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
            <h2 className="text-4xl font-heading font-bold">Connected Field Context</h2>
            <p className="text-lg text-muted-foreground">
              Unlike tools that treat each photo in isolation, AgurateAI can carry prior field context forward so later reviews have more history to work with
            </p>
          </div>

          {/* Central Intelligence Pool Diagram */}
          <AnimatedCard className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 mb-4">
                  <Database className="h-10 w-10 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-2">Shared Field Context</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Prior analyses can contribute notes into a shared field context that later reviews may reference
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Camera, label: 'Historical Image Progression', desc: 'Visual symptom evolution patterns' },
                  { icon: TrendingUp, label: 'Variety-Specific Signatures', desc: 'Disease resistance & stress traits' },
                  { icon: Cloud, label: 'Weather Correlation Patterns', desc: 'Symptom triggers from climate data' },
                  { icon: Layers, label: 'Conservation Practice Impact', desc: 'Soil health improvement tracking' },
                  { icon: Network, label: 'Community Success Patterns', desc: 'Peer-shared treatment notes when available' },
                  { icon: Brain, label: 'Weather + History Context', desc: 'Parish weather beside your soybean scans when data exists' }
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
              Crop photo analysis can include available field context when that data exists
            </p>
          </div>

          {/* Clean Pipeline Flow */}
          <div className="relative max-w-4xl mx-auto">
            <div className="space-y-4">
              {aiPipeline.map((step, idx) => (
              <PipelineStepCard
                key={idx}
                step={step}
                index={idx}
                isLast={idx === aiPipeline.length - 1}
              />
            ))}
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
            <p className="text-muted-foreground">Built with modern AI models as a research-framed decision aid</p>
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
                <CardDescription>Fast Field Processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-semibold">Typically a few seconds</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overlay Type:</span>
                  <span className="font-semibold">On-device overlay</span>
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
            {enhancedFeatures.map((feature, idx) => (
              <FeatureRevealCard key={idx} feature={feature} index={idx} />
            ))}
          </div>
        </section>

        {/* Real-World Use Cases */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold">Real-World Impact</h2>
            <p className="text-muted-foreground">How Louisiana Delta farmers use AgurateAI</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {useCases.map((useCase, idx) => (
              <UseCaseRevealCard key={idx} useCase={useCase} index={idx} />
            ))}
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
