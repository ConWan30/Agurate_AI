import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Award } from "lucide-react";
import { LSUResearcher } from "@/types/enhanced-features";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LSUResearcherContactCardProps {
  researcher: LSUResearcher;
  onContact?: () => void;
}

export function LSUResearcherContactCard({ researcher, onContact }: LSUResearcherContactCardProps) {
  const { toast } = useToast();

  const handleContact = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to contact researchers",
          variant: "destructive",
        });
        return;
      }

      await supabase.from('farmer_researcher_interactions').insert({
        farmer_id: user.id,
        researcher_id: researcher.id,
        interaction_type: 'question',
        status: 'pending',
      });

      toast({
        title: "Request recorded (no email sent)",
        description: `Request recorded for ${researcher.name}. This does not send email to LSU staff`,
      });
      
      onContact?.();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to send contact request",
        variant: "destructive",
      });
    }
  };

  const availabilityColors = {
    available: 'bg-health-good',
    busy: 'bg-health-moderate',
    unavailable: 'bg-health-severe',
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{researcher.name}</CardTitle>
              <CardDescription>{researcher.department}</CardDescription>
            </div>
          </div>
          <div className={`h-3 w-3 rounded-full ${availabilityColors[researcher.availability]}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Expertise:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {researcher.expertise.slice(0, 3).map((exp) => (
              <Badge key={exp} variant="secondary" className="text-xs">
                {exp}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Research Areas:</div>
          <div className="flex flex-wrap gap-2">
            {researcher.research_areas.slice(0, 3).map((area) => (
              <Badge key={area} variant="outline" className="text-xs">
                {area}
              </Badge>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleContact}
          className="w-full"
          disabled={researcher.availability === 'unavailable'}
        >
          <Mail className="mr-2 h-4 w-4" />
          Contact Researcher
        </Button>
      </CardContent>
    </Card>
  );
}
