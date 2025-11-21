import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  investment_id: string;
  type: string;
  quantity: number;
  price: number;
  total_amount: number;
  transaction_date: string;
  notes?: string;
  investments: {
    ticker: string;
  };
}

export const InvestmentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: 0,
    price: 0,
    transaction_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("investment_transactions")
        .select(`
          *,
          investments (
            ticker
          )
        `)
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      quantity: transaction.quantity,
      price: transaction.price,
      transaction_date: transaction.transaction_date,
      notes: transaction.notes || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      const total_amount = editForm.quantity * editForm.price;
      
      const { error } = await supabase
        .from("investment_transactions")
        .update({
          quantity: editForm.quantity,
          price: editForm.price,
          total_amount,
          transaction_date: editForm.transaction_date,
          notes: editForm.notes,
        })
        .eq("id", editingTransaction.id);

      if (error) throw error;

      toast.success("Lançamento atualizado!");
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este lançamento?")) return;

    try {
      const { error } = await supabase
        .from("investment_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Lançamento deletado!");
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum lançamento registrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {transaction.type === "buy" ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {transaction.investments.ticker}
                        </span>
                        <Badge variant={transaction.type === "buy" ? "default" : "destructive"}>
                          {transaction.type === "buy" ? "Compra" : "Venda"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.quantity} x R$ {transaction.price.toFixed(2)}
                      </div>
                      {transaction.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {transaction.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      R$ {transaction.total_amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.transaction_date).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantidade</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Preço</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.transaction_date}
                onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Observações opcionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTransaction(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
