import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Investment {
  id: string;
  ticker: string;
  type: string;
  quantity: number;
  average_price: number;
  purchase_date: string;
  notes?: string;
}

interface Quote {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

const typeLabels: { [key: string]: string } = {
  stock: "Ações",
  fii: "FII",
  etf: "ETF",
  bdr: "BDR",
  treasury: "Tesouro",
  crypto: "Crypto",
  fixed_income: "Renda Fixa",
  other: "Outros",
};

interface InvestmentTableProps {
  investments: Investment[];
  onDelete: () => void;
}

export const InvestmentTable = ({ investments, onDelete }: InvestmentTableProps) => {
  const [quotes, setQuotes] = useState<{ [key: string]: Quote }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Agrupar investimentos pelo ticker
  const groupedInvestments = investments.reduce((acc, inv) => {
    const existing = acc.find(item => item.ticker === inv.ticker);
    if (existing) {
      const totalQuantity = existing.quantity + inv.quantity;
      const totalInvested = (existing.quantity * existing.average_price) + (inv.quantity * inv.average_price);
      existing.average_price = totalInvested / totalQuantity;
      existing.quantity = totalQuantity;
    } else {
      acc.push({ ...inv });
    }
    return acc;
  }, [] as Investment[]);

  useEffect(() => {
    // Buscar cotações para todos os investimentos
    groupedInvestments.forEach((inv) => {
      if (!quotes[inv.ticker]) {
        fetchQuote(inv.ticker);
      }
    });
  }, [investments]);

  const fetchQuote = async (ticker: string) => {
    setLoading((prev) => ({ ...prev, [ticker]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("get-quote", {
        body: { ticker },
      });

      if (error) throw error;

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setQuotes((prev) => ({
          ...prev,
          [ticker]: {
            regularMarketPrice: result.regularMarketPrice,
            regularMarketChange: result.regularMarketChange,
            regularMarketChangePercent: result.regularMarketChangePercent,
          },
        }));
      }
    } catch (error: any) {
      console.error("Error fetching quote:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [ticker]: false }));
    }
  };

  const handleDelete = async (ticker: string) => {
    try {
      // Deletar todos os investimentos com o mesmo ticker
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("ticker", ticker);

      if (error) throw error;

      toast.success("Investimento removido!");
      onDelete();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateMetrics = (investment: Investment, currentPrice?: number) => {
    if (!currentPrice) return null;
    
    const invested = investment.quantity * investment.average_price;
    const current = investment.quantity * currentPrice;
    const profit = current - invested;
    const profitPercent = (profit / invested) * 100;
    
    // Calcular P/L (Lucro/Prejuízo)
    const pl = current - invested;
    
    // PVP - Preço sobre Valor Patrimonial (simplificado)
    const pvp = currentPrice / investment.average_price;
    
    // DY - Dividend Yield (simulado - seria necessário dados reais)
    const dy = 0; // Precisaria de API real para dividendos
    
    return {
      invested,
      current,
      profit,
      profitPercent,
      pl,
      pvp,
      dy,
    };
  };

  const getTotalPortfolio = () => {
    return groupedInvestments.reduce((total, inv) => {
      const quote = quotes[inv.ticker];
      if (quote) {
        return total + (inv.quantity * quote.regularMarketPrice);
      }
      return total + (inv.quantity * inv.average_price);
    }, 0);
  };

  const totalPortfolio = getTotalPortfolio();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardContent>
        {groupedInvestments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum investimento cadastrado ainda.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Quant.</TableHead>
                  <TableHead className="text-right">Preço Médio</TableHead>
                  <TableHead className="text-right">Preço Atual</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                  <TableHead className="text-right">Rentabilidade</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  <TableHead className="text-right">PVP</TableHead>
                  <TableHead className="text-right">DY</TableHead>
                  <TableHead className="text-right">% na carteira</TableHead>
                  <TableHead className="text-right">Opções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedInvestments.map((investment) => {
                  const quote = quotes[investment.ticker];
                  const metrics = quote
                    ? calculateMetrics(investment, quote.regularMarketPrice)
                    : null;
                  
                  const portfolioPercent = metrics
                    ? (metrics.current / totalPortfolio) * 100
                    : 0;

                  return (
                    <TableRow key={investment.ticker}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {investment.ticker.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold">{investment.ticker}</div>
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[investment.type]}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {investment.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {investment.average_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {loading[investment.ticker] ? (
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                        ) : quote ? (
                          <span>R$ {quote.regularMarketPrice.toFixed(2)}</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchQuote(investment.ticker)}
                          >
                            Buscar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {quote && (
                          <div className="flex items-center justify-end gap-1">
                            <Badge
                              variant={
                                quote.regularMarketChangePercent >= 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {quote.regularMarketChangePercent >= 0 ? "+" : ""}
                              {quote.regularMarketChangePercent.toFixed(2)}%
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metrics && (
                          <Badge
                            variant={
                              metrics.profitPercent >= 0 ? "default" : "destructive"
                            }
                          >
                            {metrics.profitPercent >= 0 ? "+" : ""}
                            {metrics.profitPercent.toFixed(2)}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metrics && (
                          <span>R$ {metrics.current.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metrics && (
                          <span
                            className={
                              metrics.pl >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            R$ {metrics.pl.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metrics && (
                          <span>{metrics.pvp.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span>{metrics?.dy.toFixed(2) || "0.00"}%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {portfolioPercent > 0 && (
                          <Badge variant="outline">
                            {portfolioPercent.toFixed(2)}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(investment.ticker)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
