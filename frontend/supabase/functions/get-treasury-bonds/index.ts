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
    console.log('Fetching treasury bonds data...');
    
    // Lista de títulos do Tesouro Direto mais comuns
    // Os preços unitários devem ser preenchidos manualmente pelos usuários
    const bonds = [
      {
        name: "Tesouro Selic 2027",
        maturityDate: "2027-03-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Selic 2029",
        maturityDate: "2029-03-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Selic 2031",
        maturityDate: "2031-03-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro IPCA+ 2029",
        maturityDate: "2029-08-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro IPCA+ 2035",
        maturityDate: "2035-05-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro IPCA+ 2045",
        maturityDate: "2045-05-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro IPCA+ com Juros Semestrais 2032",
        maturityDate: "2032-08-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro IPCA+ com Juros Semestrais 2040",
        maturityDate: "2040-08-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro IPCA+ com Juros Semestrais 2055",
        maturityDate: "2055-05-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Prefixado 2027",
        maturityDate: "2027-01-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Prefixado 2031",
        maturityDate: "2031-01-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Prefixado com Juros Semestrais 2033",
        maturityDate: "2033-01-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro RendA+ 2030",
        maturityDate: "2030-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro RendA+ 2035",
        maturityDate: "2035-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro RendA+ 2040",
        maturityDate: "2040-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Educa+ 2026",
        maturityDate: "2026-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Educa+ 2030",
        maturityDate: "2030-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
      {
        name: "Tesouro Educa+ 2035",
        maturityDate: "2035-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 30,
      },
    ];

    console.log(`Treasury bonds list prepared successfully: ${bonds.length} bonds`);

    return new Response(
      JSON.stringify({ bonds }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Error preparing treasury bonds:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        bonds: [] 
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
