import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  salary: "Salário",
  freelance: "Freelance",
  investment: "Investimento",
  other_income: "Outros",
  food: "Alimentação",
  transport: "Transporte",
  housing: "Moradia",
  entertainment: "Entretenimento",
  health: "Saúde",
  education: "Educação",
  shopping: "Compras",
  other_expense: "Outros",
};

export const TransactionList = ({ transactions, onDelete }: TransactionListProps) => {
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      
      if (error) throw error;
      
      toast.success("Transação removida com sucesso!");
      onDelete?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover transação");
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhuma transação registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-full ${
                  transaction.type === "income" ? "bg-success/10" : "bg-destructive/10"
                }`}>
                  {transaction.type === "income" ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{transaction.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[transaction.category]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-bold ${
                  transaction.type === "income" ? "text-success" : "text-destructive"
                }`}>
                  {transaction.type === "income" ? "+" : "-"} R$ {transaction.amount.toFixed(2)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(transaction.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
