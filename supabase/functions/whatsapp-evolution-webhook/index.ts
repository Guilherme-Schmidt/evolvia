import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get userId from custom header (configured in Evolution API instance)
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      console.error('Missing x-user-id header');
      throw new Error('User ID is required. Configure x-user-id header in Evolution API instance.');
    }

    const body = await req.json();
    console.log('Received webhook:', JSON.stringify(body, null, 2));

    // Extract message from Evolution API webhook format
    let message = '';
    
    if (body.event === 'messages.upsert') {
      const data = body.data;
      
      // Skip messages sent by the bot itself
      if (data.key?.fromMe) {
        console.log('Ignoring message from self');
        return new Response(
          JSON.stringify({ success: true, message: 'Ignored self message' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Extract message text from different message types
      if (data.message?.conversation) {
        message = data.message.conversation;
      } else if (data.message?.extendedTextMessage?.text) {
        message = data.message.extendedTextMessage.text;
      } else if (data.message?.imageMessage?.caption) {
        message = data.message.imageMessage.caption;
      } else if (data.message?.videoMessage?.caption) {
        message = data.message.videoMessage.caption;
      } else {
        console.log('Unsupported message type or empty message');
        return new Response(
          JSON.stringify({ success: true, message: 'Unsupported message type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    } else {
      console.log('Ignoring non-message event:', body.event);
      return new Response(
        JSON.stringify({ success: true, message: 'Ignored non-message event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!message.trim()) {
      console.log('Empty message received');
      return new Response(
        JSON.stringify({ success: true, message: 'Empty message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Processing message:', message, 'for user:', userId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use Lovable AI to extract transaction data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente que extrai informações de transações financeiras de mensagens em linguagem natural.
Extraia os seguintes dados:
- amount (número, sem R$ ou símbolos)
- type ("income" ou "expense")
- category (uma das: "salary", "freelance", "investment_income", "other_income", "food", "transport", "health", "entertainment", "bills", "shopping", "education", "other_expense")
- date (formato YYYY-MM-DD, se não especificado use a data de hoje)
- description (opcional, texto livre)
- installments (número de parcelas, se mencionado, senão null)
- credit_card_name (nome do cartão se mencionado, senão null)

Responda APENAS com um JSON válido, sem markdown ou explicações.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_transaction",
              description: "Extract transaction details from text",
              parameters: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  type: { type: "string", enum: ["income", "expense"] },
                  category: { 
                    type: "string", 
                    enum: ["salary", "freelance", "investment_income", "other_income", "food", "transport", "health", "entertainment", "bills", "shopping", "education", "other_expense"]
                  },
                  date: { type: "string" },
                  description: { type: "string" },
                  installments: { type: "number" },
                  credit_card_name: { type: "string" }
                },
                required: ["amount", "type", "category", "date"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_transaction" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('AI did not return structured data');
    }

    const transactionData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted transaction:', transactionData);

    // Find credit card if mentioned
    let creditCardId = null;
    if (transactionData.credit_card_name && transactionData.type === 'expense') {
      const { data: cards } = await supabase
        .from('credit_cards')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', `%${transactionData.credit_card_name}%`)
        .limit(1);
      
      if (cards && cards.length > 0) {
        creditCardId = cards[0].id;
      }
    }

    // Create transaction(s)
    const installments = transactionData.installments || 1;
    const transactions = [];

    if (installments === 1) {
      transactions.push({
        user_id: userId,
        type: transactionData.type,
        title: transactionData.description || 'Transação via WhatsApp',
        amount: transactionData.amount,
        category: transactionData.category,
        date: transactionData.date,
        description: transactionData.description,
        credit_card_id: creditCardId,
        installments: 1,
        current_installment: 1
      });
    } else {
      const installmentAmount = transactionData.amount / installments;
      const baseDate = new Date(transactionData.date);

      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(baseDate.getMonth() + i);

        transactions.push({
          user_id: userId,
          type: transactionData.type,
          title: `${transactionData.description || 'Transação via WhatsApp'} (${i + 1}/${installments})`,
          amount: installmentAmount,
          category: transactionData.category,
          date: installmentDate.toISOString().split('T')[0],
          description: transactionData.description,
          credit_card_id: creditCardId,
          installments: installments,
          current_installment: i + 1
        });
      }
    }

    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(transactions)
      .select();

    if (insertError) {
      console.error('Database error:', insertError);
      throw insertError;
    }

    console.log('Transactions created:', insertedTransactions);

    // Generate confirmation message for WhatsApp
    const confirmationMessage = installments === 1
      ? `✅ *Transação registrada!*\n\n💰 Valor: R$ ${transactionData.amount.toFixed(2)}\n📁 Categoria: ${transactionData.category}\n📅 Data: ${new Date(transactionData.date).toLocaleDateString('pt-BR')}${creditCardId ? `\n💳 Cartão: ${transactionData.credit_card_name}` : ''}`
      : `✅ *Transação parcelada registrada!*\n\n💰 Total: R$ ${transactionData.amount.toFixed(2)}\n📊 Parcelas: ${installments}x de R$ ${(transactionData.amount / installments).toFixed(2)}\n📁 Categoria: ${transactionData.category}${creditCardId ? `\n💳 Cartão: ${transactionData.credit_card_name}` : ''}`;

    // Send confirmation back to WhatsApp via Evolution API
    const remoteJid = body.data?.key?.remoteJid;
    const instanceName = body.instance;
    
    if (remoteJid && instanceName) {
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
      const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
      
      if (evolutionApiUrl && evolutionApiKey) {
        try {
          await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: remoteJid,
              text: confirmationMessage
            })
          });
          console.log('Confirmation sent to WhatsApp');
        } catch (sendError) {
          console.error('Error sending confirmation to WhatsApp:', sendError);
          // Don't throw - transaction was already saved
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: confirmationMessage,
        transactions: insertedTransactions,
        extracted: transactionData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Erro ao processar a transação. Tente novamente ou use um formato mais claro.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});