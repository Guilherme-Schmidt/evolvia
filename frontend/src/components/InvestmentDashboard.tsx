import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, TrendingUp, Edit2, Check, X } from "lucide-react";
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
  target_quantity: number;
  total_value: number | null;
}

interface Quote {
  regularMarketPrice: number;
}

interface MonthlyContribution {
  month: string;
  amount: number;
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

export const InvestmentDashboard = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [quotes, setQuotes] = useState<{ [key: string]: Quote }>({});
  const [contributions, setContributions] = useState<{ [key: string]: MonthlyContribution[] }>({});
  const [loading, setLoading] = useState(true);
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<number>(0);

  // Agrupar investimentos pelo ticker
  const groupedInvestments = investments.reduce((acc, inv) => {
    const existing = acc.find(item => item.ticker === inv.ticker);
    if (existing) {
      if (inv.type === "fixed_income" || inv.type === "treasury") {
        // Para renda fixa, somar total_value
        const existingValue = existing.total_value || (existing.quantity * existing.average_price);
        const newValue = inv.total_value || (inv.quantity * inv.average_price);
        existing.total_value = existingValue + newValue;
        existing.quantity = 1; // Quantidade não é relevante para renda fixa
        existing.average_price = existing.total_value;
      } else {
        // Para ações, somar quantidade normalmente
        const totalQuantity = existing.quantity + inv.quantity;
        const totalInvested = (existing.quantity * existing.average_price) + (inv.quantity * inv.average_price);
        existing.average_price = totalInvested / totalQuantity;
        existing.quantity = totalQuantity;
      }
      // Manter o maior target_quantity
      if (inv.target_quantity > existing.target_quantity) {
        existing.target_quantity = inv.target_quantity;
      }
    } else {
      acc.push({ ...inv });
    }
    return acc;
  }, [] as Investment[]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvestments(),
        fetchContributions()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("ticker", { ascending: true });

      if (error) throw error;
      
      const investmentData = data || [];
      setInvestments(investmentData);

      // Buscar cotações para cada investimento
      investmentData.forEach((inv) => {
        fetchQuote(inv.ticker);
      });
    } catch (error: any) {
      toast.error("Erro ao carregar investimentos");
    }
  };

  const fetchQuote = async (ticker: string) => {
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
          },
        }));
      } else {
        // Se não encontrou cotação, marca como não disponível
        setQuotes((prev) => ({
          ...prev,
          [ticker]: {
            regularMarketPrice: 0,
          },
        }));
      }
    } catch (error: any) {
      console.error("Error fetching quote:", error);
      // Marca como não disponível em caso de erro
      setQuotes((prev) => ({
        ...prev,
        [ticker]: {
          regularMarketPrice: 0,
        },
      }));
    }
  };

  const handleEditTarget = (ticker: string, currentTarget: number) => {
    setEditingTicker(ticker);
    setEditingTarget(currentTarget || 0);
  };

  const handleSaveTarget = async (ticker: string) => {
    try {
      const { error } = await supabase
        .from("investments")
        .update({ target_quantity: editingTarget })
        .eq("ticker", ticker);

      if (error) throw error;

      toast.success("Meta atualizada com sucesso!");
      setEditingTicker(null);
      fetchInvestments();
    } catch (error: any) {
      toast.error("Erro ao atualizar meta");
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTicker(null);
    setEditingTarget(0);
  };

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from("investment_transactions")
        .select("investment_id, transaction_date, total_amount, type")
        .eq("type", "buy")
        .order("transaction_date", { ascending: true });

      if (error) throw error;

      // Agrupar aportes por investimento e mês
      const contributionsByInvestment: { [key: string]: MonthlyContribution[] } = {};
      
      data?.forEach((transaction) => {
        const date = new Date(transaction.transaction_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        if (!contributionsByInvestment[transaction.investment_id]) {
          contributionsByInvestment[transaction.investment_id] = [];
        }

        const existingMonth = contributionsByInvestment[transaction.investment_id].find(
          (c) => c.month === monthKey
        );

        if (existingMonth) {
          existingMonth.amount += transaction.total_amount;
        } else {
          contributionsByInvestment[transaction.investment_id].push({
            month: monthKey,
            amount: transaction.total_amount,
          });
        }
      });

      setContributions(contributionsByInvestment);
    } catch (error: any) {
      console.error("Error fetching contributions:", error);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };


  const getInvestmentValue = (investment: Investment) => {
    // Para renda fixa e tesouro direto, usar total_value diretamente
    if (investment.type === "fixed_income" || investment.type === "treasury") {
      return investment.total_value || (investment.quantity * investment.average_price);
    }
    
    // Para outros ativos, usar cotação de mercado
    const quote = quotes[investment.ticker];
    if (!quote || quote.regularMarketPrice === 0) return 0;
    
    return investment.quantity * quote.regularMarketPrice;
  };

  const getTotalPortfolioValue = () => {
    return groupedInvestments.reduce((total, inv) => {
      return total + getInvestmentValue(inv);
    }, 0);
  };

  const getInvestmentPercentage = (investment: Investment) => {
    const investmentValue = getInvestmentValue(investment);
    if (investmentValue === 0) return 0;
    
    const totalValue = getTotalPortfolioValue();
    return totalValue > 0 ? (investmentValue / totalValue) * 100 : 0;
  };

  const getLastSixMonths = () => {
    const months: string[] = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }
    
    return months;
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return monthNames[parseInt(month) - 1];
  };

  const getContributionForMonth = (investmentId: string, monthKey: string) => {
    const investmentContributions = contributions[investmentId] || [];
    const contribution = investmentContributions.find((c) => c.month === monthKey);
    return contribution ? contribution.amount : 0;
  };

  const lastSixMonths = getLastSixMonths();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando painel...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Painel de Controle de Investimentos
          </CardTitle>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Ativo</TableHead>
                <TableHead className="min-w-[100px]">Segmento</TableHead>
                <TableHead className="text-right min-w-[120px]">Qtd/Valor Atual</TableHead>
                <TableHead className="text-right min-w-[80px]">Meta</TableHead>
                <TableHead className="min-w-[150px]">Progresso</TableHead>
                <TableHead className="text-right min-w-[80px]">% Carteira</TableHead>
                <TableHead className="text-right min-w-[100px]">Patrimônio</TableHead>
                {lastSixMonths.map((month) => (
                  <TableHead key={month} className="text-right min-w-[90px]">
                    {formatMonth(month)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedInvestments.map((investment) => {
                const progress = calculateProgress(investment.quantity, investment.target_quantity);
                const percentage = getInvestmentPercentage(investment);
                const patrimony = getInvestmentValue(investment);

                return (
                  <TableRow key={investment.ticker}>
                    <TableCell className="font-medium">{investment.ticker}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {typeLabels[investment.type] || investment.type}
                    </TableCell>
                    <TableCell className="text-right">
                      {investment.type === "fixed_income" || investment.type === "treasury" ? (
                        <span className="text-sm">
                          R$ {(investment.total_value || (investment.quantity * investment.average_price)).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        investment.quantity
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingTicker === investment.ticker ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            value={editingTarget}
                            onChange={(e) => setEditingTarget(Number(e.target.value))}
                            className="w-20 h-8 text-right"
                            min="0"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSaveTarget(investment.ticker)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span>{investment.target_quantity || "-"}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditTarget(investment.ticker, investment.target_quantity)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={percentage >= 10 ? "text-green-600" : "text-muted-foreground"}>
                        {percentage.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {patrimony > 0 ? (
                        `R$ ${patrimony.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    {lastSixMonths.map((month) => {
                      const amount = getContributionForMonth(investment.id, month);
                      return (
                        <TableCell key={month} className="text-right">
                          {amount > 0 ? (
                            <span className="text-green-600">
                              R$ {amount.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              {groupedInvestments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7 + lastSixMonths.length} className="text-center text-muted-foreground">
                    Nenhum investimento cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
