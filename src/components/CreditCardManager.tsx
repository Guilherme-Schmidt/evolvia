import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Trash2, Plus, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreditCardData {
  id: string;
  name: string;
  card_limit: number;
  due_day: number;
  color: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  credit_card_id: string | null;
  date: string;
}

export const CreditCardManager = () => {
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    card_limit: '',
    due_day: '',
    color: '#3b82f6',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCards();
    fetchTransactions();
  }, []);

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao carregar cartões',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setCards(data || []);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, type, credit_card_id, date')
      .eq('type', 'expense');

    if (error) {
      console.error('Erro ao carregar transações:', error);
      return;
    }

    setTransactions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('credit_cards').insert({
      user_id: user.id,
      name: formData.name,
      card_limit: parseFloat(formData.card_limit),
      due_day: parseInt(formData.due_day),
      color: formData.color,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao criar cartão',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Cartão criado com sucesso!',
    });

    setFormData({ name: '', card_limit: '', due_day: '', color: '#3b82f6' });
    setIsOpen(false);
    fetchCards();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao deletar cartão',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Cartão deletado com sucesso!',
    });

    fetchCards();
  };

  const getCardSpent = (cardId: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions
      .filter((t) => {
        if (t.credit_card_id !== cardId) return false;
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  };

  const checkDueNotification = (dueDay: number) => {
    const today = new Date().getDate();
    return today === dueDay;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cartões de Crédito</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cartão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Cartão</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Nubank Gold"
                  required
                />
              </div>
              <div>
                <Label htmlFor="limit">Limite (R$)</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  value={formData.card_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, card_limit: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="due_day">Dia do Vencimento</Label>
                <Input
                  id="due_day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.due_day}
                  onChange={(e) =>
                    setFormData({ ...formData, due_day: e.target.value })
                  }
                  placeholder="1-31"
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Salvando...' : 'Salvar Cartão'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const spent = getCardSpent(card.id);
          const remaining = card.card_limit - spent;
          const percentage = (spent / card.card_limit) * 100;
          const isDueToday = checkDueNotification(card.due_day);

          return (
            <Card key={card.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard
                    className="h-6 w-6"
                    style={{ color: card.color }}
                  />
                  <h3 className="font-semibold text-lg">{card.name}</h3>
                </div>
                <div className="flex gap-2">
                  {isDueToday && (
                    <Bell className="h-5 w-5 text-yellow-500 animate-pulse" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Gasto</span>
                    <span className="font-medium">
                      R$ {spent.toFixed(2)} / R$ {card.card_limit.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor:
                          percentage > 90
                            ? '#ef4444'
                            : percentage > 70
                            ? '#f59e0b'
                            : card.color,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disponível</span>
                  <span
                    className={`font-medium ${
                      remaining < 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    R$ {remaining.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span className="font-medium">
                    Dia {card.due_day}
                    {isDueToday && (
                      <span className="ml-2 text-yellow-500">HOJE!</span>
                    )}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {cards.length === 0 && (
        <Card className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum cartão cadastrado. Adicione seu primeiro cartão!
          </p>
        </Card>
      )}
    </div>
  );
};
