import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TickerAutocomplete } from "@/components/TickerAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

const investmentTypes = [
  { value: "stock", label: "Ações" },
  { value: "fii", label: "Fundos Imobiliários" },
  { value: "etf", label: "ETFs" },
  { value: "bdr", label: "BDRs" },
  { value: "treasury", label: "Tesouro Direto" },
  { value: "crypto", label: "Criptomoedas" },
  { value: "fixed_income", label: "Renda Fixa" },
  { value: "other", label: "Outros" },
];

interface InvestmentFormProps {
  onSuccess: () => void;
}

export const InvestmentForm = ({ onSuccess }: InvestmentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [formData, setFormData] = useState({
    ticker: "",
    type: "",
    quantity: "",
    average_price: "",
    target_quantity: "",
    purchase_date: new Date().toISOString().split("T")[0],
    notes: "",
    broker: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const ticker = formData.ticker.toUpperCase();
      const quantity = Number(formData.quantity);
      const price = Number(formData.average_price);
      const totalAmount = quantity * price;
      
      // Garantir formato correto da data (YYYY-MM-DD)
      const transactionDate = formData.purchase_date;

      if (transactionType === "buy") {
        // Insert investment
        const { data: investmentData, error: investmentError } = await supabase
          .from("investments")
          .insert([{
            user_id: user.id,
            ticker,
            type: formData.type as any,
            quantity,
            average_price: price,
            target_quantity: formData.target_quantity ? Number(formData.target_quantity) : 0,
            purchase_date: transactionDate,
            notes: formData.notes || null,
            broker: formData.broker || null,
          }])
          .select()
          .single();

        if (investmentError) throw investmentError;

        // Register transaction
        const { error: transactionError } = await supabase
          .from("investment_transactions")
          .insert([{
            user_id: user.id,
            investment_id: investmentData.id,
            type: "buy",
            quantity,
            price,
            total_amount: totalAmount,
            transaction_date: transactionDate,
            notes: formData.notes || null,
          }]);

        if (transactionError) throw transactionError;
        toast.success("Compra registrada com sucesso!");
      } else {
        // Handle sell
        const { data: existingInvestments, error: fetchError } = await supabase
          .from("investments")
          .select("*")
          .eq("user_id", user.id)
          .eq("ticker", ticker)
          .order("purchase_date", { ascending: true });

        if (fetchError) throw fetchError;

        if (!existingInvestments || existingInvestments.length === 0) {
          throw new Error("Você não possui este ativo para vender");
        }

        const totalOwned = existingInvestments.reduce((sum, inv) => sum + Number(inv.quantity), 0);
        
        if (totalOwned < quantity) {
          throw new Error(`Quantidade insuficiente. Você possui ${totalOwned} unidades de ${ticker}`);
        }

        // Register sell transaction using the first investment as reference
        const { error: transactionError } = await supabase
          .from("investment_transactions")
          .insert([{
            user_id: user.id,
            investment_id: existingInvestments[0].id,
            type: "sell",
            quantity,
            price,
            total_amount: totalAmount,
            transaction_date: transactionDate,
            notes: formData.notes || null,
          }]);

        if (transactionError) throw transactionError;

        // Update investment quantities (FIFO - First In First Out)
        let remainingToSell = quantity;
        for (const investment of existingInvestments) {
          if (remainingToSell <= 0) break;

          const currentQty = Number(investment.quantity);
          if (currentQty <= remainingToSell) {
            // Delete this investment entirely
            await supabase
              .from("investments")
              .delete()
              .eq("id", investment.id);
            remainingToSell -= currentQty;
          } else {
            // Reduce quantity
            await supabase
              .from("investments")
              .update({ quantity: currentQty - remainingToSell })
              .eq("id", investment.id);
            remainingToSell = 0;
          }
        }

        toast.success("Venda registrada com sucesso!");
      }

      setFormData({
        ticker: "",
        type: "",
        quantity: "",
        average_price: "",
        target_quantity: "",
        purchase_date: new Date().toISOString().split("T")[0],
        notes: "",
        broker: "",
      });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {transactionType === "buy" ? "Comprar Ativo" : "Vender Ativo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Operação</Label>
            <Select
              value={transactionType}
              onValueChange={(value: "buy" | "sell") => setTransactionType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Compra</SelectItem>
                <SelectItem value="sell">Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker/Código</Label>
              <TickerAutocomplete
                id="ticker"
                value={formData.ticker}
                onChange={(value) => setFormData({ ...formData, ticker: value })}
                placeholder="Ex: PETR4, MXRF11"
                investmentType={transactionType === "buy" ? formData.type : undefined}
              />
            </div>

            {transactionType === "buy" && (
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="Ex: 100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="average_price">{transactionType === "buy" ? "Preço de Compra (R$)" : "Preço de Venda (R$)"}</Label>
              <Input
                id="average_price"
                type="number"
                step="0.01"
                value={formData.average_price}
                onChange={(e) =>
                  setFormData({ ...formData, average_price: e.target.value })
                }
                placeholder="Ex: 25.50"
                required
              />
            </div>

            {transactionType === "buy" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="target_quantity">Meta de Quantidade</Label>
                  <Input
                    id="target_quantity"
                    type="number"
                    step="0.01"
                    value={formData.target_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, target_quantity: e.target.value })
                    }
                    placeholder="Ex: 200 (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broker">Corretora</Label>
                  <Input
                    id="broker"
                    value={formData.broker}
                    onChange={(e) =>
                      setFormData({ ...formData, broker: e.target.value })
                    }
                    placeholder="Ex: Clear, XP, Rico"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="purchase_date">{transactionType === "buy" ? "Data de Compra" : "Data de Venda"}</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notas sobre o investimento..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading 
              ? (transactionType === "buy" ? "Registrando compra..." : "Registrando venda...") 
              : (transactionType === "buy" ? "Registrar Compra" : "Registrar Venda")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};