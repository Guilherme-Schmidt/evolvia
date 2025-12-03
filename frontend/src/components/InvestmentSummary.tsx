import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, PieChart } from "lucide-react";

interface InvestmentSummaryProps {
  totalInvested: number;
  totalCurrent: number;
  totalAssets: number;
}

export const InvestmentSummary = ({
  totalInvested,
  totalCurrent,
  totalAssets,
}: InvestmentSummaryProps) => {
  const totalProfit = totalCurrent - totalInvested;
  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const cards = [
    {
      title: "Total Investido",
      value: totalInvested,
      icon: Wallet,
      color: "text-blue-600",
    },
    {
      title: "Valor Atual",
      value: totalCurrent,
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Ativos",
      value: totalAssets,
      icon: PieChart,
      color: "text-orange-600",
      isCount: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.isCount
                  ? card.value
                  : `R$ ${card.value.toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rentabilidade Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Lucro/Prejuízo:</span>
              <span
                className={`text-xl font-bold ${
                  totalProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                R$ {totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rentabilidade:</span>
              <span
                className={`text-xl font-bold ${
                  profitPercent >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {profitPercent >= 0 ? "+" : ""}
                {profitPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};