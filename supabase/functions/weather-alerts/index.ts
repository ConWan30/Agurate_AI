import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const weatherAlertsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

interface WeatherAlert {
  type: "frost" | "drought" | "severe_weather" | "excessive_rain";
  severity: "warning" | "watch" | "advisory";
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  affected_areas: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const body = weatherAlertsSchema.parse(await req.json());
    const { latitude, longitude } = body;

    // NOAA API - National Weather Service alerts
    const alertsUrl = `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`;
    
    const alertsResponse = await fetch(alertsUrl, {
      headers: {
        "User-Agent": "AgurateAI/1.0 (contact@agurate.ai)",
        "Accept": "application/geo+json"
      }
    });

    if (!alertsResponse.ok) {
      throw new Error("Failed to fetch weather alerts from NOAA");
    }

    const alertsData = await alertsResponse.json();
    const features = alertsData.features || [];

    // Process and categorize alerts
    const processedAlerts: WeatherAlert[] = features.map((feature: any) => {
      const props = feature.properties;
      
      let type: WeatherAlert["type"] = "severe_weather";
      const event = props.event?.toLowerCase() || "";
      
      if (event.includes("frost") || event.includes("freeze")) {
        type = "frost";
      } else if (event.includes("drought")) {
        type = "drought";
      } else if (event.includes("flood") || event.includes("rain")) {
        type = "excessive_rain";
      }

      return {
        type,
        severity: props.severity?.toLowerCase() || "advisory",
        title: props.event || "Weather Alert",
        description: props.headline || props.description || "Weather alert in your area",
        start_time: props.onset || new Date().toISOString(),
        end_time: props.ends || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        affected_areas: props.areaDesc?.split(";") || []
      };
    });

    // Filter for agriculture-relevant alerts
    const agAlerts = processedAlerts.filter(alert => 
      alert.type === "frost" || 
      alert.type === "drought" || 
      alert.type === "excessive_rain"
    );

    // Store alerts in Supabase for notification system
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store weather events for historical tracking
    for (const alert of agAlerts) {
      await supabase.from("weather_events").insert({
        event_type: alert.type,
        event_date: new Date(alert.start_time).toISOString().split("T")[0],
        description: alert.description,
        temperature_f: null,
        precipitation_inches: null,
        location_lat: latitude,
        location_lng: longitude
      });
    }

    return new Response(
      JSON.stringify({
        alerts: agAlerts,
        count: agAlerts.length,
        location: { latitude, longitude }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Weather alerts error:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input parameters",
          details: error.errors,
          alerts: [],
          count: 0
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        alerts: [],
        count: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
