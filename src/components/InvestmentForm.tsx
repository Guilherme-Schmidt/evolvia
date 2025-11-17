import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [formData, setFormData] = useState({
    ticker: "",
    type: "",
    quantity: "",
    average_price: "",
    purchase_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("investments").insert([{
        user_id: user.id,
        ticker: formData.ticker.toUpperCase(),
        type: formData.type as any,
        quantity: Number(formData.quantity),
        average_price: Number(formData.average_price),
        purchase_date: formData.purchase_date,
        notes: formData.notes || null,
      }]);

      if (error) throw error;

      toast.success("Investimento adicionado com sucesso!");
      setFormData({
        ticker: "",
        type: "",
        quantity: "",
        average_price: "",
        purchase_date: new Date().toISOString().split("T")[0],
        notes: "",
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
          Adicionar Investimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker/Código</Label>
              <Input
                id="ticker"
                value={formData.ticker}
                onChange={(e) =>
                  setFormData({ ...formData, ticker: e.target.value.toUpperCase() })
                }
                placeholder="Ex: PETR4, MXRF11"
                required
              />
            </div>

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
              <Label htmlFor="average_price">Preço Médio (R$)</Label>
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

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Data de Compra</Label>
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
            {loading ? "Adicionando..." : "Adicionar Investimento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};