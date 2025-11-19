import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker } = await req.json();

    if (!ticker) {
      return new Response(
        JSON.stringify({ error: "Ticker é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados de dividendos da Brapi
    const response = await fetch(
      `https://brapi.dev/api/quote/${ticker}?range=2y&interval=1d&dividends=true&token=demo`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrair dados de dividendos
    const stockData = data.results?.[0];
    if (!stockData) {
      return new Response(
        JSON.stringify({ error: "Ativo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processar histórico de dividendos
    const dividends = stockData.dividendsData?.cashDividends || [];
    
    // Calcular estatísticas
    const totalDividends = dividends.reduce((sum: number, div: any) => 
      sum + (div.rate || 0), 0
    );
    
    const lastYearDividends = dividends
      .filter((div: any) => {
        const divDate = new Date(div.paymentDate);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return divDate >= oneYearAgo;
      })
      .reduce((sum: number, div: any) => sum + (div.rate || 0), 0);

    // Calcular yield médio (se tiver preço atual)
    const currentPrice = stockData.regularMarketPrice || 0;
    const dividendYield = currentPrice > 0 
      ? (lastYearDividends / currentPrice) * 100 
      : 0;

    return new Response(
      JSON.stringify({
        ticker: stockData.symbol,
        currentPrice,
        dividends: dividends.map((div: any) => ({
          date: div.paymentDate,
          value: div.rate,
          type: div.type || "Dividendo"
        })),
        stats: {
          totalDividends,
          lastYearDividends,
          dividendYield: dividendYield.toFixed(2),
          averagePerYear: (totalDividends / 2).toFixed(2) // Últimos 2 anos
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});