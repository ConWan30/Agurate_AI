import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sprout, MapPin, Camera, Sparkles, CheckCircle2 } from "lucide-react";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({ open, onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  // Step 1: Farm Profile
  const [farmName, setFarmName] = useState("");
  const [parish, setParish] = useState("");
  const [totalAcreage, setTotalAcreage] = useState("");
  
  // Step 2: Primary Crops
  const [primaryCrops, setPrimaryCrops] = useState<string[]>([]);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleCropToggle = (crop: string) => {
    setPrimaryCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  const handleNext = async () => {
    if (step === 2) {
      // Save farm profile to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const acreageRaw = totalAcreage.trim() === '' ? null : Number(totalAcreage);
        if (acreageRaw != null && (!Number.isFinite(acreageRaw) || acreageRaw < 0)) {
          toast({
            variant: "destructive",
            title: "Invalid acreage",
            description: "Total acreage must be a number greater than or equal to 0.",
          });
          return;
        }
        const { data: saved, error } = await supabase
          .from('profiles')
          .update({
            farm_name: farmName,
            parish: parish,
            total_acreage: acreageRaw,
            primary_crops: primaryCrops,
          })
          .eq('id', user.id)
          .select('id')
          .maybeSingle();

        if (error) {
          toast({
            variant: "destructive",
            title: "Error saving profile",
            description: error.message,
          });
          return;
        }
        if (!saved) {
          toast({
            variant: "destructive",
            title: "Error saving profile",
            description: "Profile was not updated (no matching row or update not permitted).",
          });
          return;
        }
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: completed, error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          // Entitlements (beta_farmer / lifetime_discount) are server-owned — set at beta-signup.
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error completing onboarding",
          description: error.message,
        });
        return;
      }
      if (!completed) {
        toast({
          variant: "destructive",
          title: "Error completing onboarding",
          description: "Onboarding was not marked complete (no matching row or update not permitted).",
        });
        return;
      }

      toast({
        title: "🌱 Welcome to AgurateAI Beta!",
        description: "You're all set! Let's start protecting your crops.",
      });
      onComplete();
    }
  };

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: skipped, error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();
      if (error || !skipped) {
        toast({
          variant: "destructive",
          title: "Could not skip onboarding",
          description: error?.message || "Profile was not updated.",
        });
        return;
      }
    }
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to AgurateAI Beta 🌱</DialogTitle>
          <DialogDescription>
            Let's get your farm set up in just a few quick steps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Farm Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Sprout className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Tell us about your farm</h3>
                  <p className="text-sm text-muted-foreground">Basic information to get started</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="farmName">Farm Name</Label>
                  <Input
                    id="farmName"
                    placeholder="e.g., Collins Family Farms"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <Label htmlFor="parish">Parish</Label>
                  <Select value={parish} onValueChange={setParish}>
                    <SelectTrigger id="parish">
                      <SelectValue placeholder="Select your parish" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morehouse">Morehouse</SelectItem>
                      <SelectItem value="East Carroll">East Carroll</SelectItem>
                      <SelectItem value="West Carroll">West Carroll</SelectItem>
                      <SelectItem value="Richland">Richland</SelectItem>
                      <SelectItem value="Madison">Madison</SelectItem>
                      <SelectItem value="Tensas">Tensas</SelectItem>
                      <SelectItem value="Franklin">Franklin</SelectItem>
                      <SelectItem value="Concordia">Concordia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="acreage">Total Acreage</Label>
                  <Input
                    id="acreage"
                    type="number"
                    placeholder="e.g., 500"
                    value={totalAcreage}
                    onChange={(e) => setTotalAcreage(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Primary Crops */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">What crops do you grow?</h3>
                  <p className="text-sm text-muted-foreground">Select all that apply</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {["Rice", "Soybeans", "Cotton", "Corn"].map((crop) => (
                  <div
                    key={crop}
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      primaryCrops.includes(crop.toLowerCase())
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleCropToggle(crop.toLowerCase())}
                  >
                    <Checkbox
                      checked={primaryCrops.includes(crop.toLowerCase())}
                      onCheckedChange={() => handleCropToggle(crop.toLowerCase())}
                    />
                    <label className="text-sm font-medium cursor-pointer">{crop}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: First Photo Tutorial */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">How to take great crop photos</h3>
                  <p className="text-sm text-muted-foreground">Tips for accurate AI analysis</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Get close to the plants</p>
                    <p className="text-muted-foreground">Fill the frame with leaves for detailed analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Use good lighting</p>
                    <p className="text-muted-foreground">Natural daylight works best, avoid harsh shadows</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Show the problem area</p>
                    <p className="text-muted-foreground">Focus on symptomatic leaves or affected areas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Multiple angles help</p>
                    <p className="text-muted-foreground">Take 2-3 photos from different perspectives</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Key Features */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Powerful features at your fingertips</h3>
                  <p className="text-sm text-muted-foreground">What you can do with AgurateAI</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-1">🔬 AI Crop Analysis</p>
                  <p className="text-muted-foreground">Fast phone-camera crop health reads — a decision aid, not a certified diagnosis</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-1">📊 7-Day Stress Predictions</p>
                  <p className="text-muted-foreground">Know what's coming before it damages your crops</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-1">Field assistant</p>
                  <p className="text-muted-foreground">On-demand Louisiana-specific agricultural advisor</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-1">📋 Insurance Documentation</p>
                  <p className="text-muted-foreground">GPS-stamped photos and automated claim reports</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Beta Benefits */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">You're part of something special!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  As a beta farmer, you get exclusive benefits
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="font-medium mb-1">✅ Closed-beta access at no charge</p>
                  <p className="text-muted-foreground">Core features available during beta without a paid plan</p>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="font-medium mb-1">💰 Beta pricing: possible discount off published rate</p>
                  <p className="text-muted-foreground">When paid plans launch, a discount off the published rate may be offered (not guaranteed; confirm in-app)</p>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="font-medium mb-1">🎯 Direct Founder Support</p>
                  <p className="text-muted-foreground">Your feedback shapes the future of AgurateAI</p>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="font-medium mb-1">🌟 Beta Farmer Badge</p>
                  <p className="text-muted-foreground">Forever recognized as a founding member</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={step === totalSteps}
            >
              {step === totalSteps ? "" : "Skip for now"}
            </Button>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button onClick={handleNext}>
                {step === totalSteps ? "Get Started!" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
