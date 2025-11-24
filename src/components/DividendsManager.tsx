import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Investment {
  ticker: string;
  quantity: number;
}

interface Dividend {
  id: string;
  ticker: string;
  amount: number;
  payment_date: string;
  type: string;
}

interface Props {
  investments: Investment[];
}

export const DividendsManager = ({ investments }: Props) => {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ticker: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    type: "Dividendo",
  });

  const uniqueTickers = Array.from(new Set(investments.map(inv => inv.ticker)));

  const fetchDividends = async () => {
    try {
      const { data, error } = await supabase
        .from("dividends_received")
        .select("*")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setDividends(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dividendos");
    }
  };

  useEffect(() => {
    fetchDividends();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar o investment_id do ticker selecionado
      const { data: investment } = await supabase
        .from("investments")
        .select("id")
        .eq("user_id", user.id)
        .eq("ticker", formData.ticker)
        .single();

      if (!investment) throw new Error("Investimento não encontrado");

      const { error } = await supabase
        .from("dividends_received")
        .insert([{
          user_id: user.id,
          investment_id: investment.id,
          ticker: formData.ticker,
          amount: Number(formData.amount),
          payment_date: formData.payment_date,
          type: formData.type,
        }]);

      if (error) throw error;

      toast.success("Dividendo registrado com sucesso!");
      setFormData({
        ticker: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        type: "Dividendo",
      });
      fetchDividends();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("dividends_received")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Dividendo removido com sucesso!");
      fetchDividends();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalDividends = dividends.reduce((sum, div) => sum + Number(div.amount), 0);
  const last12Months = dividends.filter(div => {
    const date = new Date(div.payment_date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date >= oneYearAgo;
  });
  const total12Months = last12Months.reduce((sum, div) => sum + Number(div.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Gerenciar Dividendos Recebidos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Registre os dividendos e proventos que você recebeu
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ativo</Label>
              <Select
                value={formData.ticker}
                onValueChange={(value) => setFormData({ ...formData, ticker: value })}
                required
              >
                <SelectTrigger id="ticker">
                  <SelectValue placeholder="Selecione o ativo" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTickers.map((ticker) => (
                    <SelectItem key={ticker} value={ticker}>
                      {ticker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dividendo">Dividendo</SelectItem>
                  <SelectItem value="JCP">Juros sobre Capital Próprio</SelectItem>
                  <SelectItem value="Rendimento">Rendimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor Recebido (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Ex: 125.50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Data do Pagamento</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Registrando..." : "Registrar Dividendo"}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Recebido (12M)</div>
                <div className="text-2xl font-bold text-green-500">
                  R$ {total12Months.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Geral</div>
                <div className="text-2xl font-bold text-primary">
                  R$ {totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Histórico de Recebimentos</h3>
            {dividends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dividendo registrado
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dividends.map((dividend) => (
                  <div
                    key={dividend.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dividend.ticker}</span>
                        <span className="text-xs text-muted-foreground">
                          {dividend.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(dividend.payment_date), "dd/MM/yyyy")}</span>
                        <span className="font-bold text-green-500">
                          R$ {Number(dividend.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dividend.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
