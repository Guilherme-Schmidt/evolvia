import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker } = await req.json();
    
    if (!ticker) {
      throw new Error('Ticker is required');
    }

    console.log('Fetching historical dividends for:', ticker);
    
    const BRAPI_API_KEY = Deno.env.get('BRAPI_API_KEY');
    if (!BRAPI_API_KEY) {
      throw new Error('BRAPI_API_KEY not configured');
    }

    // Buscar histórico de dividendos da brapi
    const response = await fetch(
      `https://brapi.dev/api/quote/${ticker}?dividends=true`,
      {
        headers: {
          'Authorization': `Bearer ${BRAPI_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dividends: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('No data found for ticker:', ticker);
      return new Response(
        JSON.stringify({ dividends: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.results[0];
    const dividends = result.dividendsData?.cashDividends || [];
    
    // Formatar dividendos para retorno
    const formattedDividends = dividends.map((div: any) => ({
      paymentDate: div.paymentDate,
      rate: div.rate,
      relatedTo: div.relatedTo,
      approvedOn: div.approvedOn,
      isinCode: div.isinCode,
      label: div.label,
      lastDatePrior: div.lastDatePrior,
      remarks: div.remarks,
    }));

    console.log(`Found ${formattedDividends.length} dividends for ${ticker}`);

    return new Response(
      JSON.stringify({ 
        ticker,
        dividends: formattedDividends 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Error fetching historical dividends:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        dividends: [] 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
