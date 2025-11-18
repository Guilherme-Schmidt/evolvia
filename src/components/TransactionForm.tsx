import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

type TransactionCategory = Database["public"]["Enums"]["transaction_category"];
type TransactionType = Database["public"]["Enums"]["transaction_type"];

const INCOME_CATEGORIES = [
  { value: "salary", label: "Salário" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investimento" },
  { value: "other_income", label: "Outros" },
];

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
  { value: "meal_voucher", label: "Vale Refeição" },
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
  { value: "other_expense", label: "Outros" },
];

interface TransactionFormProps {
  onSuccess?: () => void;
}

export const TransactionForm = ({ onSuccess }: TransactionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [creditCardId, setCreditCardId] = useState<string>("");
  const [creditCards, setCreditCards] = useState<Array<{ id: string; name: string }>>([]);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    const fetchCreditCards = async () => {
      const { data } = await supabase.from('credit_cards').select('id, name').order('name');
      if (data) setCreditCards(data);
    };
    fetchCreditCards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      if (!category) {
        toast.error("Selecione uma categoria");
        return;
      }

      const { error } = await supabase.from("transactions").insert([{
        user_id: user.id,
        title,
        amount: parseFloat(amount),
        type,
        category: category as TransactionCategory,
        description: description || null,
        date,
        credit_card_id: creditCardId || null,
      }]);

      if (error) throw error;

      toast.success("Transação adicionada com sucesso!");
      
      // Reset form
      setTitle("");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setCreditCardId("");
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nova Transação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v: TransactionType) => {
                setType(v);
                setCategory("");
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Salário, Almoço, etc"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as TransactionCategory)} 
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "expense" && creditCards.length > 0 && (
            <div className="space-y-2">
              <Label>Cartão de Crédito (opcional)</Label>
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Adicionar Transação"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
