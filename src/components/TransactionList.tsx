import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, TrendingDown, ChevronDown, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description?: string;
  credit_card_id?: string;
  installments?: number;
  current_installment?: number;
  credit_cards?: {
    name: string;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  salary: "Salário",
  freelance: "Freelance",
  investment: "Investimento",
  other_income: "Outros",
  food: "Alimentação",
  transport: "Transporte",
  housing: "Moradia",
  entertainment: "Entretenimento",
  health: "Saúde",
  education: "Educação",
  shopping: "Compras",
  credit_card: "Cartão de Crédito",
  meal_voucher: "Vale Refeição",
  utilities: "Contas",
  insurance: "Seguros",
  subscription: "Assinaturas",
  personal_care: "Cuidados Pessoais",
  gifts: "Presentes",
  travel: "Viagens",
  clothing: "Roupas",
  home_maintenance: "Manutenção Casa",
  other_expense: "Outros",
};

export const TransactionList = ({ transactions, onDelete }: TransactionListProps) => {
  const [openInstallments, setOpenInstallments] = useState<string[]>([]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      
      if (error) throw error;
      
      toast.success("Transação removida com sucesso!");
      onDelete?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover transação");
    }
  };

  const handleDeleteInstallmentGroup = async (groupTransactions: Transaction[]) => {
    try {
      const ids = groupTransactions.map(t => t.id);
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", ids);
      
      if (error) throw error;
      
      toast.success("Todas as parcelas removidas com sucesso!");
      onDelete?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover parcelas");
    }
  };

  const toggleInstallment = (key: string) => {
    setOpenInstallments(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhuma transação registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar transações parceladas
  const groupedTransactions: Array<{ key: string; transactions: Transaction[]; isInstallment: boolean }> = [];
  const processedIds = new Set<string>();

  transactions.forEach((transaction) => {
    if (processedIds.has(transaction.id)) return;

    // Se tem parcelas e é parcelado
    if (transaction.installments && transaction.installments > 1) {
      // Extrair o título base (remover a parte " (X/Y)")
      const baseTitle = transaction.title.replace(/\s*\([\d]+\/[\d]+\)\s*$/, "").replace(/\s*-\s*Cartão\s*\d+\s*\([\d]+\/[\d]+\)\s*$/, "");
      
      // Buscar todas as parcelas com o mesmo título base
      const relatedTransactions = transactions.filter(t => {
        const tBaseTitle = t.title.replace(/\s*\([\d]+\/[\d]+\)\s*$/, "").replace(/\s*-\s*Cartão\s*\d+\s*\([\d]+\/[\d]+\)\s*$/, "");
        return tBaseTitle === baseTitle && 
               t.installments === transaction.installments &&
               !processedIds.has(t.id);
      }).sort((a, b) => (a.current_installment || 0) - (b.current_installment || 0));

      relatedTransactions.forEach(t => processedIds.add(t.id));
      
      groupedTransactions.push({
        key: `installment-${baseTitle}-${transaction.installments}`,
        transactions: relatedTransactions,
        isInstallment: true
      });
    } else {
      // Transação única
      processedIds.add(transaction.id);
      groupedTransactions.push({
        key: `single-${transaction.id}`,
        transactions: [transaction],
        isInstallment: false
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {groupedTransactions.map((group) => {
            const mainTransaction = group.transactions[0];
            const totalAmount = group.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
            const isOpen = openInstallments.includes(group.key);

            if (group.isInstallment) {
              // Remover sufixo de parcela do título
              const displayTitle = mainTransaction.title.replace(/\s*\([\d]+\/[\d]+\)\s*$/, "").replace(/\s*-\s*Cartão\s*\d+\s*\([\d]+\/[\d]+\)\s*$/, "");
              
              return (
                <Collapsible key={group.key} open={isOpen} onOpenChange={() => toggleInstallment(group.key)}>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 rounded-full bg-destructive/10">
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{displayTitle}</p>
                              <Badge variant="secondary" className="text-xs">
                                {CATEGORY_LABELS[mainTransaction.category]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {mainTransaction.installments}x
                              </Badge>
                              {mainTransaction.credit_cards && (
                                <Badge variant="default" className="text-xs gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {mainTransaction.credit_cards.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Total: R$ {totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <p className="font-bold text-destructive">
                            - R$ {totalAmount.toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInstallmentGroup(group.transactions);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20">
                        {group.transactions.map((installment) => (
                          <div
                            key={installment.id}
                            className="flex items-center justify-between p-3 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Badge variant="outline" className="text-xs">
                                {installment.current_installment}/{installment.installments}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{installment.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(installment.date).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-destructive">
                              R$ {installment.amount.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            }

            // Transação única
            return (
              <div
                key={group.key}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-full ${
                    mainTransaction.type === "income" ? "bg-success/10" : "bg-destructive/10"
                  }`}>
                    {mainTransaction.type === "income" ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{mainTransaction.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[mainTransaction.category]}
                      </Badge>
                      {mainTransaction.credit_cards && (
                        <Badge variant="default" className="text-xs gap-1">
                          <CreditCard className="h-3 w-3" />
                          {mainTransaction.credit_cards.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(mainTransaction.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-bold ${
                    mainTransaction.type === "income" ? "text-success" : "text-destructive"
                  }`}>
                    {mainTransaction.type === "income" ? "+" : "-"} R$ {mainTransaction.amount.toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(mainTransaction.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
