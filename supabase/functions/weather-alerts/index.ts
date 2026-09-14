import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from "../_shared/auth.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

/** Best-effort per-isolate rate limit to reduce authenticated write spam. */
const recentCalls = new Map<string, number[]>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 10;

function allowUserCall(userId: string): boolean {
  const now = Date.now();
  const prior = (recentCalls.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prior.length >= RATE_MAX) {
    recentCalls.set(userId, prior);
    return false;
  }
  prior.push(now);
  recentCalls.set(userId, prior);
  return true;
}

// Input validation schema
const weatherAlertsSchema = z.object({
  field_id: z.string().uuid(),
  /** @deprecated Ignored — coordinates are loaded from the owned field. */
  latitude: z.number().min(-90).max(90).optional(),
  /** @deprecated Ignored — coordinates are loaded from the owned field. */
  longitude: z.number().min(-180).max(180).optional(),
});

interface WeatherAlert {
  type: "frost" | "drought" | "high_wind" | "heavy_rain" | "heat_wave";
  severity: "warning" | "watch" | "advisory" | "unknown";
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  affected_areas: string[];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) {
      return auth;
    }
    const { user, authHeader } = auth;
    const rateLimitClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(rateLimitClient, user.id, {
      functionName: 'weather-alerts',
      maxRequests: RATE_LIMITS['weather-alerts'].maxRequests,
      windowMs: RATE_LIMITS['weather-alerts'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!allowUserCall(user.id)) {
      return new Response(
        JSON.stringify({
          error: "Too many weather alert requests. Please try again later.",
          alerts: [],
          count: 0,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate input — bind coords from owned field (ignore client lat/lng invent).
    const body = weatherAlertsSchema.parse(await req.json());
    const { data: ownedField, error: fieldError } = await rateLimitClient
      .from('fields')
      .select('id, location_lat, location_lng')
      .eq('id', body.field_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (fieldError) throw fieldError;
    if (
      !ownedField ||
      ownedField.location_lat == null ||
      ownedField.location_lng == null ||
      !Number.isFinite(Number(ownedField.location_lat)) ||
      !Number.isFinite(Number(ownedField.location_lng))
    ) {
      return new Response(
        JSON.stringify({
          error: 'Owned field with recorded coordinates is required',
          alerts: [],
          count: 0,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const latitude = Number(ownedField.location_lat);
    const longitude = Number(ownedField.location_lng);

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
      
      let type: WeatherAlert["type"] = "high_wind";
      const event = props.event?.toLowerCase() || "";
      
      if (event.includes("frost") || event.includes("freeze")) {
        type = "frost";
      } else if (event.includes("drought")) {
        type = "drought";
      } else if (event.includes("flood") || event.includes("rain")) {
        type = "heavy_rain";
      } else if (event.includes("heat") || event.includes("excessive heat")) {
        type = "heat_wave";
      }

      return {
        type,
        // Fail closed — missing NWS severity is unknown, not an invented advisory.
        severity: props.severity?.toLowerCase() || "unknown",
        title: props.event || "Weather Alert",
        description: props.headline || props.description || "Weather alert in your area",
        start_time: props.onset || new Date().toISOString(),
        end_time: props.ends || null,
        affected_areas: props.areaDesc?.split(";") || []
      };
    });

    // Filter for agriculture-relevant alerts
    const agAlerts = processedAlerts.filter(alert =>
      alert.type === "frost" ||
      alert.type === "drought" ||
      alert.type === "heavy_rain" ||
      alert.type === "heat_wave"
    );

    // Store alerts with service role only after the caller is authenticated + rate-limited
    if (agAlerts.length > 0) {
      const supabase = getServiceClient();
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
