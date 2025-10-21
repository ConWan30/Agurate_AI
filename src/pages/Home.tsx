import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
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
  Quote
} from "lucide-react";
import heroFields from "@/assets/hero-fields.jpg";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function Home() {
  const { ref: heroRef, isIntersecting: heroVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: featuresRef, isIntersecting: featuresVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: benefitsRef, isIntersecting: benefitsVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: testimonialsRef, isIntersecting: testimonialsVisible } = useIntersectionObserver({ threshold: 0.1 });

  const features = [
    {
      icon: Scan,
      title: "AI Crop Scanner",
      description: "Instant crop health analysis from any smartphone camera. Detect stress, disease, and nutrient deficiencies in seconds.",
      color: "gradient-delta"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "7-day stress forecasts powered by weather AI. Know what's coming before it affects your yield.",
      color: "gradient-sky"
    },
    {
      icon: Brain,
      title: "Delta Intelligence",
      description: "AI trained on LSU AgCenter research data specific to Louisiana Delta crops and conditions.",
      color: "gradient-harvest"
    },
    {
      icon: FileText,
      title: "Insurance Documentation",
      description: "AI-verified damage documentation system for streamlined insurance claims.",
      color: "gradient-delta"
    }
  ];

  const benefits = [
    "Real-time crop health assessment",
    "Weather-integrated recommendations",
    "Field management made simple",
    "LSU AgCenter-validated insights",
    "Cooperative data sharing",
    "Mobile-first design"
  ];

  const stats = [
    { value: 98, label: "Accuracy Rate", suffix: "%" },
    { value: 10, label: "Analysis Time", prefix: "<", suffix: "s" },
    { value: 4, label: "Crop Types", suffix: "" },
    { value: 24, label: "Availability", suffix: "/7" }
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
                Get Started
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
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroFields})` }}
          role="img"
          aria-label="Louisiana agricultural fields"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60" />
        
        <div className={`relative z-10 container mx-auto px-4 py-24 md:py-32 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-3xl">
            <Badge className="mb-6 text-sm px-4 py-2 glass border-primary-foreground/40 text-primary-foreground backdrop-blur-md animate-fade-in">
              <Smartphone className="h-4 w-4 mr-2" aria-hidden="true" />
              Mobile-First Precision Agriculture
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 leading-tight">
              AI-Powered Crop Health Monitoring for Louisiana Delta
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 leading-relaxed">
              Transform your farming with intelligent crop analysis for rice, soybean, cotton, and corn. 
              Backed by LSU AgCenter research.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 text-lg px-8 py-6 shadow-glow hover:shadow-field transition-all hover-lift">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto glass border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6">
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
              Core Features
            </Badge>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
              Everything You Need to Monitor Your Crops
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for Louisiana Delta farmers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className={`border-2 hover:border-primary transition-all duration-500 hover-lift group ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-8">
                    <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${feature.color} shadow-glow mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
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
                Why Choose AgurateAI
              </Badge>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                Built for Louisiana Delta Farmers
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI is specifically trained on LSU AgCenter research data and Morehouse Parish conditions, 
                ensuring accurate, relevant recommendations for your crops.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 shadow-glow hover:shadow-field hover-lift">
                    Get Started Now
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-success" />
                  <span>LSU AgCenter Validated</span>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-6 transition-all duration-1000 ${benefitsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <Card className="border-2 p-6 hover:shadow-field transition-all hover-lift group">
                <Shield className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">LSU Validated</h3>
                <p className="text-sm text-muted-foreground">Research-backed recommendations</p>
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
      <div className="h-24 bg-gradient-to-b from-background to-muted/30" />

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
            Ready to Transform Your Farming?
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            Join Louisiana Delta farmers who are already using AI to improve their crop yields
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 text-lg px-8 py-6 shadow-glow hover:shadow-field hover-lift animate-glow-pulse">
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <p className="text-sm mt-6 opacity-75">No credit card required • 7-day free trial • Cancel anytime</p>
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
                <span className="text-muted-foreground">LSU AgCenter Partner</span>
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
                  <Link to="/delta-intelligence" className="text-muted-foreground hover:text-primary transition-colors">
                    Delta Intelligence
                  </Link>
                </li>
                <li>
                  <Link to="/cooperatives" className="text-muted-foreground hover:text-primary transition-colors">
                    Cooperatives
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="text-muted-foreground hover:text-primary transition-colors">
                    Analytics
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
