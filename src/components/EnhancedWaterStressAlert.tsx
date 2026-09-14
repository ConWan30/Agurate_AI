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

  const severityConfig: Record<string, { color: string; bg: string; icon: typeof Droplets }> = {
    none: { color: 'text-muted-foreground', bg: 'bg-muted/40 border-muted', icon: Droplets },
    mild: { color: 'text-health-moderate', bg: 'bg-health-moderate/10 border-health-moderate/30', icon: Droplets },
    moderate: { color: 'text-health-moderate', bg: 'bg-health-moderate/20 border-health-moderate/40', icon: Droplets },
    severe: { color: 'text-health-severe', bg: 'bg-health-severe/10 border-health-severe/30', icon: AlertTriangle },
    critical: { color: 'text-health-severe', bg: 'bg-health-severe/20 border-health-severe/40', icon: AlertTriangle },
    unknown: { color: 'text-muted-foreground', bg: 'bg-muted/40 border-muted', icon: Droplets },
  };

  const config = severityConfig[waterStress.severity] ?? severityConfig.unknown;
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
          {waterStress.stress_score != null && Number.isFinite(Number(waterStress.stress_score))
            ? `${(Number(waterStress.stress_score) * 100).toFixed(0)}% severity`
            : 'severity not recorded'}
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
              {waterStress.weather_context.temp_f != null && Number.isFinite(Number(waterStress.weather_context.temp_f))
                ? `Temp: ${waterStress.weather_context.temp_f}°F`
                : 'Temp: not recorded'}
              {waterStress.weather_context.forecast
                ? ` | Forecast: ${waterStress.weather_context.forecast}`
                : ''}
            </p>
          </div>
        )}

        {waterStress.dirt_recommendation && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">
              External irrigation planning tool
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
              Opens the public MSU DIRT irrigation scheduling tool in a new tab — not an embedded AgurateAI integration.
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Confidence:{' '}
          {waterStress.confidence != null && Number.isFinite(Number(waterStress.confidence))
            ? `${(Number(waterStress.confidence) * 100).toFixed(0)}%`
            : 'not recorded'}{' '}
          | Detected: {new Date(waterStress.created_at).toLocaleDateString()}
        </div>
      </AlertDescription>
    </Alert>
  );
}
