import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Investment {
  id: string;
  ticker: string;
  type: string;
  quantity: number;
  average_price: number;
  purchase_date: string;
  notes?: string;
  // Campos específicos de Renda Fixa e Tesouro Direto
  issuer?: string;
  bond_type?: string;
  indexer?: string;
  rate?: number;
  payment_form?: string;
  maturity_date?: string;
  daily_liquidity?: boolean;
  total_value?: number;
  broker?: string;
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

interface InvestmentListProps {
  investments: Investment[];
  onDelete: () => void;
}

export const InvestmentList = ({ investments, onDelete }: InvestmentListProps) => {
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

  const calculateProfit = (investment: Investment, currentPrice?: number) => {
    if (!currentPrice) return null;
    const invested = investment.quantity * investment.average_price;
    const current = investment.quantity * currentPrice;
    const profit = current - invested;
    const profitPercent = (profit / invested) * 100;
    return { profit, profitPercent };
  };

  // Agrupar investimentos por tipo
  const investmentsByType = groupedInvestments.reduce((acc, inv) => {
    if (!acc[inv.type]) {
      acc[inv.type] = [];
    }
    acc[inv.type].push(inv);
    return acc;
  }, {} as { [key: string]: Investment[] });

  const renderTreasuryTable = (investments: Investment[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-semibold">Ativo</th>
              <th className="text-right p-3 text-sm font-semibold">Quant.</th>
              <th className="text-right p-3 text-sm font-semibold">Preço Médio</th>
              <th className="text-right p-3 text-sm font-semibold">Preço Atual</th>
              <th className="text-right p-3 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => {
              const currentValue = investment.quantity * investment.average_price;
              return (
                <tr key={investment.ticker} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs">📊</span>
                      </div>
                      <span className="font-medium">{investment.ticker}</span>
                    </div>
                  </td>
                  <td className="text-right p-3">{investment.quantity.toFixed(2)}</td>
                  <td className="text-right p-3">R$ {investment.average_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="text-right p-3 font-semibold">R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="text-right p-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(investment.ticker)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFixedIncomeTable = (investments: Investment[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-semibold">Ativo</th>
              <th className="text-right p-3 text-sm font-semibold">Variação</th>
              <th className="text-right p-3 text-sm font-semibold">Rendimento</th>
              <th className="text-right p-3 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => {
              const description = [
                investment.bond_type,
                investment.issuer,
                investment.payment_form,
                investment.rate ? `${investment.rate}% ${investment.indexer || ''}` : investment.indexer
              ].filter(Boolean).join(' - ');
              
              return (
                <tr key={investment.ticker} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium">{investment.ticker}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                  </td>
                  <td className="text-right p-3">
                    <Badge variant="secondary">
                      {investment.rate ? `${investment.rate}%` : '-'}
                    </Badge>
                  </td>
                  <td className="text-right p-3 font-semibold">
                    R$ {investment.average_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(investment.ticker)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStockTable = (investments: Investment[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-semibold">Ativo</th>
              <th className="text-right p-3 text-sm font-semibold">Quant.</th>
              <th className="text-right p-3 text-sm font-semibold">Preço Médio</th>
              <th className="text-right p-3 text-sm font-semibold">Cotação Atual</th>
              <th className="text-right p-3 text-sm font-semibold">Resultado</th>
              <th className="text-right p-3 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => {
              const quote = quotes[investment.ticker];
              const profitData = quote ? calculateProfit(investment, quote.regularMarketPrice) : null;
              
              return (
                <tr key={investment.ticker} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{investment.ticker}</span>
                      {quote && (
                        <Badge variant={quote.regularMarketChange >= 0 ? "default" : "destructive"} className="text-xs">
                          {quote.regularMarketChange >= 0 ? "+" : ""}{quote.regularMarketChangePercent.toFixed(2)}%
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-3">{investment.quantity}</td>
                  <td className="text-right p-3">R$ {investment.average_price.toFixed(2)}</td>
                  <td className="text-right p-3 font-semibold">
                    {quote ? `R$ ${quote.regularMarketPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="text-right p-3">
                    {profitData && (
                      <span className={profitData.profit >= 0 ? "text-green-600" : "text-red-600"}>
                        R$ {profitData.profit.toFixed(2)} ({profitData.profitPercent.toFixed(2)}%)
                      </span>
                    )}
                  </td>
                  <td className="text-right p-3">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchQuote(investment.ticker)}
                        disabled={loading[investment.ticker]}
                      >
                        <RefreshCw className={`h-4 w-4 ${loading[investment.ticker] ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(investment.ticker)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(investmentsByType).map(([type, investments]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {typeLabels[type] || type}
              <Badge variant="outline">{investments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {type === "treasury" && renderTreasuryTable(investments)}
            {type === "fixed_income" && renderFixedIncomeTable(investments)}
            {!["treasury", "fixed_income"].includes(type) && renderStockTable(investments)}
          </CardContent>
        </Card>
      ))}
      
      {groupedInvestments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground text-center">
              Nenhum investimento cadastrado ainda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};