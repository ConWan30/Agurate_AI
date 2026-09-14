import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgriculturalBadge } from "@/components/ui/agricultural-badge";
import { Link } from "react-router-dom";
import { BetaCountdown } from "@/components/BetaCountdown";
import { TestimonialCard } from "@/components/TestimonialCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sprout, 
  Brain, 
  TrendingUp, 
  Shield, 
  Smartphone,
  Users, 
  CheckCircle2, 
  ArrowRight,
  Scan,
  MapPin,
  FileText,
  Cloud,
  Award,
  Zap,
  Droplets,
  Leaf,
  GraduationCap,
  Network,
  BarChart3,
  Microscope,
  Sparkles
} from "lucide-react";
import heroFields from "@/assets/hero-fields.jpg";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AnimatedCard } from "@/components/ui/animated-card";
import { TrustIndicators } from "@/components/TrustIndicators";
import { LSUResearchFramingSection } from "@/components/LSUResearchFramingSection";
import { ComparisonSection } from "@/components/ComparisonSection";

export default function Home() {
  const { ref: heroRef, isIntersecting: heroVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: featuresRef, isIntersecting: featuresVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: benefitsRef, isIntersecting: benefitsVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: testimonialsRef, isIntersecting: testimonialsVisible } = useIntersectionObserver({ threshold: 0.1 });

  const { data: dbTestimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data } = await supabase
        .from('farmer_testimonials')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    }
  });

  const features = [
    {
      icon: Scan,
      title: "AI Crop Scanner",
      description: "Phone-camera crop health reads as a decision aid. Surfaces possible stress, disease, and nutrient signals for grower review.",
      color: "gradient-delta"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "Optional 7-14 day stress outlooks when weather and field history are available — decision support, not a guarantee.",
      color: "gradient-sky"
    },
    {
      icon: Brain,
      title: "Delta Intelligence Chat",
      description: "On-demand AI advisor framed around LSU AgCenter research. Field-aware conversations with image analysis and treatment recommendations.",
      color: "gradient-harvest"
    },
    {
      icon: Droplets,
      title: "Water Stress Intelligence",
      description: "Water stress signals with a deep-link to the public MSU DIRT irrigation scheduling tool (opens in a new tab — not an embedded integration).",
      color: "gradient-delta"
    },
    {
      icon: Leaf,
      title: "Conservation Tracking",
      description: "Track sustainable practices with planning indexes and your recorded costs. Monitor cover crops, no-till, and precision fertilization notes.",
      color: "gradient-sky"
    },
    {
      icon: Microscope,
      title: "Variety Recommendations",
      description: "AI-powered rice and soybean variety selection based on your soil type, planting conditions, and published LSU guidance.",
      color: "gradient-harvest"
    },
    {
      icon: GraduationCap,
      title: "LSU Researcher Directory",
      description: "Browse public LSU AgCenter researcher profiles and use official LSU channels to contact specialists.",
      color: "gradient-delta"
    },
    {
      icon: Network,
      title: "Community Intelligence",
      description: "Anonymous cooperative insights from neighboring farms. Early outbreak detection and shared best practices network.",
      color: "gradient-sky"
    },
    {
      icon: MapPin,
      title: "Interactive Field Maps",
      description: "GPS-tagged assessments with color-coded health markers. Visualize crop health patterns across your entire operation.",
      color: "gradient-harvest"
    },
    {
      icon: FileText,
      title: "Insurance Documentation",
      description: "GPS-stamped crop photos and assessment notes you can export for insurance documentation. Claim outcomes still depend on your carrier.",
      color: "gradient-delta"
    }
  ];

  const benefits = [
    "Phone-camera crop health reads for Delta crops",
    "Optional stress outlooks when weather and field history are available",
    "Water stress monitoring with link to MSU DIRT",
    "Insights informed by LSU AgCenter research framing",
    "Conservation practice tracking and ROI analysis",
    "Community intelligence and cooperative insights",
    "Variety recommendations for rice and soybeans",
    "GPS-tagged field mapping and health visualization",
    "Insurance claim documentation support (not automated settlement)",
    "Mobile-first design with installable PWA support"
  ];

  const stats = [
    { value: 7, label: "Day Stress Forecasts", suffix: "+", prefix: "" },
    { value: 4, label: "Delta Crops Supported", suffix: "", prefix: "" },
    { value: 100, label: "Beta Partner Spots", suffix: "", prefix: "" },
    { value: 1, label: "On-Demand AI Advisor", suffix: "", prefix: "" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="relative">
              <Sprout className="h-8 w-8 text-primary animate-float" aria-hidden="true" />
              <div className="absolute inset-0 blur-lg bg-primary/20 animate-glow-pulse" />
            </div>
            <h1 className="text-2xl font-heading font-bold">
              Agurate<span className="font-bold text-primary">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-2 shadow-glow hover:shadow-field">
                Join Beta
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative overflow-hidden"
      >
        <img
          src={heroFields}
          alt="Louisiana agricultural fields"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60" />
        
        <div className={`relative z-10 container mx-auto px-4 py-24 md:py-32 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-3xl">
            {/* Beta Badge */}
            <Badge className="mb-6 text-sm px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none shadow-glow animate-fade-in">
              🌱 FREE CLOSED BETA — Louisiana Delta farmers
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground mb-6 leading-tight">
              AI-Powered Crop Health Monitoring for Louisiana Delta
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 leading-relaxed">
              Transform your farming with intelligent crop analysis for rice, soybean, cotton, and corn. 
              Research-informed for Louisiana Delta conditions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/beta-signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 text-lg px-8 py-6 shadow-glow hover:shadow-field transition-all hover-lift focus-ring"
                  aria-label="Join AgurateAI Free Beta Program"
                >
                  Join Free Beta
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto glass border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 focus-ring"
                  aria-label="Learn more about AgurateAI"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats - Animated */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-primary-foreground/20">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-3xl md:text-4xl font-bold font-mono text-primary-foreground mb-2">
                    <AnimatedCounter 
                      value={stat.value} 
                      duration={2000}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className="text-sm text-primary-foreground/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="max-w-md mx-auto mt-12 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="p-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-2xl">
              <BetaCountdown />
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-24 bg-gradient-to-b from-primary/60 to-muted/30" />

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-24 bg-muted/30 relative overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-secondary rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-4 text-sm px-4 py-2 shadow-card">
              <Zap className="h-3 w-3 mr-1" />
              Research-informed for the Delta
            </Badge>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold mb-4">
              Everything You Need to Monitor Your Crops
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for Louisiana Delta farmers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <AnimatedCard 
                  key={index}
                  delay={index * 50}
                  hover={true}
                  className="border-2"
                >
                  <CardContent className="p-6">
                    <div className={`flex items-center justify-center h-14 w-14 rounded-2xl ${feature.color} shadow-glow mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-24 bg-gradient-to-b from-muted/30 to-background" />

      {/* Benefits Section */}
      <section 
        ref={benefitsRef}
        className="py-24 bg-background"
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className={`transition-all duration-1000 ${benefitsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 text-sm px-4 py-2 shadow-card">
                <Award className="h-3 w-3 mr-1" aria-hidden="true" />
                Research-informed
              </Badge>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
                Built for Louisiana Delta Farmers
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Guidance is framed around publicly available LSU AgCenter research and Morehouse Parish conditions. It is a decision aid, not a validated diagnosis.
              </p>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3"
                    style={{ transitionDelay: `${index * 30}ms` }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 shadow-glow hover:shadow-field hover-lift">
                    Get Started Now
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
                <TrustIndicators variant="compact" />
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-6 transition-all duration-1000 ${benefitsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group focus-ring" tabIndex={0}>
                <Shield className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold font-heading text-lg mb-2 group-hover:text-primary transition-colors">Research-informed</h3>
                <p className="text-sm text-muted-foreground">Framed for Louisiana Delta crops</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group mt-8 focus-ring" tabIndex={0}>
                <Smartphone className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold font-heading text-lg mb-2 group-hover:text-primary transition-colors">Mobile First</h3>
                <p className="text-sm text-muted-foreground">Works on any device</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group focus-ring" tabIndex={0}>
                <Users className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold font-heading text-lg mb-2 group-hover:text-primary transition-colors">Cooperative</h3>
                <p className="text-sm text-muted-foreground">Share insights with neighbors</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group mt-8 focus-ring" tabIndex={0}>
                <Cloud className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold font-heading text-lg mb-2 group-hover:text-primary transition-colors">Available When You Need It</h3>
                <p className="text-sm text-muted-foreground">On-demand crop assessments</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-24 bg-gradient-to-b from-background to-accent/50" />

      {/* Technology Innovation Section */}
      <section className="py-24 bg-accent/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 text-sm px-4 py-2 shadow-card">
              <Sparkles className="h-3 w-3 mr-1" />
              Agricultural Technology for the Delta
            </Badge>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold mb-4">
              Unified AI Intelligence System
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Our proprietary AI synergy system connects all features for context-aware insights. 
              Every data point strengthens predictions across the entire platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all hover-lift">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl gradient-delta shadow-glow mx-auto mb-4">
                  <Brain className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Context-Aware AI</h3>
                <p className="text-sm text-muted-foreground">
                  Every scan, prediction, and chat response uses your complete field history, weather patterns, 
                  and crop performance data for personalized insights.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover-lift">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl gradient-sky shadow-glow mx-auto mb-4">
                  <Network className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cross-Feature Synergy</h3>
                <p className="text-sm text-muted-foreground">
                  Crop health assessments inform water stress predictions. Conservation practices 
                  influence variety recommendations. Everything connects intelligently.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover-lift">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl gradient-harvest shadow-glow mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">LSU Research Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Recommendations are research-informed for Louisiana Delta conditions. We do not claim scientific validation or an official LSU partnership.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="gap-2">
                Learn About Our Technology
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-24 bg-gradient-to-b from-accent/50 to-muted/30" />

      {/* Testimonials Section */}
      <section 
        ref={testimonialsRef}
        className="py-24 bg-muted/30"
      >
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-4 text-sm px-4 py-2 shadow-card">
              <Users className="h-3 w-3 mr-1" />
              Early Louisiana Delta beta
            </Badge>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
              Built with Morehouse Parish growers in mind
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We are recruiting the first 100 Louisiana Delta farmers. Real pilot stories will land here as they approve them.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {dbTestimonials && dbTestimonials.length > 0 ? (
              dbTestimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id}
                  className={`transition-all duration-500 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))
            ) : (
              <Card className={`md:col-start-2 border-2 transition-all duration-500 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold mb-3">Be one of the first voices</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">No fabricated reviews here. Join the free closed beta, run a scan in your field, and if it helps, we will ask to feature your story with your approval.</p>
                  <Link to="/beta-signup">
                    <Button className="gap-2">Join Free Beta<ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Why Delta farmers are joining early
            </h2>
          </div>
          <TrustIndicators variant="full" className="max-w-6xl mx-auto" />
        </div>
      </section>

      {/* LSU Partnership Section */}
      <LSUResearchFramingSection />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Section Divider */}
      <div className="h-24 bg-gradient-to-b from-muted/30 to-primary" />

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 text-sm px-4 py-2 bg-primary-foreground/20 border-primary-foreground/40 text-primary-foreground backdrop-blur-md">
            <Zap className="h-3 w-3 mr-1" />
            Join Closed Beta
          </Badge>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Ready to Join the Beta?
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            Join the free closed beta for Louisiana Delta farmers
          </p>
          <Link to="/beta-signup">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 text-lg px-8 py-6 shadow-glow hover:shadow-field hover-lift animate-glow-pulse">
              Join Free Beta Now
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <p className="text-sm mt-6 opacity-75">Free closed-beta access • No credit card required • Limits may apply</p>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="border-t py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="h-8 w-8 text-primary animate-float" aria-hidden="true" />
                <span className="font-display font-bold text-xl">
                  Agurate<span className="text-primary">AI</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered precision agriculture for Louisiana Delta farmers
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-muted-foreground">Informed by LSU AgCenter research</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/scanner" className="text-muted-foreground hover:text-primary transition-colors">
                    AI Scanner
                  </Link>
                </li>
                <li>
                  <Link to="/predictions" className="text-muted-foreground hover:text-primary transition-colors">
                    Predictions
                  </Link>
                </li>
                <li>
                  <Link to="/insurance" className="text-muted-foreground hover:text-primary transition-colors">
                    Insurance Claims
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/delta" className="text-muted-foreground hover:text-primary transition-colors">
                    Delta Intelligence
                  </Link>
                </li>
                <li>
                  <Link to="/cooperatives" className="text-muted-foreground hover:text-primary transition-colors">
                    Cooperatives & Community
                  </Link>
                </li>
                <li>
                  <a href="https://lsuagcenter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    LSU AgCenter
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/beta-signup" className="text-muted-foreground hover:text-primary transition-colors">
                    Join Beta Program
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 AgurateAI. Proudly serving Morehouse Parish, Louisiana
            </p>
            <div className="flex items-center gap-6">
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                Morehouse Parish, LA
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Informed by LSU AgCenter research
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
