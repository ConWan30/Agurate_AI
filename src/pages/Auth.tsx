import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sprout, Shield, CheckCircle2, ArrowLeft, Zap, Users } from "lucide-react";
import heroFields from "@/assets/hero-fields.jpg";
import bgDeltaRice from "@/assets/bg-delta-rice.jpg";
import { z } from "zod";
import { TrustIndicators } from "@/components/TrustIndicators";

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(1, "Password is required")
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  fullName: z.string()
    .min(1, "Full name is required")
    .max(100, "Name too long")
    .trim(),
  farmName: z.string()
    .max(200, "Farm name too long")
    .trim()
    .optional()
    .or(z.literal(''))
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    fullName: "",
    farmName: "",
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate input
    const validation = signUpSchema.safeParse(signUpData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: signUpData.email,
            full_name: signUpData.fullName,
            farm_name: signUpData.farmName || null,
          });

        if (profileError) throw profileError;

      toast({
        title: "Account created!",
        description: "Welcome to AgurateAI",
      });
      navigate("/dashboard");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate input
    const validation = signInSchema.safeParse(signInData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
      });
      navigate("/dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Louisiana Delta Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgDeltaRice})` }}
      />
      <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Left side - Enhanced Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroFields})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-primary/65" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-foreground/30 rounded-full animate-float" />
          <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-primary-foreground/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-primary-foreground/25 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground animate-fade-in">
          {/* Logo with glow */}
          <div className="flex items-center gap-4 mb-8 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-foreground/20 rounded-2xl blur-xl animate-glow-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20">
                <Sprout className="h-12 w-12 animate-float" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-heading font-bold">
                Agurate<span className="text-primary-foreground">AI</span>
              </h1>
              <p className="text-sm opacity-75 mt-1">Morehouse Parish, Louisiana</p>
            </div>
          </div>

          <Badge className="mb-6 w-fit glass border-primary-foreground/40 text-primary-foreground backdrop-blur-md">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered Precision Agriculture
          </Badge>
          
          <h2 className="text-3xl font-heading font-bold mb-4 leading-tight">
            Transform Your Farming with Intelligent Crop Analysis
          </h2>
          
              <p className="text-lg opacity-90 mb-8 leading-relaxed">
            Real-time crop health monitoring for rice, soybean, cotton, and corn. 
            Guidance framed around publicly available LSU AgCenter research.
          </p>

          {/* Feature list with icons */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Real-time Crop Assessment</p>
                <p className="text-sm opacity-75">Research-framed crop health assessments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Research-informed</p>
                <p className="text-sm opacity-75">Framed around public LSU AgCenter research</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Cooperative Network</p>
                <p className="text-sm opacity-75">Share insights with neighbors</p>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-12 pt-8 border-t border-primary-foreground/20">
            <TrustIndicators variant="compact" className="justify-center md:justify-start" />
          </div>
        </div>
      </div>

      {/* Right side - Enhanced Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-md relative z-10">
          {/* Back to home link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Mobile header with enhanced styling */}
          <div className="lg:hidden text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
                <div className="relative h-14 w-14 rounded-xl gradient-delta shadow-glow flex items-center justify-center">
                  <Sprout className="h-8 w-8 text-primary-foreground animate-float" />
                </div>
              </div>
              <div className="text-left">
                <span className="text-3xl font-display font-bold">
                  Agurate<span className="text-primary">AI</span>
                </span>
                <p className="text-xs text-muted-foreground">Morehouse Parish, LA</p>
              </div>
            </div>
            <p className="text-muted-foreground">AI-Powered Crop Health Monitoring</p>
          </div>

          <Tabs defaultValue="signin" className="w-full animate-fade-in">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 h-12">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-background data-[state=active]:shadow-card transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-background data-[state=active]:shadow-card transition-all"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="animate-fade-in">
              <Card className="border-2 shadow-field hover-lift transition-all">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl gradient-delta shadow-glow flex items-center justify-center">
                      <Sprout className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-heading">Welcome Back</CardTitle>
                      <CardDescription>Sign in to access your dashboard</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
            <Label htmlFor="signin-email" className="text-sm font-semibold">
                        Email Address
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="farmer@example.com"
                        value={signInData.email}
                        onChange={(e) =>
                          setSignInData({ ...signInData, email: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary transition-colors focus-ring"
                        autoComplete="email"
                        required
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-sm font-semibold">
                          Password
                        </Label>
                        <Link 
                          to="/reset-password" 
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) =>
                          setSignInData({ ...signInData, password: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary transition-colors focus-ring"
                        autoComplete="current-password"
                        required
                      />
                      {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 shadow-glow hover:shadow-field transition-all hover-lift text-base font-semibold" 
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Signing in...
                        </span>
                      ) : (
                        "Sign In to Dashboard"
                      )}
                    </Button>

                    <div className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            const signupTab = document.querySelector('[value="signup"]') as HTMLElement;
                            signupTab?.click();
                          }}
                          className="text-primary font-semibold hover:underline"
                        >
                          Create one now
                        </button>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="animate-fade-in">
              <Card className="border-2 shadow-field hover-lift transition-all">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl gradient-harvest shadow-glow flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-heading">Join Free Beta</CardTitle>
                      <CardDescription>Be one of the first 100 Louisiana Delta farmers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-semibold">
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Farmer"
                        value={signUpData.fullName}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, fullName: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary transition-colors"
                        autoComplete="name"
                        required
                      />
                      {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-farm" className="text-sm font-semibold">
                        Farm Name{" "}
                        <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <Input
                        id="signup-farm"
                        type="text"
                        placeholder="Green Acres Farm"
                        value={signUpData.farmName}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, farmName: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary transition-colors"
                      />
                      {errors.farmName && <p className="text-sm text-destructive mt-1">{errors.farmName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-semibold">
                        Email Address
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="farmer@example.com"
                        value={signUpData.email}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, email: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary transition-colors"
                        autoComplete="email"
                        required
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-semibold">
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={signUpData.password}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, password: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary transition-colors"
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      {errors.password ? (
                        <p className="text-sm text-destructive mt-1">{errors.password}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          At least 8 characters with a letter and a number
                        </p>
                      )}
                    </div>

                    {/* Trust indicators */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
                      <Shield className="h-5 w-5 text-success flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Your data is encrypted and secure. We never share your information.
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 shadow-glow hover:shadow-field transition-all hover-lift text-base font-semibold" 
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Creating account...
                        </span>
                      ) : (
                        "Join Free Beta"
                      )}
                    </Button>

                    <div className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            const signinTab = document.querySelector('[value="signin"]') as HTMLElement;
                            signinTab?.click();
                          }}
                          className="text-primary font-semibold hover:underline"
                        >
                          Sign in here
                        </button>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}