import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, Award, ExternalLink, Shield } from "lucide-react";
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
            Built on 130+ Years of Research
          </Badge>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Powered by LSU AgCenter Excellence
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Every recommendation is backed by Louisiana State University's Agricultural Center—
            the trusted source for Louisiana farmers since 1888.
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
                  <h3 className="text-2xl font-bold mb-3">LSU AgCenter Research Integration</h3>
                  <p className="text-muted-foreground mb-4">
                    Our AI models are trained on comprehensive research from LSU AgCenter's 12 research stations 
                    across Louisiana, with specialized data from the Northeast Research Station in Morehouse Parish.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      Scientifically Validated
                    </Badge>
                    <Badge variant="secondary">
                      <Award className="h-3 w-3 mr-1" />
                      Peer Reviewed
                    </Badge>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      Field Tested
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
              <h3 className="text-xl font-bold mb-3">Connect with Experts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get direct access to LSU AgCenter researchers for complex crop issues. 
                Our platform connects you with specialists in crop pathology, entomology, and agronomy.
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg glass border border-border/50">
            <div className="text-4xl font-bold text-primary mb-2">130+</div>
            <div className="text-sm text-muted-foreground">Years of Research</div>
          </div>
          <div className="text-center p-6 rounded-lg glass border border-border/50">
            <div className="text-4xl font-bold text-primary mb-2">12</div>
            <div className="text-sm text-muted-foreground">Research Stations</div>
          </div>
          <div className="text-center p-6 rounded-lg glass border border-border/50">
            <div className="text-4xl font-bold text-primary mb-2">100+</div>
            <div className="text-sm text-muted-foreground">Publications</div>
          </div>
          <div className="text-center p-6 rounded-lg glass border border-border/50">
            <div className="text-4xl font-bold text-primary mb-2">8+</div>
            <div className="text-sm text-muted-foreground">Expert Researchers</div>
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
