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
  Cloud
} from "lucide-react";
import heroFields from "@/assets/hero-fields.jpg";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

export default function Home() {
  const { ref: heroRef, isIntersecting: heroVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: featuresRef, isIntersecting: featuresVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: benefitsRef, isIntersecting: benefitsVisible } = useIntersectionObserver({ threshold: 0.1 });

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
    { value: "98%", label: "Accuracy Rate" },
    { value: "<10s", label: "Analysis Time" },
    { value: "4", label: "Crop Types" },
    { value: "24/7", label: "Availability" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-display font-bold">
              Agurate<span className="font-bold text-primary">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-2">
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
            <Badge className="mb-6 text-sm px-4 py-2 bg-white/20 text-white border-white/40 hover:bg-white/30">
              <Smartphone className="h-4 w-4 mr-2" aria-hidden="true" />
              Mobile-First Precision Agriculture
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
              AI-Powered Crop Health Monitoring for Louisiana Delta
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Transform your farming with intelligent crop analysis for rice, soybean, cotton, and corn. 
              Backed by LSU AgCenter research.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 gap-2 text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-white/20">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-24 bg-muted/30"
      >
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-4 text-sm px-4 py-2">Core Features</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Everything You Need to Monitor Your Crops
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for Louisiana Delta farmers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className={`border-2 hover:border-primary/50 transition-all duration-500 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-8">
                    <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${feature.color} shadow-glow mb-6`}>
                      <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section 
        ref={benefitsRef}
        className="py-24"
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className={`transition-all duration-1000 ${benefitsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 text-sm px-4 py-2">Why Choose AgurateAI</Badge>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
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

              <div className="mt-8">
                <Link to="/auth">
                  <Button size="lg" className="gap-2">
                    Get Started Now
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-6 transition-all duration-1000 ${benefitsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <Card className="border-2 p-6 hover:shadow-lg transition-shadow">
                <Shield className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2">LSU Validated</h3>
                <p className="text-sm text-muted-foreground">Research-backed recommendations</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-lg transition-shadow mt-8">
                <Smartphone className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2">Mobile First</h3>
                <p className="text-sm text-muted-foreground">Works on any device</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-lg transition-shadow">
                <Users className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2">Cooperative</h3>
                <p className="text-sm text-muted-foreground">Share insights with neighbors</p>
              </Card>
              
              <Card className="border-2 p-6 hover:shadow-lg transition-shadow mt-8">
                <Cloud className="h-12 w-12 text-primary mb-4" aria-hidden="true" />
                <h3 className="font-bold text-lg mb-2">Always Available</h3>
                <p className="text-sm text-muted-foreground">24/7 crop monitoring</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join Louisiana Delta farmers who are already using AI to improve their crop yields
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 text-lg px-8 py-6">
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Sprout className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="font-display font-bold text-lg">
                Agurate<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025 AgurateAI. Serving Morehouse Parish, Louisiana
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/how-it-works" className="hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link to="/auth" className="hover:text-primary transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
