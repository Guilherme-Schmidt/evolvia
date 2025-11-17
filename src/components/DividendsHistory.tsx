import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface DividendData {
  date: string;
  value: number;
  type: string;
}

interface DividendStats {
  totalDividends: number;
  lastYearDividends: number;
  dividendYield: string;
  averagePerYear: string;
}

interface Props {
  investments: Array<{
    ticker: string;
    quantity: number;
  }>;
}

export const DividendsHistory = ({ investments }: Props) => {
  const [selectedTicker, setSelectedTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [dividends, setDividends] = useState<DividendData[]>([]);
  const [stats, setStats] = useState<DividendStats | null>(null);
  const [currentPrice, setCurrentPrice] = useState(0);

  const fetchDividends = async (ticker: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-dividends", {
        body: { ticker },
      });

      if (error) throw error;

      setDividends(data.dividends || []);
      setStats(data.stats || null);
      setCurrentPrice(data.currentPrice || 0);
      
      if (data.dividends?.length === 0) {
        toast.info("Nenhum dividendo encontrado para este ativo");
      }
    } catch (error: any) {
      toast.error("Erro ao buscar dividendos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
    if (ticker) {
      fetchDividends(ticker);
    }
  };

  const uniqueTickers = [...new Set(investments.map((inv) => inv.ticker))];
  const selectedInvestment = investments.find((inv) => inv.ticker === selectedTicker);
  
  // Calcular proventos totais recebidos
  const totalReceived = selectedInvestment
    ? dividends.reduce((sum, div) => sum + (div.value * selectedInvestment.quantity), 0)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Histórico de Dividendos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione um ativo</label>
          <Select value={selectedTicker} onValueChange={handleTickerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um ticker" />
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

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Carregando dados...
          </div>
        )}

        {!loading && stats && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Dividend Yield
              </div>
              <p className="text-2xl font-bold text-chart-2">
                {stats.dividendYield}%
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Média Anual
              </div>
              <p className="text-2xl font-bold">
                R$ {parseFloat(stats.averagePerYear).toFixed(2)}
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-1">
              <div className="text-sm text-muted-foreground">
                Últimos 12 meses
              </div>
              <p className="text-2xl font-bold text-success">
                R$ {stats.lastYearDividends.toFixed(2)}
              </p>
            </div>
            {selectedInvestment && (
              <div className="p-4 border rounded-lg space-y-1">
                <div className="text-sm text-muted-foreground">
                  Total Recebido ({selectedInvestment.quantity} cotas)
                </div>
                <p className="text-2xl font-bold text-chart-1">
                  R$ {totalReceived.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && dividends.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Histórico de Pagamentos</h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {dividends.map((dividend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-success/10">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(dividend.date).toLocaleDateString("pt-BR")}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {dividend.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">
                      R$ {dividend.value.toFixed(2)}
                    </p>
                    {selectedInvestment && (
                      <p className="text-xs text-muted-foreground">
                        Total: R$ {(dividend.value * selectedInvestment.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && selectedTicker && dividends.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum dividendo registrado para {selectedTicker}
          </p>
        )}
      </CardContent>
    </Card>
  );
};