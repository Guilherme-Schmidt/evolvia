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
  const [treasuryPrices, setTreasuryPrices] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Buscar preços atuais do Tesouro Direto
    const fetchTreasuryPrices = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-treasury-bonds");
        if (error) throw error;
        
        if (data?.bonds) {
          const pricesMap: { [key: string]: number } = {};
          data.bonds.forEach((bond: any) => {
            if (bond.sellPrice > 0) {
              pricesMap[bond.name] = bond.sellPrice;
            }
          });
          setTreasuryPrices(pricesMap);
        }
      } catch (error) {
        console.error("Error fetching treasury prices:", error);
      }
    };

    fetchTreasuryPrices();
  }, []);

  // Agrupar investimentos pelo ticker (exceto renda fixa e tesouro que não devem ser agrupados)
  const groupedInvestments = investments.reduce((acc, inv) => {
    // Não agrupar renda fixa e tesouro direto - cada entrada é independente
    if (inv.type === 'fixed_income' || inv.type === 'treasury') {
      acc.push({ ...inv });
    } else {
      // Para ações, FIIs, ETFs, etc., agrupar por ticker
      const existing = acc.find(item => item.ticker === inv.ticker && item.type === inv.type);
      if (existing) {
        const totalQuantity = existing.quantity + inv.quantity;
        const totalInvested = (existing.quantity * existing.average_price) + (inv.quantity * inv.average_price);
        existing.average_price = totalInvested / totalQuantity;
        existing.quantity = totalQuantity;
      } else {
        acc.push({ ...inv });
      }
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

  const calculateTreasuryValue = (investment: Investment) => {
    const invested = investment.quantity * investment.average_price;
    
    // Calcular baseado no tempo e taxa (sempre aplicar rendimento)
    if (investment.purchase_date) {
      const purchaseDate = new Date(investment.purchase_date);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const years = daysDiff / 365;
      
      // Identificar o tipo de título pelo nome
      const tickerUpper = investment.ticker.toUpperCase();
      let totalRate = 0;
      
      if (tickerUpper.includes('IPCA')) {
        // Para IPCA+, usar a taxa informada + IPCA estimado de 4.5%
        const ipca = 4.5;
        const taxaAcima = investment.rate || 6; // Default 6% se não informado
        totalRate = (ipca + taxaAcima) / 100;
      } else if (tickerUpper.includes('SELIC')) {
        // Para Tesouro Selic, usar SELIC de 11.25%
        totalRate = 11.25 / 100;
      } else if (tickerUpper.includes('PREFIXADO')) {
        // Para Prefixado, usar a taxa informada
        totalRate = (investment.rate || 10) / 100; // Default 10% se não informado
      } else {
        // Fallback genérico
        totalRate = (investment.rate || 8) / 100;
      }
      
      // Cálculo composto: Valor Futuro = Valor Presente * (1 + taxa)^anos
      const currentValue = invested * Math.pow(1 + totalRate, years);
      const profit = currentValue - invested;
      const profitPercent = (profit / invested) * 100;
      
      // Calcular preço unitário estimado
      const estimatedCurrentPrice = investment.average_price * Math.pow(1 + totalRate, years);
      const variation = estimatedCurrentPrice - investment.average_price;
      const variationPercent = (variation / investment.average_price) * 100;
      
      return { 
        invested, 
        currentValue, 
        profit, 
        profitPercent,
        currentPrice: estimatedCurrentPrice,
        variation,
        variationPercent
      };
    }
    
    // Se não tem data de compra, retorna apenas o valor investido
    return { 
      invested, 
      currentValue: invested, 
      profit: 0, 
      profitPercent: 0,
      currentPrice: investment.average_price,
      variation: 0,
      variationPercent: 0
    };
  };

  const calculateFixedIncomeValue = (investment: Investment) => {
    const invested = investment.total_value || (investment.quantity * investment.average_price);
    
    if (investment.rate && investment.purchase_date) {
      const purchaseDate = new Date(investment.purchase_date);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const years = daysDiff / 365;
      
      let totalRate = 0;
      
      // Calcular taxa total baseado no indexador
      if (investment.indexer === 'CDI') {
        // Assumir CDI de 11% ao ano
        const estimatedCDI = 11;
        totalRate = (estimatedCDI * (investment.rate / 100)) / 100;
      } else if (investment.indexer === 'IPCA') {
        // IPCA + taxa
        const estimatedIPCA = 4.5;
        totalRate = (estimatedIPCA + investment.rate) / 100;
      } else if (investment.indexer === 'Prefixado') {
        totalRate = investment.rate / 100;
      } else if (investment.indexer === 'SELIC') {
        // Assumir SELIC de 11.25% ao ano
        const estimatedSELIC = 11.25;
        totalRate = (estimatedSELIC * (investment.rate / 100)) / 100;
      }
      
      // Cálculo composto
      const currentValue = invested * Math.pow(1 + totalRate, years);
      const profit = currentValue - invested;
      const profitPercent = (profit / invested) * 100;
      
      return { 
        invested, 
        currentValue, 
        profit, 
        profitPercent
      };
    }
    
    return { 
      invested, 
      currentValue: invested, 
      profit: 0, 
      profitPercent: 0
    };
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
              <th className="text-right p-3 text-sm font-semibold">Variação</th>
              <th className="text-right p-3 text-sm font-semibold">Rentabilidade</th>
              <th className="text-right p-3 text-sm font-semibold">Saldo</th>
              <th className="text-right p-3 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => {
              const values = calculateTreasuryValue(investment);
              
              return (
                <tr key={investment.ticker} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium">{investment.ticker}</div>
                      {investment.rate && (
                        <div className="text-xs text-muted-foreground">
                          {investment.rate}% {investment.indexer ? `+ ${investment.indexer}` : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-3">{investment.quantity.toFixed(4)}</td>
                  <td className="text-right p-3">
                    R$ {investment.average_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-3 font-semibold">
                    R$ {values.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-3">
                    <Badge variant={values.variationPercent >= 0 ? "default" : "destructive"}>
                      {values.variationPercent >= 0 ? "+" : ""}{values.variationPercent.toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="text-right p-3">
                    <Badge variant="outline" className={values.profitPercent >= 0 ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>
                      {values.profitPercent.toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="text-right p-3">
                    <div className="space-y-1">
                      <div className="font-semibold">
                        R$ {values.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-xs ${values.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {values.profit >= 0 ? "+" : ""}R$ {values.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
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

  const renderFixedIncomeTable = (investments: Investment[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-semibold">Ativo</th>
              <th className="text-right p-3 text-sm font-semibold">Taxa</th>
              <th className="text-right p-3 text-sm font-semibold">Investido</th>
              <th className="text-right p-3 text-sm font-semibold">Valor Atual</th>
              <th className="text-right p-3 text-sm font-semibold">Rendimento</th>
              <th className="text-right p-3 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => {
              const description = [
                investment.bond_type,
                investment.issuer,
                investment.payment_form
              ].filter(Boolean).join(' - ');
              
              const values = calculateFixedIncomeValue(investment);
              
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
                      {investment.rate}% {investment.indexer}
                    </Badge>
                  </td>
                  <td className="text-right p-3">
                    R$ {values.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-3 font-semibold">
                    R$ {values.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-3">
                    <span className={values.profit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {values.profit >= 0 ? "+" : ""}R$ {values.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      <div className="text-xs">
                        ({values.profitPercent >= 0 ? "+" : ""}{values.profitPercent.toFixed(2)}%)
                      </div>
                    </span>
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