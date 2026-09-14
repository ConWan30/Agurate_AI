import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CloudSnow, Droplets, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface WeatherAlert {
  type: "frost" | "drought" | "severe_weather" | "excessive_rain";
  severity: "warning" | "watch" | "advisory";
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  affected_areas: string[];
}

export function WeatherAlerts() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [locationReady, setLocationReady] = useState(true);

  useEffect(() => {
    checkWeatherAlerts();
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(checkWeatherAlerts, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkWeatherAlerts = async () => {
    setLoading(true);
    try {
      // Use a field with real coordinates — never invent parish defaults
      const { data: fields, error: fieldsError } = await supabase
        .from("fields")
        .select("location_lat, location_lng")
        .not("location_lat", "is", null)
        .not("location_lng", "is", null)
        .limit(1);

      if (fieldsError) throw fieldsError;

      const field = fields?.[0];
      if (!field?.location_lat || !field?.location_lng) {
        setAlerts([]);
        setLocationReady(false);
        setLastChecked(new Date());
        return;
      }

      setLocationReady(true);
      const latitude = Number(field.location_lat);
      const longitude = Number(field.location_lng);

      const { data, error } = await supabase.functions.invoke("weather-alerts", {
        body: { latitude, longitude }
      });

      if (error) throw error;

      setAlerts(data.alerts || []);
      setLastChecked(new Date());

      // Show toast for critical alerts
      const criticalAlerts = data.alerts?.filter((a: WeatherAlert) => a.severity === "warning");
      if (criticalAlerts && criticalAlerts.length > 0) {
        toast.warning(`${criticalAlerts.length} critical weather alert(s) detected!`, {
          description: criticalAlerts[0].title
        });
      }
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      toast.error("Failed to fetch weather alerts");
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "frost":
        return <CloudSnow className="h-5 w-5" />;
      case "drought":
        return <AlertTriangle className="h-5 w-5" />;
      case "excessive_rain":
        return <Droplets className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const normalizeSeverity = (severity: string): "warning" | "watch" | "advisory" | "unknown" => {
    const s = (severity || "").toLowerCase();
    if (s === "warning" || s === "watch" || s === "advisory") return s;
    return "unknown";
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (normalizeSeverity(severity)) {
      case "warning":
        return "destructive";
      case "watch":
        return "default";
      case "advisory":
        return "outline";
      default:
        // Fail closed — unknown is not an advisory
        return "secondary";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (normalizeSeverity(severity)) {
      case "warning":
        return "text-destructive";
      case "watch":
        return "text-warning";
      case "advisory":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityLabel = (severity: string) => {
    const n = normalizeSeverity(severity);
    return n === "unknown" ? "severity not recorded" : n;
  };

  if (alerts.length === 0 && !loading) {
    return (
      <Card className="field-card border-2">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Bell className="h-5 w-5 text-success" />
            Weather Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-success/10 mx-auto mb-4">
              <Bell className="h-8 w-8 text-success" />
            </div>
            <p className="text-muted-foreground">
              {locationReady ? "No active weather alerts" : "Weather alerts need a field location"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {locationReady
                ? "No active alerts for your field coordinates"
                : "Add GPS coordinates to a field to enable location-based alerts"}
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {lastChecked && `Last checked: ${format(lastChecked, "MMM dd, h:mm a")}`}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkWeatherAlerts}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="field-card border-2 border-warning/50">
      <CardHeader>
        <CardTitle className="font-display flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning animate-glow-pulse" />
            Weather Alerts
          </div>
          <Badge variant="destructive">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg border-2 border-border hover:border-warning/50 transition-colors space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <Badge variant={getSeverityVariant(alert.severity)} className="mt-1 text-xs capitalize">
                    {getSeverityLabel(alert.severity)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {alert.description}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>
                {format(new Date(alert.start_time), "MMM dd, h:mm a")}{alert.end_time ? ` - ${format(new Date(alert.end_time), "MMM dd, h:mm a")}` : " (end time not provided)"}
              </span>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {lastChecked && `Last checked: ${format(lastChecked, "MMM dd, h:mm a")}`}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkWeatherAlerts}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
