import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface Investment {
  id: string;
  ticker: string;
  type: string;
  quantity: number;
  average_price: number;
  purchase_date: string;
}

interface InvestmentChartsProps {
  investments: Investment[];
  quotes: { [key: string]: { regularMarketPrice: number } };
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

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
];

// Função para gerar cor por ticker
const getColorForTicker = (ticker: string, index: number) => {
  const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

export const InvestmentCharts = ({ investments, quotes }: InvestmentChartsProps) => {
  // Distribuição por ativo individual
  const distributionData = investments.map((inv, index) => {
    const currentValue = quotes[inv.ticker]
      ? inv.quantity * quotes[inv.ticker].regularMarketPrice
      : inv.quantity * inv.average_price;
    
    return {
      name: inv.ticker,
      value: currentValue,
      color: getColorForTicker(inv.ticker, index),
    };
  }).sort((a, b) => b.value - a.value);

  // Evolução ao longo do tempo (agrupado por mês)
  const evolutionData = investments
    .sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime())
    .reduce((acc, inv) => {
      const date = new Date(inv.purchase_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      const invested = inv.quantity * inv.average_price;
      const current = quotes[inv.ticker]
        ? inv.quantity * quotes[inv.ticker].regularMarketPrice
        : invested;

      const existing = acc.find((item) => item.month === monthKey);
      if (existing) {
        existing.invested += invested;
        existing.current += current;
      } else {
        acc.push({
          month: monthKey,
          invested,
          current,
        });
      }
      return acc;
    }, [] as { month: string; invested: number; current: number }[]);

  // Calcular valores acumulados
  let cumulativeInvested = 0;
  let cumulativeCurrent = 0;
  const cumulativeData = evolutionData.map((item) => {
    cumulativeInvested += item.invested;
    cumulativeCurrent += item.current;
    return {
      month: item.month,
      invested: cumulativeInvested,
      current: cumulativeCurrent,
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Ativo</CardTitle>
        </CardHeader>
        <CardContent>
          {distributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Sem dados para exibir
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          {cumulativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Investido"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  name="Atual"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Sem dados para exibir
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
