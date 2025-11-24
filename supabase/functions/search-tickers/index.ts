import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { search } = await req.json();
    
    if (!search || search.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Search term must be at least 2 characters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    console.log(`Searching tickers for: ${search}`);

    const brapiToken = Deno.env.get('BRAPI_API_KEY');
    
    if (!brapiToken) {
      console.error('BRAPI_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Buscar lista de tickers disponíveis
    const apiUrl = `https://brapi.dev/api/available?token=${brapiToken}`;
    console.log('Fetching available tickers from Brapi API...');
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch tickers from external API',
          status: response.status,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    const data = await response.json();
    
    // Filtrar tickers que correspondem à busca
    const searchUpper = search.toUpperCase();
    const filtered = data.stocks
      ? data.stocks
          .filter((ticker: string) => ticker.toUpperCase().includes(searchUpper))
          .slice(0, 10) // Limitar a 10 resultados
      : [];

    console.log(`Found ${filtered.length} matching tickers`);

    return new Response(
      JSON.stringify({ tickers: filtered }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error searching tickers:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: message, internalError: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  }
});
