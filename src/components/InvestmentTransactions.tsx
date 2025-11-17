import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Transaction {
  id: string;
  investment_id: string;
  type: string;
  quantity: number;
  price: number;
  total_amount: number;
  transaction_date: string;
  notes?: string;
  investments: {
    ticker: string;
  };
}

export const InvestmentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("investment_transactions")
        .select(`
          *,
          investments (
            ticker
          )
        `)
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Lançamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum lançamento registrado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {transaction.type === "buy" ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {transaction.investments.ticker}
                      </span>
                      <Badge variant={transaction.type === "buy" ? "default" : "destructive"}>
                        {transaction.type === "buy" ? "Compra" : "Venda"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.quantity} x R$ {transaction.price.toFixed(2)}
                    </div>
                    {transaction.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        {transaction.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    R$ {transaction.total_amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
