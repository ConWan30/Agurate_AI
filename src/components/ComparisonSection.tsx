import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, Zap } from "lucide-react";

export const ComparisonSection = memo(function ComparisonSection() {
  const comparisons = [
    {
      feature: "AI Crop Analysis",
      agurate: true,
      traditional: false,
      description: "Smartphone photo analysis vs. waiting on lab samples"
    },
    {
      feature: "Weather + Field History",
      agurate: true,
      traditional: false,
      description: "Morehouse weather beside your soybean scans vs. memory-only notes"
    },
    {
      feature: "LSU Research Framing",
      agurate: true,
      traditional: "Limited",
      description: "Guidance framed around public LSU AgCenter research (not an official partnership)"
    },
    {
      feature: "Evidence-Bound Scope",
      agurate: true,
      traditional: false,
      description: "Retired chatbot surfaces stay deferred instead of promoted as active product"
    },
    {
      feature: "Honest Pilot Scope",
      agurate: true,
      traditional: false,
      description: "Soybean + Morehouse only; unvalidated suite modules stay deferred"
    },
    {
      feature: "Soybean Variety Context",
      agurate: true,
      traditional: "Generic",
      description: "Morehouse soybean variety context from public LSU materials"
    },
    {
      feature: "Field History Ledger",
      agurate: true,
      traditional: false,
      description: "Your soybean scans stay attributable — no invented peer outcomes in pilot"
    },
    {
      feature: "Mobile-First Design",
      agurate: true,
      traditional: false,
      description: "Works in the field, not just office"
    },
    {
      feature: "Access",
      agurate: "Public",
      traditional: "$$$",
      description: "Account access through normal authentication"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 text-sm px-4 py-2 shadow-card">
            <Zap className="h-3 w-3 mr-1" />
            Why AgurateAI?
          </Badge>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
            Built Different for Louisiana Delta
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            See how AgurateAI compares to traditional crop monitoring services
          </p>
        </div>

        <Card className="max-w-5xl mx-auto border-2 shadow-field">
          <CardHeader className="bg-muted/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div></div>
              <div>
                <CardTitle className="text-lg">AgurateAI</CardTitle>
                <Badge className="mt-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none">
                  Next-Gen Platform
                </Badge>
              </div>
              <div>
                <CardTitle className="text-lg">Traditional Services</CardTitle>
                <Badge variant="outline" className="mt-2">
                  Legacy Methods
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {comparisons.map((item, index) => (
              <div 
                key={index}
                className={`grid grid-cols-3 gap-4 p-4 items-center ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                } hover:bg-muted/50 transition-colors`}
              >
                <div>
                  <p className="font-semibold text-sm md:text-base">{item.feature}</p>
                  <p className="text-xs text-muted-foreground hidden md:block">{item.description}</p>
                </div>
                <div className="flex justify-center">
                  {item.agurate === true ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <span className="text-sm font-semibold text-primary">{item.agurate}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {item.traditional === true ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : item.traditional === false ? (
                    <X className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <span className="text-sm text-muted-foreground">{item.traditional}</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            * Comparison based on typical traditional crop monitoring services in Louisiana Delta region
          </p>
        </div>
      </div>
    </section>
  );
});
