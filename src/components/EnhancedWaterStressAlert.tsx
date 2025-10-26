import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, AlertTriangle, ExternalLink } from "lucide-react";
import { WaterStressEvent } from "@/types/enhanced-features";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnhancedWaterStressAlertProps {
  waterStress: WaterStressEvent;
}

export function EnhancedWaterStressAlert({ waterStress }: EnhancedWaterStressAlertProps) {
  const { toast } = useToast();

  const severityConfig = {
    mild: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: Droplets },
    moderate: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: Droplets },
    severe: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
  };

  const config = severityConfig[waterStress.severity];
  const Icon = config.icon;

  const handleDIRTClick = async () => {
    try {
      await supabase
        .from('water_stress_events')
        .update({ dirt_clicked: true })
        .eq('id', waterStress.id);

      await supabase.from('dirt_referral_metrics').insert({
        field_id: waterStress.field_id,
        water_stress_score: waterStress.stress_score,
        dirt_clicked: true,
      });

      window.open('https://delta-iat.water.msstate.edu/', '_blank');
      
      toast({
        title: "DIRT Tool Opened",
        description: "Opening MSU DIRT irrigation scheduling tool",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Alert className={`${config.bg} border-2`}>
      <Icon className={`h-5 w-5 ${config.color}`} />
      <AlertTitle className="flex items-center gap-2 mb-2">
        <span className={config.color}>Water Stress Detected - {waterStress.severity.toUpperCase()}</span>
        <Badge variant="outline" className="text-xs">
          {(waterStress.stress_score * 100).toFixed(0)}% severity
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="space-y-1">
          <p className="font-medium">Symptoms Detected:</p>
          <div className="flex flex-wrap gap-2">
            {waterStress.symptoms_detected.map((symptom, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {symptom}
              </Badge>
            ))}
          </div>
        </div>

        {waterStress.weather_context && (
          <div className="text-sm">
            <p className="font-medium">Weather Context:</p>
            <p className="text-muted-foreground">
              Temp: {waterStress.weather_context.temp_f}°F | 
              Forecast: {waterStress.weather_context.forecast || 'No significant rain'}
            </p>
          </div>
        )}

        {waterStress.dirt_recommendation && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">
              🎯 AI Recommendation: Optimize irrigation timing
            </p>
            <Button 
              onClick={handleDIRTClick}
              size="sm"
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open DIRT Irrigation Tool
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              MSU DIRT provides data-driven irrigation scheduling for Louisiana Delta crops
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Confidence: {(waterStress.confidence * 100).toFixed(0)}% | 
          Detected: {new Date(waterStress.created_at).toLocaleDateString()}
        </div>
      </AlertDescription>
    </Alert>
  );
}
