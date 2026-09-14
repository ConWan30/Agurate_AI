import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, ExternalLink, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function LSUPartnershipSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 text-sm px-4 py-2 shadow-card">
            <GraduationCap className="h-3 w-3 mr-1" />
            Research-informed
          </Badge>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Framed around LSU AgCenter research
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Guidance is informed by publicly available LSU AgCenter research. LSU AgCenter has served Louisiana farmers since 1888. AgurateAI is not an official LSU partner and is not scientifically validated by them.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          {/* Main Partnership Card */}
          <Card className="border-2 hover:border-primary transition-all hover-lift md:col-span-2">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-2xl gradient-delta shadow-glow flex items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-3">Research framing</h3>
                  <p className="text-muted-foreground mb-4">
                    We frame crop guidance around published LSU AgCenter research, including Northeast Louisiana and Morehouse Parish context. This is not a data-sharing partnership and not a claim that their stations trained our model.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      Research-informed
                    </Badge>
                    <Badge variant="secondary">
                      Not an official partnership
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Areas */}
          <Card className="border-2 hover:border-primary transition-all hover-lift group">
            <CardContent className="p-6">
              <BookOpen className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3">Research Integration</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Crop genetics and plant breeding programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Precision agriculture technologies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Soil health and water management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Pest and disease management strategies</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Direct Researcher Access */}
          <Card className="border-2 hover:border-primary transition-all hover-lift group">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3">Researcher Directory</h3>
              <p className="text-sm text-muted-foreground mb-4">
                A directory of public LSU AgCenter researcher profiles. Contact them through official LSU channels — we do not broker introductions.
              </p>
              <Link to="/lsu-researchers">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  View LSU Researchers
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="text-center p-6 rounded-lg glass border border-border/50">
            <div className="text-4xl font-bold text-primary mb-2">1888</div>
            <div className="text-sm text-muted-foreground">AgCenter founded</div>
          </div>
          <div className="text-center p-6 rounded-lg glass border border-border/50">
            <div className="text-2xl font-bold text-primary mb-2">Public research</div>
            <div className="text-sm text-muted-foreground">Not our validation</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a 
            href="https://www.lsuagcenter.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
          >
            Learn more about LSU AgCenter
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
