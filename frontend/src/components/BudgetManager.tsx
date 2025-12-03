import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Target, Plus, Trash2, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type TransactionCategory = Database["public"]["Enums"]["transaction_category"];

interface Budget {
  id: string;
  category: TransactionCategory;
  amount: number;
  month: number;
  year: number;
}

interface BudgetWithSpent extends Budget {
  spent: number;
  percentage: number;
}

const EXPENSE_CATEGORIES = [
  { value: "food", label: "Alimentação" },
  { value: "groceries", label: "Supermercado" },
  { value: "transport", label: "Transporte" },
  { value: "fuel", label: "Combustível" },
  { value: "housing", label: "Moradia" },
  { value: "entertainment", label: "Entretenimento" },
  { value: "leisure", label: "Lazer" },
  { value: "health", label: "Saúde" },
  { value: "education", label: "Educação" },
  { value: "school", label: "Escola/Material Escolar" },
  { value: "shopping", label: "Compras" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "utilities", label: "Contas (Água, Luz, etc)" },
  { value: "internet", label: "Internet" },
  { value: "phone", label: "Telefone" },
  { value: "insurance", label: "Seguros" },
  { value: "subscription", label: "Assinaturas" },
  { value: "personal_care", label: "Cuidados Pessoais" },
  { value: "gifts", label: "Presentes" },
  { value: "travel", label: "Viagens" },
  { value: "clothing", label: "Roupas" },
  { value: "home_maintenance", label: "Manutenção Casa" },
];

export const BudgetManager = () => {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<TransactionCategory | "">("");
  const [amount, setAmount] = useState("");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar orçamentos do mês atual
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .eq("year", currentYear);

      if (budgetsError) throw budgetsError;

      // Buscar transações do mês atual
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      if (transactionsError) throw transactionsError;

      // Calcular gastos por categoria
      const spentByCategory = transactionsData.reduce((acc, transaction) => {
        const cat = transaction.category as string;
        acc[cat] = (acc[cat] || 0) + Number(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

      // Combinar orçamentos com gastos
      const budgetsWithSpent = (budgetsData || []).map(budget => ({
        ...budget,
        spent: spentByCategory[budget.category] || 0,
        percentage: Math.round(((spentByCategory[budget.category] || 0) / Number(budget.amount)) * 100),
      }));

      setBudgets(budgetsWithSpent);
    } catch (error: any) {
      toast.error("Erro ao carregar orçamentos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !amount) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { error } = await supabase.from("budgets").insert([{
        user_id: user.id,
        category: category as TransactionCategory,
        amount: parseFloat(amount),
        month: currentMonth,
        year: currentYear,
      }]);

      if (error) throw error;

      toast.success("Orçamento adicionado com sucesso!");
      setCategory("");
      setAmount("");
      setDialogOpen(false);
      fetchBudgets();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Já existe um orçamento para esta categoria neste mês");
      } else {
        toast.error("Erro ao adicionar orçamento");
      }
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Orçamento removido");
      fetchBudgets();
    } catch (error) {
      toast.error("Erro ao remover orçamento");
    }
  };

  const getCategoryLabel = (categoryValue: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === categoryValue);
    return cat?.label || categoryValue;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-primary";
  };

  if (loading) {
    return <div>Carregando orçamentos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Orçamento Mensal
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Orçamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBudget} className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as TransactionCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor Planejado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button type="submit" className="w-full">Adicionar Orçamento</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum orçamento definido para este mês</p>
            <p className="text-sm">Adicione orçamentos para acompanhar seus gastos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{getCategoryLabel(budget.category)}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {budget.spent.toFixed(2)} de R$ {budget.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${budget.percentage >= 100 ? 'text-destructive' : budget.percentage >= 80 ? 'text-yellow-600' : 'text-primary'}`}>
                      {budget.percentage}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress 
                  value={Math.min(budget.percentage, 100)} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
