import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { FinancialSummary } from "@/components/FinancialSummary";
import { FinancialGoals } from "@/components/FinancialGoals";
import { BudgetManager } from "@/components/BudgetManager";
import { CreditCardManager } from "@/components/CreditCardManager";
import { CreditCardCharts } from "@/components/CreditCardCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, Home as HomeIcon, CreditCard, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink } from "@/components/NavLink";
import { toast } from "sonner";

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
  const [userName, setUserName] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [quotes, setQuotes] = useState<{ [key: string]: { regularMarketPrice: number } }>({});
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          credit_cards (
            name
          )
        `)
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

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();
      
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        fetchUserProfile(user.id);
        fetchTransactions();
        fetchInvestments();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUserProfile(session.user.id);
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
                Financeiro
              </h1>
              <p className="text-sm text-muted-foreground">
                Controle suas finanças pessoais
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <HomeIcon className="h-5 w-5" />
              </Button>
              <ThemeToggle />
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
          
          <nav className="flex gap-2 mt-4">
            <NavLink
              to="/dashboard"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent"
              activeClassName="bg-accent"
            >
              Financeiro
            </NavLink>
            <NavLink
              to="/investments"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent"
              activeClassName="bg-accent"
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Investimentos
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="finance" className="space-y-8">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3">
            <TabsTrigger value="finance" className="gap-2">
              Finanças
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Cartões
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              Orçamento e Metas
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

          <TabsContent value="cards" className="space-y-8">
            <CreditCardManager />
            <CreditCardCharts />
          </TabsContent>

          <TabsContent value="budget" className="space-y-8">
            <BudgetManager />
            <FinancialGoals />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
