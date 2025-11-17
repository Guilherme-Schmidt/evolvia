import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { FinancialSummary } from "@/components/FinancialSummary";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentList } from "@/components/InvestmentList";
import { InvestmentSummary } from "@/components/InvestmentSummary";
import { InvestmentCharts } from "@/components/InvestmentCharts";
import { InvestmentTransactions } from "@/components/InvestmentTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description?: string;
}

interface Investment {
  id: string;
  ticker: string;
  type: string;
  quantity: number;
  average_price: number;
  purchase_date: string;
  notes?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [quotes, setQuotes] = useState<{ [key: string]: { regularMarketPrice: number } }>({});
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar investimentos");
    }
  };

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        fetchTransactions();
        fetchInvestments();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const totalInvested = investments.reduce(
    (sum, inv) => sum + Number(inv.quantity) * Number(inv.average_price),
    0
  );

  const totalCurrent = investments.reduce((sum, inv) => {
    const quote = quotes[inv.ticker];
    const currentValue = quote
      ? Number(inv.quantity) * quote.regularMarketPrice
      : Number(inv.quantity) * Number(inv.average_price);
    return sum + currentValue;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tudo em Um
              </h1>
              <p className="text-sm text-muted-foreground">
                Controle Financeiro
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="finance" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="finance" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="investments" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Investimentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="space-y-8">
            <FinancialSummary
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              totalInvestments={totalCurrent}
            />

            <div className="grid gap-8 lg:grid-cols-2">
              <TransactionForm onSuccess={fetchTransactions} />
              <TransactionList
                transactions={transactions}
                onDelete={fetchTransactions}
              />
            </div>
          </TabsContent>

          <TabsContent value="investments" className="space-y-4">
            <InvestmentForm onSuccess={fetchInvestments} />
            
            <InvestmentSummary
              totalInvested={totalInvested}
              totalCurrent={totalCurrent}
              totalAssets={investments.length}
            />

            <InvestmentCharts
              investments={investments}
              quotes={quotes}
            />

            <InvestmentTransactions />

            <InvestmentList
              investments={investments}
              onDelete={fetchInvestments}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
