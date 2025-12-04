import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BrokerAccount {
  id: string;
  broker_name: string;
  account_balance: number;
}

export const BrokerAccountManager = () => {
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    broker_name: "",
    account_balance: "",
  });

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("broker_accounts")
        .select("*")
        .order("broker_name", { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contas");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("broker_accounts")
        .insert([{
          user_id: user.id,
          broker_name: formData.broker_name,
          account_balance: Number(formData.account_balance),
        }]);

      if (error) throw error;

      toast.success("Conta adicionada com sucesso!");
      setFormData({ broker_name: "", account_balance: "" });
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("broker_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Conta removida com sucesso!");
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gerenciar Contas de Corretoras
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adicione suas contas para controlar saldo disponível
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="broker_name">Nome da Corretora</Label>
              <Input
                id="broker_name"
                value={formData.broker_name}
                onChange={(e) =>
                  setFormData({ ...formData, broker_name: e.target.value })
                }
                placeholder="Ex: Clear, XP, Rico"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_balance">Saldo Disponível (R$)</Label>
              <Input
                id="account_balance"
                type="number"
                step="0.01"
                value={formData.account_balance}
                onChange={(e) =>
                  setFormData({ ...formData, account_balance: e.target.value })
                }
                placeholder="Ex: 5000.00"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Adicionando..." : "Adicionar Conta"}
          </Button>
        </form>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Contas Cadastradas</h3>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma conta cadastrada
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{account.broker_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: R$ {Number(account.account_balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(account.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
