/* eslint-disable @typescript-eslint/no-explicit-any */
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
  { value: "transport", label: "Transporte" },
  { value: "housing", label: "Moradia" },
  { value: "entertainment", label: "Entretenimento" },
  { value: "health", label: "Saúde" },
  { value: "education", label: "Educação" },
  { value: "shopping", label: "Compras" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "meal_voucher", label: "Vale Refeição" },
  { value: "utilities", label: "Contas (Água, Luz, etc)" },
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

interface CreditCard {
  id: string;
  name: string;
}

export const TransactionForm = ({ onSuccess }: TransactionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>("none");
  const [installments, setInstallments] = useState<number>(1);
  const [splitBetweenCards, setSplitBetweenCards] = useState(false);
  const [card1, setCard1] = useState<string>("none");
  const [card1Installments, setCard1Installments] = useState<number>(6);
  const [card2, setCard2] = useState<string>("none");
  const [card2Installments, setCard2Installments] = useState<number>(6);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (type === "expense") {
      fetchCreditCards();
    }
  }, [type]);

  const fetchCreditCards = async () => {
    const { data } = await supabase
      .from("credit_cards")
      .select("id, name")
      .order("name");
    setCreditCards(data || []);
  };

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

      // Validação para divisão entre cartões
      if (splitBetweenCards) {
        if (card1 === "none" || card2 === "none") {
          toast.error("Selecione os dois cartões para dividir as parcelas");
          return;
        }
        if (card1 === card2) {
          toast.error("Selecione cartões diferentes");
          return;
        }
      }

      // Se está dividindo entre cartões
      if (splitBetweenCards && card1 !== "none" && card2 !== "none") {
        const totalInstallments = card1Installments + card2Installments;
        const installmentAmount = parseFloat(amount) / totalInstallments;
        const allTransactions = [];

        // Criar parcelas do cartão 1
        for (let i = 1; i <= card1Installments; i++) {
          const installmentDate = new Date(date);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
          
          allTransactions.push({
            user_id: user.id,
            title: `${title} - Cartão 1 (${i}/${card1Installments})`,
            amount: installmentAmount,
            type,
            category: category as TransactionCategory,
            description: description || null,
            date: installmentDate.toISOString().split("T")[0],
            credit_card_id: card1,
            installments: totalInstallments,
            current_installment: i,
          });
        }

        // Criar parcelas do cartão 2
        for (let i = 1; i <= card2Installments; i++) {
          const installmentDate = new Date(date);
          installmentDate.setMonth(installmentDate.getMonth() + (card1Installments + i - 1));
          
          allTransactions.push({
            user_id: user.id,
            title: `${title} - Cartão 2 (${i}/${card2Installments})`,
            amount: installmentAmount,
            type,
            category: category as TransactionCategory,
            description: description || null,
            date: installmentDate.toISOString().split("T")[0],
            credit_card_id: card2,
            installments: totalInstallments,
            current_installment: card1Installments + i,
          });
        }

        const { error } = await supabase
          .from("transactions")
          .insert(allTransactions);

        if (error) throw error;
      }
      // Se tem cartão selecionado e mais de 1 parcela, cria transações parceladas
      else if (selectedCard && selectedCard !== "none" && installments > 1) {
        // Criar parcelas individuais diretamente
        const installmentAmount = parseFloat(amount) / installments;
        const installmentTransactions = [];
        
        for (let i = 1; i <= installments; i++) {
          const installmentDate = new Date(date);
          installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
          
          installmentTransactions.push({
            user_id: user.id,
            title: `${title} (${i}/${installments})`,
            amount: installmentAmount,
            type,
            category: category as TransactionCategory,
            description: description || null,
            date: installmentDate.toISOString().split("T")[0],
            credit_card_id: selectedCard,
            installments,
            current_installment: i,
          });
        }

        const { error: installmentsError } = await supabase
          .from("transactions")
          .insert(installmentTransactions);

        if (installmentsError) throw installmentsError;
      } else {
        // Transação única
        const { error } = await supabase.from("transactions").insert([{
          user_id: user.id,
          title,
          amount: parseFloat(amount),
          type,
          category: category as TransactionCategory,
          description: description || null,
          date,
          credit_card_id: selectedCard && selectedCard !== "none" ? selectedCard : null,
        }]);

        if (error) throw error;
      }

      toast.success("Transação adicionada com sucesso!");

      // Reset form
      setTitle("");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setSelectedCard("none");
      setInstallments(1);
      setSplitBetweenCards(false);
      setCard1("none");
      setCard1Installments(6);
      setCard2("none");
      setCard2Installments(6);
      
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

          {type === "expense" && (
            <>
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="splitCards"
                    checked={splitBetweenCards}
                    onChange={(e) => {
                      setSplitBetweenCards(e.target.checked);
                      if (!e.target.checked) {
                        setCard1("none");
                        setCard2("none");
                      } else {
                        setSelectedCard("none");
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="splitCards" className="font-medium">
                    Dividir parcelas entre dois cartões
                  </Label>
                </div>

                {!splitBetweenCards ? (
                  <>
                    <div className="space-y-2">
                      <Label>Cartão de Crédito (opcional)</Label>
                      <Select value={selectedCard} onValueChange={setSelectedCard}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cartão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {creditCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCard && selectedCard !== "none" && (
                      <div className="space-y-2">
                        <Label htmlFor="installments">Número de Parcelas</Label>
                        <Select
                          value={installments.toString()}
                          onValueChange={(v) => setInstallments(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x de R$ {(parseFloat(amount || "0") / num).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cartão 1</Label>
                        <Select value={card1} onValueChange={setCard1}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecione</SelectItem>
                            {creditCards.map((card) => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Parcelas no Cartão 1</Label>
                        <Select
                          value={card1Installments.toString()}
                          onValueChange={(v) => setCard1Installments(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cartão 2</Label>
                        <Select value={card2} onValueChange={setCard2}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecione</SelectItem>
                            {creditCards.map((card) => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Parcelas no Cartão 2</Label>
                        <Select
                          value={card2Installments.toString()}
                          onValueChange={(v) => setCard2Installments(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {card1 !== "none" && card2 !== "none" && amount && (
                      <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
                        <p className="font-medium mb-1">Resumo:</p>
                        <p>Total de parcelas: {card1Installments + card2Installments}x</p>
                        <p>Valor por parcela: R$ {(parseFloat(amount) / (card1Installments + card2Installments)).toFixed(2)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
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
