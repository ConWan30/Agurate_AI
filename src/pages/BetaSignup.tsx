import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Rocket, DollarSign, Wrench, Star, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const betaSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  farm_name: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  primary_crop: z.string().min(1, "Primary crop is required"),
  acreage: z.coerce.number().positive().optional().or(z.literal("")),
  why_interested: z.string().max(500).optional(),
  consent: z.boolean().refine((val) => val === true, "You must agree to participate"),
  email_consent: z.boolean().default(false),
});

type BetaSignupForm = z.infer<typeof betaSignupSchema>;

export default function BetaSignup() {
  const navigate = useNavigate();
  const [betaCount, setBetaCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [betaNumber, setBetaNumber] = useState<number>(0);

  const form = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
    defaultValues: {
      name: "",
      email: "",
      farm_name: "",
      location: "",
      primary_crop: "",
      acreage: undefined,
      why_interested: "",
      consent: false,
      email_consent: false,
    },
  });

  useEffect(() => {
    fetchBetaCount();
  }, []);

  const fetchBetaCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_beta_farmer_count');
      if (error) throw error;
      setBetaCount(data || 0);
    } catch (error) {
      console.error('Error fetching beta count:', error);
    }
  };

  const onSubmit = async (data: BetaSignupForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beta-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.error === 'beta_full') {
          toast.error('Beta program is full', {
            description: result.message,
          });
        } else if (result.error === 'email_exists') {
          toast.error('Email already registered', {
            description: result.message,
            action: {
              label: 'Sign In',
              onClick: () => navigate('/auth'),
            },
          });
        } else {
          toast.error('Signup failed', {
            description: result.message,
          });
        }
        return;
      }

      setBetaNumber(result.betaNumber);
      setShowSuccess(true);
      toast.success('Welcome to AgurateAI Beta!', {
        description: `You're Beta Farmer #${result.betaNumber}`,
      });

    } catch (error) {
      console.error('Beta signup error:', error);
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const spotsRemaining = 100 - betaCount;
  const spotsPercentage = (betaCount / 100) * 100;
  const showUrgency = spotsRemaining <= 25;
  const isCritical = spotsRemaining <= 10;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-heading">🎉 Welcome to AgurateAI Beta!</CardTitle>
            <CardDescription className="text-lg">
              You're Beta Farmer #{betaNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Next Steps:</h3>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-muted-foreground">
                  <strong className="text-foreground">Check your email</strong> to set your password
                </li>
                <li className="text-muted-foreground">
                  <strong className="text-foreground">Complete your profile setup</strong> with field details
                </li>
                <li className="text-muted-foreground">
                  <strong className="text-foreground">Upload your first crop image</strong> for AI analysis
                </li>
              </ol>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/auth')}>
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold">
            🌾 Join AgurateAI Beta Program
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Free for First 100 Louisiana Delta Farmers + Lifetime 50% Discount
          </p>
          
          {/* Beta Status */}
          <div className="flex flex-col items-center gap-4 py-6">
            <Badge variant={isCritical ? "destructive" : showUrgency ? "default" : "secondary"} className="text-lg px-4 py-2">
              <Sparkles className="mr-2 h-4 w-4" />
              {betaCount}/100 spots filled
            </Badge>
            <div className="w-full max-w-md">
              <Progress value={spotsPercentage} className="h-3" />
            </div>
            {isCritical && (
              <p className="text-destructive font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Only {spotsRemaining} spots remaining! Join now to secure your lifetime discount.
              </p>
            )}
            {showUrgency && !isCritical && (
              <p className="text-primary font-semibold">
                🔔 {spotsRemaining} spots remaining - Join the beta program soon!
              </p>
            )}
          </div>

          <Button size="lg" className="text-lg px-8 py-6" onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Start Free Beta <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Beta Benefits Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">Beta Program Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Rocket className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Free Unlimited Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use all 17 features completely free during beta period
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <DollarSign className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Lifetime 50% Discount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Lock in 50% off forever when beta ends
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Wrench className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Shape Product Development</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your feedback directly influences new features
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Star className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Priority Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get priority help during beta period
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">What You'll Get</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "AI Crop Analysis Engine (instant health assessment)",
              "7-Day Stress Predictions (proactive forecasting)",
              "Delta Intelligence Chat (24/7 agricultural advisor)",
              "Insurance Claim Documentation (automated evidence)",
              "Community Intelligence Network (anonymous benchmarking)",
              "Interactive Field Map with GPS tagging",
              "Weather-Correlated Health Timeline",
              "Recommendations framed around LSU AgCenter research",
              "Conservation Practice Tracking",
              "Variety Performance Analytics",
              "ROI Calculator for treatments",
              "And 6 more features...",
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section id="signup-form" className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Start Your Free Beta</CardTitle>
              <CardDescription>
                Join the first 100 Louisiana Delta farmers to get lifetime 50% discount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="James Collins" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="james@farm.com" {...field} />
                        </FormControl>
                        <FormDescription>We'll use this for your account login</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="farm_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Collins Family Farm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morehouse-parish">Morehouse Parish, LA</SelectItem>
                            <SelectItem value="bastrop">Bastrop, LA</SelectItem>
                            <SelectItem value="mer-rouge">Mer Rouge, LA</SelectItem>
                            <SelectItem value="oak-grove">Oak Grove, LA</SelectItem>
                            <SelectItem value="other-delta">Other Louisiana Delta area</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Beta program focused on Louisiana Delta farmers</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primary_crop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Crop Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select crop type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rice">🌾 Rice</SelectItem>
                            <SelectItem value="soybeans">🟢 Soybeans</SelectItem>
                            <SelectItem value="cotton">⚪ Cotton</SelectItem>
                            <SelectItem value="corn">🌽 Corn</SelectItem>
                            <SelectItem value="multiple">Multiple crops</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acreage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acreage (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="200" {...field} />
                        </FormControl>
                        <FormDescription>Helps us customize your experience</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="why_interested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why Are You Interested? (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="I want to improve my crop health monitoring and reduce yield losses..."
                            className="min-h-[100px]"
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{field.value?.length || 0}/500 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to participate in the beta program and provide feedback to help improve AgurateAI *
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email_consent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Send me updates about new features and beta program news
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Start Free Beta'}
                    {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-heading font-bold">Closed beta for Louisiana Delta farmers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">100</p>
              <p className="text-muted-foreground">Beta partner spots</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">LSU AgCenter</p>
              <p className="text-muted-foreground">Research framing only</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">Yours</p>
              <p className="text-muted-foreground">Farm data stays yours</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            Not scientifically validated. Decision aid for early pilot partners — not a certified diagnosis.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How long is the beta program?</AccordionTrigger>
              <AccordionContent>
                Beta program runs until we reach 100 farmers. After that, beta farmers continue with lifetime 50% discount.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What happens when beta ends?</AccordionTrigger>
              <AccordionContent>
                You'll automatically get lifetime 50% discount on all paid plans. Free access continues until paid plans launch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Do I need to provide feedback?</AccordionTrigger>
              <AccordionContent>
                Feedback is optional but highly appreciated! It helps us build features farmers actually need.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Is my data secure?</AccordionTrigger>
              <AccordionContent>
                You own your farm data. We do not sell individual farm data. Access is protected with authenticated accounts and database row-level security.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>What if I'm not in Morehouse Parish?</AccordionTrigger>
              <AccordionContent>
                Beta program is open to all Louisiana Delta farmers. Morehouse Parish is our primary focus, but we welcome all Delta farmers.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
