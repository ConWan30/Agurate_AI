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
      // Service-locked metrics: only flip dirt_clicked (+ referral row) via RPC
      const { error } = await supabase.rpc('mark_water_stress_dirt_clicked', {
        event_id: waterStress.id,
      });
      if (error) throw error;

      // Open only after the referral write succeeds — do not invent a recorded click.
      window.open('https://delta-iat.water.msstate.edu/', '_blank', 'noopener,noreferrer');

      toast({
        title: "DIRT referral recorded",
        description: "Opening the public MSU DIRT irrigation scheduling tool (external site).",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Could not record DIRT referral",
        description: "Click was not saved. You can still open DIRT manually if needed.",
        variant: "destructive",
      });
      // Still allow the farmer to reach the external tool, but do not claim the click was recorded.
      window.open('https://delta-iat.water.msstate.edu/', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Alert className={`${config.bg} border-2`}>
      <Icon className={`h-5 w-5 ${config.color}`} />
      <AlertTitle className="flex items-center gap-2 mb-2">
        <span className={config.color}>
          Water Stress Detected - {(waterStress.severity || 'unknown').toUpperCase()}
        </span>
        <Badge variant="outline" className="text-xs">
          {(() => {
            const n = Number(waterStress.stress_score);
            return Number.isFinite(n) && n >= 0 && n <= 1
              ? `${(n * 100).toFixed(0)}% severity`
              : 'severity not recorded';
          })()}
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="space-y-1">
          <p className="font-medium">Symptoms Detected:</p>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const symptoms = Array.isArray(waterStress.symptoms_detected)
                ? waterStress.symptoms_detected
                : [];
              if (symptoms.length === 0) {
                return <span className="text-sm text-muted-foreground">No symptoms recorded</span>;
              }
              return symptoms.map((symptom, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {symptom}
                </Badge>
              ));
            })()}
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
          {(() => {
            const n = Number(waterStress.confidence);
            return Number.isFinite(n) && n >= 0 && n <= 1
              ? `${(n * 100).toFixed(0)}%`
              : 'not recorded';
          })()}{' '}
          | Detected: {new Date(waterStress.created_at).toLocaleDateString()}
        </div>
      </AlertDescription>
    </Alert>
  );
}
