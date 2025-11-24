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
    console.log('Fetching treasury bonds data from official API...');
    
    // Busca dados reais da API oficial do Tesouro Transparente
    const apiUrl = 'https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv';
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error('Error fetching from Tesouro API:', response.status);
      throw new Error('Failed to fetch treasury data');
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Parse CSV (formato: Data Base;Tipo Titulo;Vencimento do Titulo;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha)
    const bonds: any[] = [];
    const bondMap = new Map();
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const parts = line.split(';');
      if (parts.length < 8) continue;
      
      const date = parts[0];
      const bondType = parts[1].trim();
      const maturity = parts[2].trim();
      const buyRate = parseFloat(parts[3]?.replace(',', '.') || '0');
      const sellRate = parseFloat(parts[4]?.replace(',', '.') || '0');
      const buyPrice = parseFloat(parts[5]?.replace(',', '.') || '0');
      const sellPrice = parseFloat(parts[6]?.replace(',', '.') || '0');
      
      // Only get the most recent data for each bond
      const bondKey = `${bondType}_${maturity}`;
      if (!bondMap.has(bondKey) || date > bondMap.get(bondKey).date) {
        bondMap.set(bondKey, {
          date,
          name: bondType,
          maturityDate: maturity,
          buyPrice,
          sellPrice,
          buyRate,
          sellRate,
          minInvestment: 30, // Valor mínimo padrão do Tesouro Direto
        });
      }
    }
    
    // Convert map to array and sort by name
    bonds.push(...Array.from(bondMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    
    // Se não conseguiu buscar dados da API, retorna lista estática como fallback
    if (bonds.length === 0) {
      console.log('No data from API, using fallback list');
      bonds.push(
      {
        name: "Tesouro Selic 2027",
        maturityDate: "2027-03-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Selic 2029",
        maturityDate: "2029-03-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Selic 2031",
        maturityDate: "2031-03-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro IPCA+ 2029",
        maturityDate: "2029-08-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro IPCA+ 2035",
        maturityDate: "2035-05-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro IPCA+ 2045",
        maturityDate: "2045-05-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro IPCA+ com Juros Semestrais 2032",
        maturityDate: "2032-08-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro IPCA+ com Juros Semestrais 2040",
        maturityDate: "2040-08-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro IPCA+ com Juros Semestrais 2055",
        maturityDate: "2055-05-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Prefixado 2027",
        maturityDate: "2027-01-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Prefixado 2031",
        maturityDate: "2031-01-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Prefixado com Juros Semestrais 2033",
        maturityDate: "2033-01-01",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro RendA+ 2030",
        maturityDate: "2030-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro RendA+ 2035",
        maturityDate: "2035-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro RendA+ 2040",
        maturityDate: "2040-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Educa+ 2026",
        maturityDate: "2026-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Educa+ 2030",
        maturityDate: "2030-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      {
        name: "Tesouro Educa+ 2035",
        maturityDate: "2035-12-15",
        buyPrice: 0,
        sellPrice: 0,
        buyRate: 0,
        sellRate: 0,
        minInvestment: 0,
      },
      );
    }

    console.log(`Treasury bonds data prepared successfully: ${bonds.length} bonds`);

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
