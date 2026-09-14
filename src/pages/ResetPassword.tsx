import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sprout, ArrowLeft, Mail, CheckCircle2, KeyRound } from "lucide-react";
import bgDeltaRice from "@/assets/bg-delta-rice.jpg";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || !session) return;
      const hash = window.location.hash;
      if (hash.includes("type=recovery") || hash.includes("type%3Drecovery")) {
        setRecoveryMode(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setEmailSent(true);
      toast({
        title: "Email sent!",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      navigate("/auth");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgDeltaRice})` }}
      />
      <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />

      <div className="w-full flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-md relative z-10">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>

          <div className="text-center mb-8 animate-fade-in">
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
                <p className="text-xs text-muted-foreground">Password Reset</p>
              </div>
            </div>
          </div>

          {recoveryMode ? (
            <Card className="border-2 shadow-field hover-lift transition-all animate-fade-in">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl gradient-delta shadow-glow flex items-center justify-center">
                    <KeyRound className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Choose a New Password</CardTitle>
                    <CardDescription>Enter a new password for your account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-semibold">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 border-2 focus:border-primary transition-colors"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 border-2 focus:border-primary transition-colors"
                      autoComplete="new-password"
                      required
                    />
                    {passwordError ? (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        At least 8 characters with a letter and a number
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 shadow-glow hover:shadow-field transition-all hover-lift text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : !emailSent ? (
            <Card className="border-2 shadow-field hover-lift transition-all animate-fade-in">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl gradient-delta shadow-glow flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive reset instructions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="farmer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 border-2 focus:border-primary transition-colors"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 shadow-glow hover:shadow-field transition-all hover-lift text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <div className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Remember your password?{" "}
                      <Link to="/auth" className="text-primary font-semibold hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 shadow-field animate-fade-in">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Check Your Email</h3>
                <p className="text-muted-foreground mb-6">
                  We&apos;ve sent password reset instructions to <strong>{email}</strong>
                </p>
                <Badge variant="outline" className="mb-6">
                  <Mail className="h-3 w-3 mr-1" />
                  Email sent successfully
                </Badge>
                <p className="text-sm text-muted-foreground mb-6">
                  Open the link in that email to choose a new password. It returns you to this page.
                </p>
                <Link to="/auth">
                  <Button className="w-full">Back to Sign In</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
