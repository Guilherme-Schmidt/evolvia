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

  const renderInvestmentCard = (investment: Investment) => {
    const quote = quotes[investment.ticker];
    const profitData = quote
      ? calculateProfit(investment, quote.regularMarketPrice)
      : null;
    
    const isFixedIncome = investment.type === "fixed_income" || investment.type === "treasury";
    const showQuote = !isFixedIncome; // Não buscar cotação para renda fixa e tesouro

    return (
      <div
        key={investment.ticker}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg">{investment.ticker}</span>
            <Badge variant="secondary">
              {typeLabels[investment.type]}
            </Badge>
            {quote && showQuote && (
              <Badge
                variant={
                  quote.regularMarketChange >= 0 ? "default" : "destructive"
                }
              >
                {quote.regularMarketChange >= 0 ? "+" : ""}
                {quote.regularMarketChangePercent.toFixed(2)}%
              </Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            {isFixedIncome ? (
              <>
                <p className="font-medium">
                  Valor Total: R$ {investment.average_price.toFixed(2)}
                </p>
                {investment.issuer && (
                  <p>Emissor: {investment.issuer}</p>
                )}
                {investment.indexer && (
                  <p>Indexador: {investment.indexer}</p>
                )}
                {investment.rate && (
                  <p>Taxa: {investment.rate}% a.a.</p>
                )}
                {investment.maturity_date && (
                  <p>Vencimento: {new Date(investment.maturity_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                )}
                {investment.daily_liquidity !== undefined && (
                  <p>Liquidez Diária: {investment.daily_liquidity ? 'Sim' : 'Não'}</p>
                )}
                {investment.broker && (
                  <p>Corretora: {investment.broker}</p>
                )}
              </>
            ) : (
              <>
                <p>
                  Quantidade: {investment.quantity} | Preço médio: R${" "}
                  {investment.average_price.toFixed(2)}
                </p>
                {quote && (
                  <>
                    <p className="font-semibold">
                      Cotação atual: R$ {quote.regularMarketPrice.toFixed(2)}
                    </p>
                    {profitData && (
                      <p
                        className={
                          profitData.profit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        Resultado: R$ {profitData.profit.toFixed(2)} (
                        {profitData.profitPercent.toFixed(2)}%)
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            {investment.notes && (
              <p className="text-xs italic">{investment.notes}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {showQuote && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchQuote(investment.ticker)}
              disabled={loading[investment.ticker]}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading[investment.ticker] ? "animate-spin" : ""
                }`}
              />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(investment.ticker)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
            <div className="space-y-4">
              {investments.map((investment) => renderInvestmentCard(investment))}
            </div>
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