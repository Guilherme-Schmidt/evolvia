import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date().getDate();

    // Buscar cartões que vencem hoje
    const { data: cards, error: cardsError } = await supabase
      .from("credit_cards")
      .select("*, profiles!inner(user_id)")
      .eq("due_day", today);

    if (cardsError) throw cardsError;

    // Para cada cartão, buscar o usuário e enviar email
    for (const card of cards || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", card.user_id)
        .single();

      if (!profile) continue;

      // Buscar email do usuário na tabela auth.users
      const { data: { user } } = await supabase.auth.admin.getUserById(
        profile.user_id
      );

      if (!user?.email) continue;

      // Buscar transações do cartão no mês atual
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("credit_card_id", card.id)
        .eq("type", "expense")
        .gte("date", `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`)
        .lte("date", `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-31`);

      const totalSpent = transactions?.reduce(
        (sum, t) => sum + parseFloat(t.amount.toString()),
        0
      ) || 0;

      // Enviar email via Resend
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY não configurada");
        continue;
      }

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Financeiro <onboarding@resend.dev>",
          to: [user.email],
          subject: `🔔 Vencimento da Fatura - ${card.name}`,
          html: `
            <h1>Lembrete de Vencimento de Fatura</h1>
            <p>Olá!</p>
            <p>A fatura do seu cartão <strong>${card.name}</strong> vence <strong>HOJE</strong>!</p>
            <h2>Resumo da Fatura:</h2>
            <ul>
              <li><strong>Total Gasto:</strong> R$ ${totalSpent.toFixed(2)}</li>
              <li><strong>Limite do Cartão:</strong> R$ ${card.card_limit.toFixed(2)}</li>
              <li><strong>Disponível:</strong> R$ ${(card.card_limit - totalSpent).toFixed(2)}</li>
            </ul>
            <p>Não se esqueça de efetuar o pagamento para evitar juros!</p>
            <p>Atenciosamente,<br>Seu Assistente Financeiro</p>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Erro ao enviar email:", await emailResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, notificationsSent: cards?.length || 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
