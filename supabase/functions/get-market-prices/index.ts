import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { handleAuthError, handleError } from '../_shared/errorHandler.ts';

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
}

// Mock market prices (in production, integrate with USDA/CBOT API)
const MOCK_MARKET_PRICES: Record<string, MarketPrice> = {
  rice: {
    commodity: 'Rice',
    price_per_bushel: 14.50,
    unit: 'bushel',
    source: 'USDA',
    last_updated: new Date().toISOString(),
  },
  soybeans: {
    commodity: 'Soybeans',
    price_per_bushel: 12.80,
    unit: 'bushel',
    source: 'USDA',
    last_updated: new Date().toISOString(),
  },
  cotton: {
    commodity: 'Cotton',
    price_per_pound: 0.75,
    price_per_bushel: 0, // Not applicable
    unit: 'pound',
    source: 'USDA',
    last_updated: new Date().toISOString(),
  },
  corn: {
    commodity: 'Corn',
    price_per_bushel: 5.20,
    unit: 'bushel',
    source: 'USDA',
    last_updated: new Date().toISOString(),
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return handleAuthError(corsHeaders);
    }

    const url = new URL(req.url);
    const cropType = url.searchParams.get('crop_type')?.toLowerCase();

    if (!cropType) {
      return new Response(
        JSON.stringify({ error: 'crop_type parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map crop types to commodities
    const cropToCommodity: Record<string, string> = {
      rice: 'rice',
      soybean: 'soybeans',
      soybeans: 'soybeans',
      cotton: 'cotton',
      corn: 'corn',
    };

    const commodity = cropToCommodity[cropType] || cropType;
    const price = MOCK_MARKET_PRICES[commodity];

    if (!price) {
      return new Response(
        JSON.stringify({ 
          error: `No market price data available for ${cropType}`,
          available_crops: Object.keys(MOCK_MARKET_PRICES),
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

