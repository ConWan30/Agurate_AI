import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import bgHandsSoil from "@/assets/bg-hands-soil.jpg";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    email: "",
    full_name: "",
    phone: "",
    farm_name: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          email: data.email || user.email || "",
          full_name: data.full_name || "",
          phone: data.phone || "",
          farm_name: data.farm_name || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          farm_name: profile.farm_name,
          email: profile.email,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingState message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-delta-mist"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(120, 53, 15, 0.88) 0%, rgba(92, 64, 51, 0.85) 100%), url(${bgHandsSoil})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
            Profile Settings
          </h1>
          <p className="text-white/90 text-base md:text-lg max-w-2xl">
            Manage your account information and farm details
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <AnimatedCard>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="font-heading">Account Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Farmer"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm_name">Farm Name</Label>
                <Input
                  id="farm_name"
                  type="text"
                  placeholder="Green Acres Farm"
                  value={profile.farm_name}
                  onChange={(e) => setProfile({ ...profile, farm_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(318) 555-0100"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full focus-ring" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <CardHeader>
            <CardTitle className="font-heading">About AgurateAI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              AgurateAI helps farmers in Morehouse Parish, Louisiana monitor crop health using AI-powered image analysis.
            </p>
            <p className="pt-2">
              <strong>Supported Crops:</strong> Rice, Soybean, Cotton, Corn
            </p>
            <p>
              <strong>Version:</strong> 1.0.0 (MVP)
            </p>
          </CardContent>
        </AnimatedCard>
      </div>
    </div>
  );
}