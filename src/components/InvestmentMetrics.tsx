import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";

interface InvestmentMetricsProps {
  totalInvested: number;
  totalCurrent: number;
  totalDividends: number;
  totalAssets: number;
}

export const InvestmentMetrics = ({
  totalInvested,
  totalCurrent,
  totalDividends,
  totalAssets,
}: InvestmentMetricsProps) => {
  const capitalGain = totalCurrent - totalInvested;
  const totalProfit = capitalGain + totalDividends;
  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const variation = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Patrimônio Total */}
      <Card className="bg-gradient-to-br from-card to-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Patrimônio total
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-sm">
            {variation >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={variation >= 0 ? "text-green-500" : "text-red-500"}>
              {variation >= 0 ? "+" : ""}{variation.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valor investido: R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      {/* Lucro Total */}
      <Card className="bg-gradient-to-br from-card to-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lucro total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ganho de Capital</span>
              <span className={capitalGain >= 0 ? 'text-green-500' : 'text-red-500'}>
                R$ {capitalGain.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Dividendos recebidos</span>
              <span className="text-green-500">
                R$ {totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proventos Recebidos (12M) */}
      <Card className="bg-gradient-to-br from-card to-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Proventos recebidos (12M)
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            R$ {totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Total: R$ {totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      {/* Variação e Rentabilidade */}
      <Card className="bg-gradient-to-br from-card to-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Variação
          </CardTitle>
          {variation >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${variation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {variation >= 0 ? "+" : ""}{variation.toFixed(2)}%
          </div>
          <p className={`text-sm ${capitalGain >= 0 ? 'text-green-500' : 'text-red-500'} mt-1`}>
            {capitalGain >= 0 ? "+" : ""} R$ {Math.abs(capitalGain).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Rentabilidade</span>
              <span className={profitPercent >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                {profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
