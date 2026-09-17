import { Link } from "react-router-dom";
import { ArrowRight, Brain, CheckCircle2, FileText, MapPin, Scan } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroFields from "@/assets/hero-fields.jpg";
import { BrandEmblem } from "@/components/BrandEmblem";

const capabilities = [
  {
    icon: Scan,
    title: "AI Crop Scanner",
    description: "Use phone-camera observations to surface possible crop stress signals for your review. It is a decision aid, not a diagnosis.",
  },
  {
    icon: Brain,
    title: "Research-Framed Guidance",
    description: "Review field-aware observations with uncertainty and source context visible.",
  },
  {
    icon: MapPin,
    title: "Field Mapping",
    description: "Organize GPS-tagged observations and field history so changes can be reviewed over time.",
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Keep crop photos and assessment notes together for your own records and supporting documentation.",
  },
];

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandEmblem className="h-10 w-10" />
            <span className="text-2xl font-heading font-bold">Agurate<span className="text-primary">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/how-it-works"><Button variant="ghost" size="sm">How It Works</Button></Link>
            <Link to="/auth"><Button size="sm">Sign In</Button></Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
        <section className="relative overflow-hidden">
          <img src={heroFields} alt="Agricultural fields" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 to-primary/60" />
          <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
            <div className="max-w-3xl">
              <Badge className="mb-6 bg-background/95 text-foreground border-0">Public access</Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground leading-tight mb-6">
                Crop intelligence you can put to work in the field
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed mb-8">
                AgurateAI is now open for anyone to try. Create an account, explore the tools, and use crop observations as research-informed decision support — not as a diagnosis or guaranteed outcome.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 px-8 py-6 text-lg">
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/50 bg-background/10 text-primary-foreground hover:bg-background/20 px-8 py-6 text-lg">
                    Explore AgurateAI
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <Badge className="mb-4">Available now</Badge>
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Try the AgurateAI experience</h2>
              <p className="text-lg text-muted-foreground">No beta enrollment or seat count. Account creation is the entry point to the currently available product.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="border-2">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="rounded-2xl border-2 p-8 md:p-12 text-center shadow-card">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-5" aria-hidden="true" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Open access, clear limits</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Public availability does not mean every model, crop, geography, or outcome has been universally validated. AgurateAI keeps its research and uncertainty framing while making the product available for broader real-world use and feedback.
              </p>
              <Link to="/auth"><Button size="lg" className="gap-2">Create an Account <ArrowRight className="h-5 w-5" /></Button></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
