import { Camera, Cloud, Brain, FileText, TrendingUp, Layers, MapPin, Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { useNavigate } from 'react-router-dom';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import bgDeltaRice from "@/assets/bg-delta-rice.jpg";

export default function HowItWorks() {
  const navigate = useNavigate();

  const aiPipeline = [
    {
      icon: Camera,
      title: 'Image & Video Capture',
      description: 'Capture crop photos or upload drone video footage with GPS auto-tagging for comprehensive field analysis',
      tech: 'Mobile Camera API + Drone Video Support + Geolocation',
      color: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
    },
    {
      icon: Brain,
      title: 'AI Vision Analysis',
      description: 'Google Gemini 2.5 analyzes images and drone videos for visual stress indicators, disease patterns, and field-wide crop health variations',
      tech: 'Gemini 2.5 Pro (Multimodal Video + Image)',
      color: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
    },
    {
      icon: Cloud,
      title: 'Weather Correlation',
      description: 'Cross-reference with real-time Louisiana Delta weather data',
      tech: 'Open-Meteo API + Historical Data',
      color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20'
    },
    {
      icon: FileText,
      title: 'LSU AgCenter Integration',
      description: 'Apply Louisiana-specific agricultural research and best practices',
      tech: 'LSU AgCenter Guidelines',
      color: 'bg-green-500/10 text-green-700 border-green-500/20'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'Forecast 7-day crop stress based on your field history + weather patterns',
      tech: 'Pattern Recognition + Time Series',
      color: 'bg-orange-500/10 text-orange-700 border-orange-500/20'
    },
    {
      icon: Layers,
      title: 'AR Overlay',
      description: 'Real-time augmented reality health indicators on live camera feed',
      tech: 'AR Vision Processing',
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

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Header with Background */}
      <div 
        className="py-16 mb-12 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(34, 197, 94, 0.92) 0%, rgba(22, 163, 74, 0.88) 100%), url(${bgDeltaRice})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center space-y-6 relative z-10">
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
            <Zap className="h-3 w-3 mr-1" />
            AI Transparency
          </Badge>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
            How AgurateAI Works
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Understanding the AI-powered crop health intelligence built specifically 
            for Louisiana Delta agriculture
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-12">

        {/* Streamlined AI Pipeline */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Brain className="h-3 w-3 mr-1" />
              AI Technology
            </Badge>
            <h2 className="text-4xl font-display font-bold">The AI Pipeline</h2>
            <p className="text-lg text-muted-foreground">
              From field photo or drone video to actionable recommendation in seconds
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
                                  <step.icon className="h-7 w-7 mb-1" />
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-display font-bold mb-2">{step.title}</h3>
                              <p className="text-muted-foreground leading-relaxed mb-3">
                                {step.description}
                              </p>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border text-xs font-mono">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
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
                  <span className="text-muted-foreground">Avg Confidence:</span>
                  <span className="font-semibold">85-95%</span>
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
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="font-semibold">80-90%</span>
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
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <span className="text-sm font-medium text-green-700">Estimated Savings:</span>
                        <span className="text-lg font-bold text-green-700">{useCase.savings}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center space-y-4 pt-8">
          <h3 className="text-2xl font-display font-bold">Ready to Try It?</h3>
          <p className="text-muted-foreground">Start analyzing your crops with AI-powered intelligence</p>
          <div className="flex gap-4 justify-center">
            <MagneticButton size="lg" variant="magnetic" onClick={() => navigate('/scanner')} className="gap-2">
              <Camera className="h-5 w-5" />
              Start Field Scan
            </MagneticButton>
            <MagneticButton size="lg" variant="outline" onClick={() => navigate('/predictions')} className="gap-2">
              <TrendingUp className="h-5 w-5" />
              View Predictions
            </MagneticButton>
          </div>
        </div>
      </div>
    </div>
  );
}
