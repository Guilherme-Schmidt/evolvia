import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TickerAutocomplete } from "@/components/TickerAutocomplete";
import { TreasuryBondSelect } from "@/components/TreasuryBondSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

const investmentTypes = [
  { value: "stock", label: "Ações" },
  { value: "fii", label: "Fundos Imobiliários" },
  { value: "etf", label: "ETFs" },
  { value: "bdr", label: "BDRs" },
  { value: "treasury", label: "Tesouro Direto" },
  { value: "crypto", label: "Criptomoedas" },
  { value: "fixed_income", label: "Renda Fixa" },
  { value: "other", label: "Outros" },
];

interface InvestmentFormProps {
  onSuccess: () => void;
}

interface BrokerAccount {
  id: string;
  broker_name: string;
  account_balance: number;
}

export const InvestmentForm = ({ onSuccess }: InvestmentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [sellingAssetType, setSellingAssetType] = useState<string | null>(null);
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [selectedBrokerAccount, setSelectedBrokerAccount] = useState<string>("");
  const [formData, setFormData] = useState({
    ticker: "",
    type: "",
    quantity: "",
    average_price: "",
    target_quantity: "",
    purchase_date: new Date().toISOString().split("T")[0],
    notes: "",
    broker: "",
    // Campos para Renda Fixa e Tesouro Direto
    issuer: "",
    bond_type: "",
    indexer: "",
    rate: "",
    payment_form: "",
    maturity_date: "",
    daily_liquidity: false,
    total_value: "",
  });

  useEffect(() => {
    fetchBrokerAccounts();
  }, []);

  const fetchBrokerAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("broker_accounts")
        .select("*")
        .order("broker_name", { ascending: true });

      if (error) throw error;
      setBrokerAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching broker accounts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const isFixedIncome = transactionType === "sell" 
        ? (sellingAssetType === "fixed_income" || sellingAssetType === "treasury")
        : (formData.type === "fixed_income" || formData.type === "treasury");
      
      // Validações
      if (!formData.ticker || formData.ticker.trim() === "") {
        toast.error("Por favor, preencha o ticker/código do ativo");
        return;
      }

      if (transactionType === "buy" && formData.type === "treasury") {
        if (!formData.average_price || Number(formData.average_price) <= 0) {
          toast.error("Por favor, preencha o preço unitário do título. Consulte no site do Tesouro Direto.");
          return;
        }
      }

      if (transactionType === "buy" && !isFixedIncome) {
        if (!formData.quantity || Number(formData.quantity) <= 0) {
          toast.error("Por favor, preencha uma quantidade válida");
          return;
        }
        if (!formData.average_price || Number(formData.average_price) <= 0) {
          toast.error("Por favor, preencha um preço válido");
          return;
        }
      }

      if (transactionType === "buy" && isFixedIncome && formData.type !== "treasury") {
        if (!formData.total_value || Number(formData.total_value) <= 0) {
          toast.error("Por favor, preencha o valor total investido");
          return;
        }
      }

      if (transactionType === "sell" && isFixedIncome) {
        if (!formData.total_value || Number(formData.total_value) <= 0) {
          toast.error("Por favor, preencha o valor que deseja vender");
          return;
        }
      }

      if (transactionType === "sell" && !isFixedIncome) {
        if (!formData.quantity || Number(formData.quantity) <= 0) {
          toast.error("Por favor, preencha uma quantidade válida");
          return;
        }
        if (!formData.average_price || Number(formData.average_price) <= 0) {
          toast.error("Por favor, preencha um preço válido");
          return;
        }
      }
      
      // Para renda fixa, usar total_value ao invés de quantity * price
      let quantity, price, totalAmount, ticker;
      
      if (isFixedIncome) {
        if (formData.type === "treasury") {
          // Para Tesouro Direto, usar quantity * average_price
          ticker = formData.ticker.trim(); // Normalizar removendo espaços
          quantity = Number(formData.quantity) || 1;
          price = Number(formData.average_price);
          totalAmount = quantity * price;
        } else {
          // Para renda fixa normal, usar total_value e normalizar o ticker
          totalAmount = Number(formData.total_value);
          quantity = 1;
          price = totalAmount;
          ticker = (formData.ticker || formData.bond_type || "RENDA_FIXA").trim();
        }
      } else {
        ticker = formData.ticker.trim().toUpperCase();
        quantity = Number(formData.quantity);
        price = Number(formData.average_price);
        totalAmount = quantity * price;
      }
      
      // Garantir formato correto da data (YYYY-MM-DD)
      const transactionDate = formData.purchase_date;

      if (transactionType === "buy") {
        // Verificar saldo da corretora se uma conta foi selecionada
        if (selectedBrokerAccount) {
          const account = brokerAccounts.find(acc => acc.id === selectedBrokerAccount);
          if (account && account.account_balance < totalAmount) {
            toast.error(`Saldo insuficiente na corretora. Disponível: R$ ${account.account_balance.toFixed(2)}`);
            return;
          }
        }

        // Insert investment
        const investmentPayload: any = {
          user_id: user.id,
          ticker,
          type: formData.type as any,
          quantity,
          average_price: price,
          target_quantity: formData.target_quantity ? Number(formData.target_quantity) : 0,
          purchase_date: transactionDate,
          notes: formData.notes || null,
          broker: formData.broker || null,
          broker_account_id: selectedBrokerAccount || null,
        };

        // Adicionar campos específicos de renda fixa se aplicável
        if (isFixedIncome) {
          investmentPayload.issuer = formData.issuer || null;
          investmentPayload.bond_type = formData.bond_type || null;
          investmentPayload.indexer = formData.indexer || null;
          investmentPayload.rate = formData.rate ? Number(formData.rate) : null;
          investmentPayload.payment_form = formData.payment_form || null;
          investmentPayload.maturity_date = formData.maturity_date || null;
          investmentPayload.daily_liquidity = formData.daily_liquidity;
          investmentPayload.total_value = totalAmount;
        }

        const { data: investmentData, error: investmentError } = await supabase
          .from("investments")
          .insert([investmentPayload])
          .select()
          .single();

        if (investmentError) throw investmentError;

        // Register transaction
        const { error: transactionError } = await supabase
          .from("investment_transactions")
          .insert([{
            user_id: user.id,
            investment_id: investmentData.id,
            type: "buy",
            quantity,
            price,
            total_amount: totalAmount,
            transaction_date: transactionDate,
            notes: formData.notes || null,
            broker_account_id: selectedBrokerAccount || null,
          }]);

        if (transactionError) throw transactionError;

        // Deduzir o valor da conta de corretora se uma foi selecionada
        if (selectedBrokerAccount) {
          const account = brokerAccounts.find(acc => acc.id === selectedBrokerAccount);
          if (account) {
            const { error: updateError } = await supabase
              .from("broker_accounts")
              .update({ account_balance: account.account_balance - totalAmount })
              .eq("id", selectedBrokerAccount);

            if (updateError) throw updateError;
          }
        }

        toast.success("Compra registrada com sucesso!");
      } else {
        // Handle sell
        const normalizedTicker = ticker.toUpperCase();
        const { data: existingInvestments, error: fetchError } = await supabase
          .from("investments")
          .select("*")
          .eq("user_id", user.id)
          .ilike("ticker", normalizedTicker)
          .order("purchase_date", { ascending: true });

        if (fetchError) throw fetchError;

        if (!existingInvestments || existingInvestments.length === 0) {
          throw new Error("Você não possui este ativo para vender");
        }

        if (isFixedIncome) {
          // Venda de renda fixa por valor
          const valueToSell = totalAmount;
          const totalOwned = existingInvestments.reduce((sum, inv) => {
            return sum + (inv.total_value || (Number(inv.quantity) * Number(inv.average_price)));
          }, 0);
          
          if (totalOwned < valueToSell) {
            throw new Error(`Valor insuficiente. Você possui R$ ${totalOwned.toFixed(2)} de ${ticker}`);
          }

          // Register sell transaction using the first investment as reference
          const { error: transactionError } = await supabase
            .from("investment_transactions")
            .insert([{
              user_id: user.id,
              investment_id: existingInvestments[0].id,
              type: "sell",
              quantity: 1,
              price: valueToSell,
              total_amount: valueToSell,
              transaction_date: transactionDate,
              notes: formData.notes || null,
              broker_account_id: selectedBrokerAccount || null,
            }]);

          if (transactionError) throw transactionError;

          // Adicionar o valor à conta de corretora se uma foi selecionada
          if (selectedBrokerAccount) {
            const account = brokerAccounts.find(acc => acc.id === selectedBrokerAccount);
            if (account) {
              const { error: updateError } = await supabase
                .from("broker_accounts")
                .update({ account_balance: account.account_balance + valueToSell })
                .eq("id", selectedBrokerAccount);

              if (updateError) throw updateError;
            }
          }

          // Update investment values (FIFO - First In First Out)
          let remainingValueToSell = valueToSell;
          for (const investment of existingInvestments) {
            if (remainingValueToSell <= 0) break;

            const currentValue = investment.total_value || (Number(investment.quantity) * Number(investment.average_price));
            
            if (currentValue <= remainingValueToSell) {
              // Delete this investment entirely
              await supabase
                .from("investments")
                .delete()
                .eq("id", investment.id);
              remainingValueToSell -= currentValue;
            } else {
              // Reduce value
              const newValue = currentValue - remainingValueToSell;
              await supabase
                .from("investments")
                .update({ 
                  total_value: newValue,
                  quantity: 1,
                  average_price: newValue
                })
                .eq("id", investment.id);
              remainingValueToSell = 0;
            }
          }

          toast.success("Venda registrada com sucesso!");
        } else {
          // Venda de ações por quantidade
          const totalOwned = existingInvestments.reduce((sum, inv) => sum + Number(inv.quantity), 0);
          
          if (totalOwned < quantity) {
            throw new Error(`Quantidade insuficiente. Você possui ${totalOwned} unidades de ${ticker}`);
          }

          // Register sell transaction using the first investment as reference
          const { error: transactionError } = await supabase
            .from("investment_transactions")
            .insert([{
              user_id: user.id,
              investment_id: existingInvestments[0].id,
              type: "sell",
              quantity,
              price,
              total_amount: totalAmount,
              transaction_date: transactionDate,
              notes: formData.notes || null,
              broker_account_id: selectedBrokerAccount || null,
            }]);

          if (transactionError) throw transactionError;

          // Adicionar o valor à conta de corretora se uma foi selecionada
          if (selectedBrokerAccount) {
            const account = brokerAccounts.find(acc => acc.id === selectedBrokerAccount);
            if (account) {
              const { error: updateError } = await supabase
                .from("broker_accounts")
                .update({ account_balance: account.account_balance + totalAmount })
                .eq("id", selectedBrokerAccount);

              if (updateError) throw updateError;
            }
          }

          // Update investment quantities (FIFO - First In First Out)
          let remainingToSell = quantity;
          for (const investment of existingInvestments) {
            if (remainingToSell <= 0) break;

            const currentQty = Number(investment.quantity);
            if (currentQty <= remainingToSell) {
              // Delete this investment entirely
              await supabase
                .from("investments")
                .delete()
                .eq("id", investment.id);
              remainingToSell -= currentQty;
            } else {
              // Reduce quantity
              await supabase
                .from("investments")
                .update({ quantity: currentQty - remainingToSell })
                .eq("id", investment.id);
              remainingToSell = 0;
            }
          }

          toast.success("Venda registrada com sucesso!");
        }
      }

      setFormData({
        ticker: "",
        type: "",
        quantity: "",
        average_price: "",
        target_quantity: "",
        purchase_date: new Date().toISOString().split("T")[0],
        notes: "",
        broker: "",
        issuer: "",
        bond_type: "",
        indexer: "",
        rate: "",
        payment_form: "",
        maturity_date: "",
        daily_liquidity: false,
        total_value: "",
      });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {transactionType === "buy" ? "Comprar Ativo" : "Vender Ativo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Operação</Label>
            <Select
              value={transactionType}
              onValueChange={(value: "buy" | "sell") => {
                setTransactionType(value);
                setSellingAssetType(null);
                setSelectedBrokerAccount("");
                // Limpar campos ao mudar tipo de transação
                setFormData({
                  ...formData,
                  ticker: "",
                  quantity: "",
                  average_price: "",
                  total_value: "",
                  notes: "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Compra</SelectItem>
                <SelectItem value="sell">Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactionType === "buy" && (
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Ativo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Campos específicos para Tesouro Direto */}
            {transactionType === "buy" && formData.type === "treasury" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ticker">Título do Tesouro</Label>
                  <TreasuryBondSelect
                    value={formData.ticker}
                    onValueChange={(value) => setFormData({ ...formData, ticker: value })}
                    onBondSelect={(bond) => {
                      setFormData({
                        ...formData,
                        ticker: bond.name,
                        bond_type: bond.name,
                        maturity_date: bond.maturityDate,
                        average_price: bond.buyPrice > 0 ? bond.buyPrice.toFixed(2) : '',
                        rate: bond.buyRate > 0 ? bond.buyRate.toFixed(2) : '',
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Ex: 0.10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="average_price">
                    Preço Unitário (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="average_price"
                    type="number"
                    step="0.01"
                    value={formData.average_price}
                    onChange={(e) =>
                      setFormData({ ...formData, average_price: e.target.value })
                    }
                    placeholder="Ex: 3200.50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Preço preenchido automaticamente com dados oficiais do Tesouro Transparente. Ajuste se necessário.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Taxa Contratada (% a.a.)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    placeholder="Ex: 6.50 (IPCA + 6,50%)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa preenchida automaticamente quando disponível. Para títulos IPCA+, informe apenas a parte acima do IPCA.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Data da Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maturity_date">Data de Vencimento</Label>
                  <Input
                    id="maturity_date"
                    type="date"
                    value={formData.maturity_date}
                    onChange={(e) =>
                      setFormData({ ...formData, maturity_date: e.target.value })
                    }
                    required={!formData.daily_liquidity}
                    disabled
                    placeholder={formData.daily_liquidity ? "Não aplicável" : ""}
                  />
                  {formData.daily_liquidity && (
                    <p className="text-sm text-muted-foreground">
                      Títulos com liquidez diária não possuem data de vencimento fixa
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broker">Corretora</Label>
                  <Input
                    id="broker"
                    value={formData.broker}
                    onChange={(e) =>
                      setFormData({ ...formData, broker: e.target.value })
                    }
                    placeholder="Ex: XP Investimentos"
                  />
                </div>
              </>
            ) : transactionType === "buy" && formData.type === "fixed_income" ? (
              /* Campos específicos para Renda Fixa */
              <>
                <div className="space-y-2">
                  <Label htmlFor="ticker">Nome/Código do Investimento</Label>
                  <Input
                    id="ticker"
                    value={formData.ticker}
                    onChange={(e) =>
                      setFormData({ ...formData, ticker: e.target.value })
                    }
                    placeholder="Ex: CDB Banco Inter 2025, LCI Nubank"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite um nome descritivo para identificar este investimento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bond_type">Tipo de Título</Label>
                  <Select
                    value={formData.bond_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bond_type: value })
                    }
                    required
                  >
                    <SelectTrigger id="bond_type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDB">CDB</SelectItem>
                      <SelectItem value="LCI">LCI</SelectItem>
                      <SelectItem value="LCA">LCA</SelectItem>
                      <SelectItem value="LC">LC</SelectItem>
                      <SelectItem value="LF">LF</SelectItem>
                      <SelectItem value="Debênture">Debênture</SelectItem>
                      <SelectItem value="CRI">CRI</SelectItem>
                      <SelectItem value="CRA">CRA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuer">Emissor</Label>
                  <Input
                    id="issuer"
                    value={formData.issuer}
                    onChange={(e) =>
                      setFormData({ ...formData, issuer: e.target.value })
                    }
                    placeholder="Ex: Banco Inter, Nubank"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indexer">Indexador</Label>
                  <Select
                    value={formData.indexer}
                    onValueChange={(value) =>
                      setFormData({ ...formData, indexer: value })
                    }
                    required
                  >
                    <SelectTrigger id="indexer">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="IPCA">IPCA</SelectItem>
                      <SelectItem value="Prefixado">Prefixado</SelectItem>
                      <SelectItem value="SELIC">SELIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Taxa Contratada</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    placeholder="Ex: 120 (120% do CDI) ou 13.50 (13,50% a.a.)"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa de rendimento anual que o emissor pagará (% do indexador ou % a.a. se prefixado)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_form">Forma</Label>
                  <Select
                    value={formData.payment_form}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_form: value })
                    }
                    required
                  >
                    <SelectTrigger id="payment_form">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pós-fixado">Pós-fixado</SelectItem>
                      <SelectItem value="Pré-fixado">Pré-fixado</SelectItem>
                      <SelectItem value="Híbrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_value">Valor Investido (R$)</Label>
                  <Input
                    id="total_value"
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) =>
                      setFormData({ ...formData, total_value: e.target.value })
                    }
                    placeholder="Ex: 10000.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Data da Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maturity_date">Data de Vencimento</Label>
                  <Input
                    id="maturity_date"
                    type="date"
                    value={formData.maturity_date}
                    onChange={(e) =>
                      setFormData({ ...formData, maturity_date: e.target.value })
                    }
                    required={!formData.daily_liquidity}
                    placeholder={formData.daily_liquidity ? "Não aplicável" : ""}
                  />
                  {formData.daily_liquidity && (
                    <p className="text-sm text-muted-foreground">
                      Investimentos com liquidez diária não requerem data de vencimento
                    </p>
                  )}
                </div>

                <div className="space-y-2 flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="daily_liquidity"
                    checked={formData.daily_liquidity}
                    onChange={(e) =>
                      setFormData({ ...formData, daily_liquidity: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="daily_liquidity" className="cursor-pointer">
                    Liquidez diária
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broker">Corretora</Label>
                  <Input
                    id="broker"
                    value={formData.broker}
                    onChange={(e) =>
                      setFormData({ ...formData, broker: e.target.value })
                    }
                    placeholder="Ex: Clear, XP, Rico"
                  />
                </div>
              </>
            ) : (
              /* Campos para Ações, FIIs, ETFs, BDRs, Cripto e Venda */
              <>
                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker/Código</Label>
                  {transactionType === "sell" ? (
                    <Input
                      id="ticker"
                      value={formData.ticker}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, ticker: value });
                        
                        // Auto-detectar o tipo de ativo ao preencher o ticker na venda
                        if (value.trim().length >= 3) {
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                              const { data } = await supabase
                                .from("investments")
                                .select("type")
                                .eq("user_id", user.id)
                                .ilike("ticker", value.trim())
                                .limit(1)
                                .single();
                              
                              if (data) {
                                setSellingAssetType(data.type);
                              }
                            }
                          } catch (error) {
                            // Ignore errors
                          }
                        }
                      }}
                      placeholder="Ex: PETR4, CDB Banco Inter"
                      required
                    />
                  ) : (
                    <TickerAutocomplete
                      id="ticker"
                      value={formData.ticker}
                      onChange={(value) => setFormData({ ...formData, ticker: value })}
                      placeholder="Ex: PETR4, MXRF11"
                      investmentType={formData.type}
                    />
                  )}
                </div>

                {transactionType === "sell" && sellingAssetType && (sellingAssetType === "fixed_income" || sellingAssetType === "treasury") ? (
                  /* Campos para venda de Renda Fixa */
                  <div className="space-y-2">
                    <Label htmlFor="total_value">Valor a Vender (R$)</Label>
                    <Input
                      id="total_value"
                      type="number"
                      step="0.01"
                      value={formData.total_value}
                      onChange={(e) =>
                        setFormData({ ...formData, total_value: e.target.value })
                      }
                      placeholder="Ex: 5000.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Informe o valor em reais que deseja resgatar
                    </p>
                  </div>
                ) : (
                  /* Campos para ações/FIIs ou quando o tipo ainda não foi detectado */
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        placeholder="Ex: 100"
                        required
                      />
          </div>

          {/* Seleção de Conta de Corretora */}
          {brokerAccounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="broker_account">Conta de Corretora (opcional)</Label>
              <Select
                value={selectedBrokerAccount}
                onValueChange={setSelectedBrokerAccount}
              >
                <SelectTrigger id="broker_account">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {brokerAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.broker_name} - R$ {account.account_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {transactionType === "buy" 
                  ? "Ao selecionar uma conta, o valor da compra será deduzido do saldo" 
                  : "Ao selecionar uma conta, o valor da venda será adicionado ao saldo"}
              </p>
            </div>
          )}

          <div className="space-y-2">
                      <Label htmlFor="average_price">{transactionType === "buy" ? "Preço de Compra (R$)" : "Preço de Venda (R$)"}</Label>
                      <Input
                        id="average_price"
                        type="number"
                        step="0.01"
                        value={formData.average_price}
                        onChange={(e) =>
                          setFormData({ ...formData, average_price: e.target.value })
                        }
                        placeholder="Ex: 25.50"
                        required
                      />
                    </div>
                  </>
                )}

                {transactionType === "buy" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="target_quantity">Meta de Quantidade</Label>
                      <Input
                        id="target_quantity"
                        type="number"
                        step="0.01"
                        value={formData.target_quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, target_quantity: e.target.value })
                        }
                        placeholder="Ex: 200 (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="broker">Corretora</Label>
                      <Input
                        id="broker"
                        value={formData.broker}
                        onChange={(e) =>
                          setFormData({ ...formData, broker: e.target.value })
                        }
                        placeholder="Ex: Clear, XP, Rico"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">{transactionType === "buy" ? "Data de Compra" : "Data de Venda"}</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_date: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notas sobre o investimento..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading 
              ? (transactionType === "buy" ? "Registrando compra..." : "Registrando venda...") 
              : (transactionType === "buy" ? "Registrar Compra" : "Registrar Venda")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};