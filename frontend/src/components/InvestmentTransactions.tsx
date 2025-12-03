import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export const InvestmentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const [editForm, setEditForm] = useState({
    quantity: 0,
    price: 0,
    transaction_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchTransactions();

    // Listen for real-time updates
    const channel = supabase
      .channel('investment-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investment_transactions'
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage]);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total count
      const { count } = await supabase
        .from("investment_transactions")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error } = await supabase
        .from("investment_transactions")
        .select(`
          *,
          investments (
            ticker
          )
        `)
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .range(from, to);

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
      setCurrentPage(1);
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
      setCurrentPage(1);
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
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Histórico de Lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                Nenhum lançamento registrado ainda.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Seus lançamentos de compra e venda aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className={`overflow-hidden transition-all hover:shadow-md ${
                    transaction.type === "buy" 
                      ? "border-l-4 border-l-green-500" 
                      : "border-l-4 border-l-red-500"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === "buy" 
                            ? "bg-green-500/10" 
                            : "bg-red-500/10"
                        }`}>
                          {transaction.type === "buy" ? (
                            <TrendingUp className={`h-5 w-5 ${
                              transaction.type === "buy" ? "text-green-600" : "text-red-600"
                            }`} />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg">
                              {transaction.investments.ticker}
                            </span>
                            <Badge 
                              variant={transaction.type === "buy" ? "default" : "destructive"}
                              className="font-medium"
                            >
                              {transaction.type === "buy" ? "Compra" : "Venda"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(transaction.transaction_date)}</span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="font-medium">
                              {transaction.quantity} {transaction.quantity === 1 ? 'unidade' : 'unidades'}
                            </span>
                            <span>×</span>
                            <span className="font-medium">
                              R$ {transaction.price.toFixed(2)}
                            </span>
                          </div>

                          {transaction.notes && (
                            <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded">
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">
                            Total
                          </div>
                          <div className={`font-bold text-lg ${
                            transaction.type === "buy" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "sell" && "+"} R$ {transaction.total_amount.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalCount > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} lançamentos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(totalCount / itemsPerPage);
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      </>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
                >
                  Próxima
                </Button>
              </div>
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
