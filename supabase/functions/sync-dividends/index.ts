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
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { ticker } = await req.json();
    
    if (!ticker) {
      throw new Error('Ticker is required');
    }

    console.log('Syncing dividends for:', ticker, 'user:', user.id);
    
    const BRAPI_API_KEY = Deno.env.get('BRAPI_API_KEY');
    if (!BRAPI_API_KEY) {
      throw new Error('BRAPI_API_KEY not configured');
    }

    // Buscar investimento do usuário
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select('id')
      .eq('ticker', ticker)
      .eq('user_id', user.id)
      .limit(1);

    if (invError || !investments || investments.length === 0) {
      throw new Error('Investment not found for this ticker');
    }

    const investmentId = investments[0].id;

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
        JSON.stringify({ synced: 0, message: 'No dividend data found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.results[0];
    const dividends = result.dividendsData?.cashDividends || [];
    
    // Buscar dividendos já registrados
    const { data: existingDividends } = await supabase
      .from('dividends_received')
      .select('payment_date')
      .eq('ticker', ticker)
      .eq('user_id', user.id);

    const existingDates = new Set(
      existingDividends?.map(d => d.payment_date) || []
    );

    // Inserir apenas dividendos novos
    let syncedCount = 0;
    for (const div of dividends) {
      if (!existingDates.has(div.paymentDate) && div.rate && div.rate > 0) {
        const { error: insertError } = await supabase
          .from('dividends_received')
          .insert({
            user_id: user.id,
            investment_id: investmentId,
            ticker: ticker,
            amount: div.rate,
            payment_date: div.paymentDate,
            type: div.label?.includes('JCP') ? 'JCP' : 'Dividendo',
          });

        if (!insertError) {
          syncedCount++;
        } else {
          console.error('Error inserting dividend:', insertError);
        }
      }
    }

    console.log(`Synced ${syncedCount} new dividends for ${ticker}`);

    return new Response(
      JSON.stringify({ 
        synced: syncedCount,
        total: dividends.length,
        message: `${syncedCount} novos dividendos sincronizados`
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Error syncing dividends:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        synced: 0 
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
