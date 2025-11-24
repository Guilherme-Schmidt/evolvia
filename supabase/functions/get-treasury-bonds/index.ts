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
    console.log('Fetching treasury bonds from Tesouro Transparente API...');
    
    // API oficial do Tesouro Nacional
    const response = await fetch(
      'https://www.tesourotransparente.gov.br/ckan/api/3/action/datastore_search?resource_id=796d2059-14e9-44e3-80c9-2d9e30b405c1&limit=100'
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Treasury bonds fetched successfully');

    // Processar e formatar os dados
    const bonds = data.result?.records || [];
    
    // Filtrar apenas títulos disponíveis para compra e ordenar por vencimento
    const availableBonds = bonds
      .filter((bond: any) => bond.PU_Compra_Manha && parseFloat(bond.PU_Compra_Manha) > 0)
      .map((bond: any) => ({
        name: bond.Tipo_Titulo,
        maturityDate: bond.Data_Vencimento,
        buyPrice: parseFloat(bond.PU_Compra_Manha),
        sellPrice: parseFloat(bond.PU_Venda_Manha),
        buyRate: parseFloat(bond.Taxa_Compra_Manha),
        sellRate: parseFloat(bond.Taxa_Venda_Manha),
        minInvestment: parseFloat(bond.Preco_Unitario_Compra) || 0,
      }))
      .sort((a: any, b: any) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime());

    return new Response(
      JSON.stringify({ bonds: availableBonds }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Error fetching treasury bonds:', error);
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
