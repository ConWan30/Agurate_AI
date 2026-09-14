import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedPageHeader } from "@/components/EnhancedPageHeader";

export default function Upgrade() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small operations",
      features: [
        "1 farmer, 5 fields",
        "100 assessments/month",
        "Basic AI analysis",
        "Email support",
        "Mobile app access"
      ],
      buttonText: "Select Plan",
      buttonVariant: "outline" as const
    },
    {
      name: "Professional",
      betaPriceLabel: "50% off published rate",
      description: "Most popular for Louisiana farmers",
      features: [
        "Fields & assessments for your whole operation",
        "Multi-day stress outlooks when data supports them",
        "LSU researcher directory (public profiles)",
        "Insurance claim documentation support",
        "Weather timeline analytics",
        "Priority support",
        "Early access to new features"
      ],
      buttonText: "Notify Me When Billing Opens",
      buttonVariant: "default" as const,
      isFeatured: true,
      betaDiscount: "50% OFF PUBLISHED RATE"
    },
    {
      name: "Cooperative",
      description: "For farming cooperatives",
      features: [
        "25+ farmers",
        "Shared intelligence network",
        "Bulk purchasing insights",
        "Community analytics dashboard",
        "Dedicated account manager",
        "Custom integrations"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnhancedPageHeader
        title="Continue Your AgurateAI Journey"
        description="Choose the plan that fits your farming operation"
        icon={DollarSign}
      />

      <div className="container max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Value proposition */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge className="bg-primary text-primary-foreground">
            🌟 Beta Farmer Exclusive Offer
          </Badge>
          <h2 className="text-3xl font-bold">
            Your Beta Pricing Benefit
          </h2>
          <p className="text-lg text-muted-foreground">
            As a beta farmer, you've helped us build AgurateAI. Beta farmers may keep 50% off the published plan rate when paid plans launch. Billing checkout is not open yet.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.isFeatured
                  ? "border-primary shadow-2xl relative scale-105"
                  : "border-border"
              }
            >
              {plan.isFeatured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
                    <Sparkles className="h-3 w-3 mr-1 inline" />
                    Beta Exclusive
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>

                <div className="pt-4">
                  {plan.betaPriceLabel ? (
                    <div className="space-y-2">
                      <p className="text-5xl font-bold text-primary">
                        Beta rate
                      </p>
                      <Badge className="bg-primary/10 text-primary border-primary/30">
                        {plan.betaDiscount}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {plan.betaPriceLabel} after conversion — confirm current published pricing in-app at signup.
                      </p>
                    </div>
                  ) : (
                    <p className="text-4xl font-bold">
                      Custom
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.betaPriceLabel ? "beta pricing benefit when billing launches" : "contact for pricing"}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.buttonVariant}
                  className={`w-full ${
                    plan.isFeatured
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                      : ""
                  }`}
                  onClick={() => {
                    if (plan.name === "Cooperative") {
                      window.location.href = "mailto:support@agurateai.com?subject=Cooperative%20Plan%20Inquiry";
                    } else {
                      window.location.href = "mailto:support@agurateai.com?subject=Beta%20Pricing%20Waitlist";
                    }
                  }}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ section */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl font-bold text-center">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens when beta ends?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Beta farmers who convert may keep 50% off the published plan rate. Your data and fields remain intact with continued feature access.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade or downgrade at any time. Beta farmers may keep 50% off the published rate across plan changes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Paid checkout is not live yet. Email support@agurateai.com to join the billing waitlist when plans launch.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
