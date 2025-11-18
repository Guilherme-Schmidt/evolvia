import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreditCard {
  id: string;
  name: string;
  color: string;
}

interface Transaction {
  amount: number;
  date: string;
  credit_card_id: string;
}

export const CreditCardCharts = () => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchCards();
    fetchTransactions();
  }, []);

  const fetchCards = async () => {
    const { data } = await supabase
      .from('credit_cards')
      .select('id, name, color')
      .order('name');

    setCards(data || []);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('amount, date, credit_card_id')
      .eq('type', 'expense')
      .not('credit_card_id', 'is', null)
      .order('date');

    setTransactions(data || []);
  };

  const getChartData = () => {
    const filtered =
      selectedCard === 'all'
        ? transactions
        : transactions.filter((t) => t.credit_card_id === selectedCard);

    const monthlyData = filtered.reduce((acc: any, transaction) => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (!acc[monthYear]) {
        acc[monthYear] = { month: monthYear, total: 0 };
      }

      acc[monthYear].total += parseFloat(transaction.amount.toString());

      return acc;
    }, {});

    return Object.values(monthlyData).slice(-6);
  };

  const getCardComparison = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const cardData = cards.map((card) => {
      const cardTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return (
          t.credit_card_id === card.id &&
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      });

      const total = cardTransactions.reduce(
        (sum, t) => sum + parseFloat(t.amount.toString()),
        0
      );

      return {
        name: card.name,
        total,
        color: card.color,
      };
    });

    return cardData;
  };

  const chartData = getChartData();
  const comparisonData = getCardComparison();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Evolução das Faturas</h2>
        <Select value={selectedCard} onValueChange={setSelectedCard}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione um cartão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cartões</SelectItem>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Total Gasto"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Comparação de Cartões (Mês Atual)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="total" name="Total Gasto" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
