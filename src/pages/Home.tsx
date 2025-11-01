import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BetaCountdown } from "@/components/BetaCountdown";
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
  Quote,
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
import { LSUPartnershipSection } from "@/components/LSUPartnershipSection";
import { ComparisonSection } from "@/components/ComparisonSection";

export default function Home() {
  const { ref: heroRef, isIntersecting: heroVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: featuresRef, isIntersecting: featuresVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: benefitsRef, isIntersecting: benefitsVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: testimonialsRef, isIntersecting: testimonialsVisible } = useIntersectionObserver({ threshold: 0.1 });

  const features = [
    {
      icon: Scan,
      title: "AI Crop Scanner",
      description: "Instant crop health analysis from any smartphone camera. Detect stress, disease, and nutrient deficiencies in seconds with 95%+ accuracy.",
      color: "gradient-delta"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "7-14 day stress forecasts powered by weather AI. Comprehensive predictions for water stress, disease risk, and yield optimization.",
      color: "gradient-sky"
    },
    {
      icon: Brain,
      title: "Delta Intelligence Chat",
      description: "24/7 AI advisor trained on LSU AgCenter research. Field-aware conversations with image analysis and treatment recommendations.",
      color: "gradient-harvest"
    },
    {
      icon: Droplets,
      title: "Water Stress Intelligence",
      description: "Real-time water stress detection with direct integration to MSU DIRT irrigation scheduling for precision water management.",
      color: "gradient-delta"
    },
    {
      icon: Leaf,
      title: "Conservation Tracking",
      description: "Track sustainable practices with AI-powered cost-benefit analysis. Monitor cover crops, no-till, and precision fertilization impact.",
      color: "gradient-sky"
    },
    {
      icon: Microscope,
      title: "Variety Recommendations",
      description: "AI-powered rice and soybean variety selection based on your soil type, planting conditions, and LSU research data.",
      color: "gradient-harvest"
    },
    {
      icon: GraduationCap,
      title: "LSU Researcher Access",
      description: "Connect directly with LSU AgCenter experts. Get specialized support for complex crop issues and participate in research.",
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
      description: "AI-verified damage documentation with GPS-stamped photos. Automated evidence collection for faster claims processing.",
      color: "gradient-delta"
    }
  ];

  const benefits = [
    "Real-time crop health assessment with 95%+ accuracy",
    "7-14 day predictive analytics for proactive decisions",
    "Water stress monitoring with DIRT integration",
    "LSU AgCenter-validated insights and researcher access",
    "Conservation practice tracking and ROI analysis",
    "Community intelligence and cooperative insights",
    "Variety recommendations for rice and soybeans",
    "GPS-tagged field mapping and health visualization",
    "Insurance claim automation with AI verification",
    "Mobile-first design with offline capabilities"
  ];

  const stats = [
    { value: 95, label: "AI Accuracy Rate", suffix: "+%", prefix: "" },
    { value: 14, label: "Day Predictions", suffix: "", prefix: "" },
    { value: 10, label: "Integrated Features", suffix: "+", prefix: "" },
    { value: 24, label: "AI Advisor Available", suffix: "/7", prefix: "" }
  ];

  const testimonials = [
    {
      quote: "AgurateAI helped us detect cotton stress early and saved 15% of our yield. Game changer for Morehouse Parish farmers.",
      author: "James Mitchell",
      role: "Cotton Farmer, Morehouse Parish",
      stat: "15% yield saved"
    },
    {
      quote: "The mobile scanner is incredibly accurate. We caught rice blast before it spread across the whole field.",
      author: "Sarah Thompson",
      role: "Rice Producer, Louisiana Delta",
      stat: "Early detection"
    },
    {
      quote: "Insurance claims are now backed by AI verification. No more disputes, just fast payouts.",
      author: "Robert Davis",
      role: "Soybean Farmer, 450 acres",
      stat: "Faster claims"
    }
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
            <h1 className="text-2xl font-display font-bold">
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
              🌱 FREE BETA - Limited to First 100 Louisiana Delta Farmers
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 leading-tight">
              AI-Powered Crop Health Monitoring for Louisiana Delta
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 leading-relaxed">
              Transform your farming with intelligent crop analysis for rice, soybean, cotton, and corn. 
              Built on LSU AgCenter research.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
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
                  <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
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
              Built on LSU AgCenter Research
            </Badge>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
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
                <Award className="h-3 w-3 mr-1" />
                130+ Years of LSU AgCenter Research
              </Badge>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                Built for Louisiana Delta Farmers
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI is specifically trained on LSU AgCenter research data and Morehouse Parish conditions, 
                ensuring accurate, relevant recommendations for your crops.
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
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group">
                <Shield className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">LSU Research-Based</h3>
                <p className="text-sm text-muted-foreground">Built on 130+ years of research</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group mt-8">
                <Smartphone className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Mobile First</h3>
                <p className="text-sm text-muted-foreground">Works on any device</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group">
                <Users className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Cooperative</h3>
                <p className="text-sm text-muted-foreground">Share insights with neighbors</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group mt-8">
                <Cloud className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">Always Available</h3>
                <p className="text-sm text-muted-foreground">24/7 crop monitoring</p>
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
              Cutting-Edge Agricultural Technology
            </Badge>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
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
                  Every AI decision is backed by 130+ years of LSU AgCenter research. 
                  Scientifically validated recommendations for Louisiana Delta conditions.
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
              Trusted by Louisiana Farmers
            </Badge>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
              Real Results from Morehouse Parish
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              See how AgurateAI is helping local farmers increase yields and reduce losses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className={`border-2 hover:border-primary transition-all duration-500 hover-lift ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <Quote className="h-10 w-10 text-primary mb-4 opacity-50" aria-hidden="true" />
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-bold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                    <Badge variant="outline" className="text-success border-success">
                      {testimonial.stat}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Trusted by Louisiana Delta Farmers
            </h2>
          </div>
          <TrustIndicators variant="full" className="max-w-6xl mx-auto" />
        </div>
      </section>

      {/* LSU Partnership Section */}
      <LSUPartnershipSection />

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
            Start Free Today
          </Badge>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Ready to Join the Beta?
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            Get FREE unlimited access as one of the first 100 Louisiana Delta farmers
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 text-lg px-8 py-6 shadow-glow hover:shadow-field hover-lift animate-glow-pulse">
              Join Free Beta Now
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <p className="text-sm mt-6 opacity-75">Free Beta Access • No credit card required • Unlimited use during beta</p>
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
                <span className="text-muted-foreground">LSU Research-Based</span>
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
                LSU AgCenter Validated
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
