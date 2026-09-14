import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { handleError } from '../_shared/errorHandler.ts';
import { requireAuthenticatedUser } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Market price data structure
interface MarketPrice {
  commodity: string;
  price_per_bushel: number;
  price_per_pound?: number;
  unit: string;
  source: string;
  last_updated: string;
  disclaimer: string;
}

// Placeholder estimates only — not a live USDA/CBOT feed.
const ESTIMATED_MARKET_PRICES: Record<string, MarketPrice> = {
  rice: {
    commodity: 'Rice',
    price_per_bushel: 14.50,
    unit: 'bushel',
    source: 'Estimated placeholder (not live USDA)',
    last_updated: new Date().toISOString(),
    disclaimer: 'Illustrative estimate for closed-beta planning only. Not an official market quote.',
  },
  soybeans: {
    commodity: 'Soybeans',
    price_per_bushel: 12.80,
    unit: 'bushel',
    source: 'Estimated placeholder (not live USDA)',
    last_updated: new Date().toISOString(),
    disclaimer: 'Illustrative estimate for closed-beta planning only. Not an official market quote.',
  },
  cotton: {
    commodity: 'Cotton',
    price_per_pound: 0.75,
    price_per_bushel: 0,
    unit: 'pound',
    source: 'Estimated placeholder (not live USDA)',
    last_updated: new Date().toISOString(),
    disclaimer: 'Illustrative estimate for closed-beta planning only. Not an official market quote.',
  },
  corn: {
    commodity: 'Corn',
    price_per_bushel: 5.20,
    unit: 'bushel',
    source: 'Estimated placeholder (not live USDA)',
    last_updated: new Date().toISOString(),
    disclaimer: 'Illustrative estimate for closed-beta planning only. Not an official market quote.',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) {
      return auth;
    }

    const url = new URL(req.url);
    const cropType = url.searchParams.get('crop_type')?.toLowerCase();

    if (!cropType) {
      return new Response(
        JSON.stringify({ error: 'crop_type parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cropToCommodity: Record<string, string> = {
      rice: 'rice',
      soybean: 'soybeans',
      soybeans: 'soybeans',
      cotton: 'cotton',
      corn: 'corn',
    };

    const commodity = cropToCommodity[cropType] || cropType;
    const price = ESTIMATED_MARKET_PRICES[commodity];

    if (!price) {
      return new Response(
        JSON.stringify({
          error: `No market price estimate available for ${cropType}`,
          available_crops: Object.keys(ESTIMATED_MARKET_PRICES),
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(price),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleError(error, 'get-market-prices', corsHeaders);
  }
});
