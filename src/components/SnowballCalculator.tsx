import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp } from "lucide-react";

export const SnowballCalculator = () => {
  const [formData, setFormData] = useState({
    ticker: "",
    currentPrice: "",
    targetMonthlyIncome: "",
    dividendYield: "",
    currentShares: "",
  });

  const [result, setResult] = useState<{
    sharesToBuy: number;
    totalInvestment: number;
    monthlyDividends: number;
    totalShares: number;
  } | null>(null);

  const calculateSnowball = () => {
    const price = Number(formData.currentPrice);
    const targetIncome = Number(formData.targetMonthlyIncome);
    const yieldPercent = Number(formData.dividendYield) / 100;
    const current = Number(formData.currentShares) || 0;

    if (price <= 0 || targetIncome <= 0 || yieldPercent <= 0) {
      return;
    }

    // Calcular dividendo anual por ação
    const annualDividendPerShare = price * yieldPercent;
    const monthlyDividendPerShare = annualDividendPerShare / 12;

    // Calcular quantas ações são necessárias para atingir a renda mensal desejada
    const totalSharesNeeded = Math.ceil(targetIncome / monthlyDividendPerShare);
    const sharesToBuy = Math.max(0, totalSharesNeeded - current);
    const totalInvestment = sharesToBuy * price;
    const monthlyDividends = totalSharesNeeded * monthlyDividendPerShare;

    setResult({
      sharesToBuy,
      totalInvestment,
      monthlyDividends,
      totalShares: totalSharesNeeded,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora Bola de Neve - Dividendos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Calcule quantas cotas precisa para atingir sua renda mensal desejada
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker do Ativo</Label>
              <Input
                id="ticker"
                value={formData.ticker}
                onChange={(e) =>
                  setFormData({ ...formData, ticker: e.target.value.toUpperCase() })
                }
                placeholder="Ex: PETR4, MXRF11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPrice">Preço Atual (R$)</Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                value={formData.currentPrice}
                onChange={(e) =>
                  setFormData({ ...formData, currentPrice: e.target.value })
                }
                placeholder="Ex: 25.50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
              <Input
                id="dividendYield"
                type="number"
                step="0.01"
                value={formData.dividendYield}
                onChange={(e) =>
                  setFormData({ ...formData, dividendYield: e.target.value })
                }
                placeholder="Ex: 8.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentShares">Cotas Atuais (opcional)</Label>
              <Input
                id="currentShares"
                type="number"
                value={formData.currentShares}
                onChange={(e) =>
                  setFormData({ ...formData, currentShares: e.target.value })
                }
                placeholder="Ex: 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMonthlyIncome">Renda Mensal Desejada (R$)</Label>
              <Input
                id="targetMonthlyIncome"
                type="number"
                step="0.01"
                value={formData.targetMonthlyIncome}
                onChange={(e) =>
                  setFormData({ ...formData, targetMonthlyIncome: e.target.value })
                }
                placeholder="Ex: 1000"
              />
            </div>

            <Button onClick={calculateSnowball} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Resultado da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-sm text-muted-foreground">Cotas necessárias</span>
                    <span className="text-xl font-bold">{result.totalShares.toLocaleString('pt-BR')}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-sm text-muted-foreground">Cotas a comprar</span>
                    <span className="text-xl font-bold text-primary">
                      {result.sharesToBuy.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-sm text-muted-foreground">Investimento necessário</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {result.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="text-sm text-muted-foreground">Renda mensal estimada</span>
                    <span className="text-xl font-bold text-green-500">
                      R$ {result.monthlyDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-3 border-t text-xs text-muted-foreground">
                    <p>* Cálculo baseado no Dividend Yield informado</p>
                    <p>* Não considera impostos e taxas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
