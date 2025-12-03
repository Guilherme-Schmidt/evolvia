import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de tipos para sufixos da B3
const TYPE_SUFFIXES: Record<string, string[]> = {
  'stock': ['3', '4', '5', '6', '7', '8', '11'], // Ações
  'fii': ['11'], // FIIs
  'etf': ['11'], // ETFs
  'bdr': ['34', '35'], // BDRs
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { search, type } = await req.json();
    
    if (!search || search.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Search term must be at least 2 characters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    // Validação de segurança - limitar tamanho do input
    if (search.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Search term too long' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    const brapiToken = Deno.env.get('BRAPI_API_KEY');
    
    if (!brapiToken) {
      console.error('BRAPI_API_KEY not configured');
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
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status);
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
    const searchUpper = search.toUpperCase().trim();
    let filtered = data.stocks || [];

    // Filtrar por tipo se especificado
    if (type && TYPE_SUFFIXES[type]) {
      const suffixes = TYPE_SUFFIXES[type];
      filtered = filtered.filter((ticker: string) => {
        // Para FIIs e ETFs, verificar se termina com 11
        if (type === 'fii') {
          return ticker.endsWith('11') && 
                 !ticker.includes('BTC') && // Excluir criptos
                 ticker.toUpperCase().includes(searchUpper);
        }
        
        if (type === 'etf') {
          // ETFs geralmente têm "11" no final e padrões específicos
          const etfPatterns = ['BOVA11', 'SMAL11', 'IVVB11', 'HASH11', 'SPXI11', 'B5P211'];
          return ticker.endsWith('11') && 
                 (etfPatterns.some(p => ticker.includes(p.replace('11', ''))) || 
                  ticker.includes('ETF')) &&
                 ticker.toUpperCase().includes(searchUpper);
        }
        
        if (type === 'bdr') {
          return suffixes.some(suffix => ticker.endsWith(suffix)) &&
                 ticker.toUpperCase().includes(searchUpper);
        }
        
        // Para ações, verificar sufixos comuns
        if (type === 'stock') {
          return suffixes.some(suffix => ticker.endsWith(suffix)) &&
                 !ticker.endsWith('11') && // Excluir FIIs
                 ticker.toUpperCase().includes(searchUpper);
        }
        
        return ticker.toUpperCase().includes(searchUpper);
      });
    } else {
      // Se não especificou tipo, buscar em todos
      filtered = filtered.filter((ticker: string) => 
        ticker.toUpperCase().includes(searchUpper)
      );
    }

    // Limitar a 10 resultados
    filtered = filtered.slice(0, 10);

    return new Response(
      JSON.stringify({ tickers: filtered }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error searching tickers:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', internalError: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  }
});
