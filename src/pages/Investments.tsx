import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentList } from "@/components/InvestmentList";
import { InvestmentMetrics } from "@/components/InvestmentMetrics";
import { InvestmentCharts } from "@/components/InvestmentCharts";
import { InvestmentTransactions } from "@/components/InvestmentTransactions";
import { DividendsManager } from "@/components/DividendsManager";
import { InvestmentDashboard } from "@/components/InvestmentDashboard";
import { SnowballCalculator } from "@/components/SnowballCalculator";
import { BrokerAccountManager } from "@/components/BrokerAccountManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, Home as HomeIcon, DollarSign } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink } from "@/components/NavLink";
import { toast } from "sonner";

interface Investment {
  id: string;
  ticker: string;
  type: string;
  quantity: number;
  average_price: number;
  purchase_date: string;
  notes?: string;
}

const Investments = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [quotes, setQuotes] = useState<{ [key: string]: { regularMarketPrice: number } }>({});
  const [totalDividends, setTotalDividends] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
      
      // Buscar dividendos recebidos
      const { data: dividendsData } = await supabase
        .from("dividends_received")
        .select("amount");
      
      const total = dividendsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      setTotalDividends(total);
    } catch (error: any) {
      toast.error("Erro ao carregar investimentos");
    } finally {
      setLoading(false);
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
                Investimentos
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie sua carteira de investimentos
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
              <DollarSign className="h-4 w-4 inline mr-2" />
              Financeiro
            </NavLink>
            <NavLink
              to="/investments"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent"
              activeClassName="bg-accent"
            >
              Investimentos
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="launches" className="space-y-8">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4">
            <TabsTrigger value="launches" className="gap-2">
              Lançamentos
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              Minha Carteira
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2">
              Controles
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              Análises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="launches" className="space-y-8">
            <InvestmentMetrics
              totalInvested={totalInvested}
              totalCurrent={totalCurrent}
              totalDividends={totalDividends}
              totalAssets={investments.length}
            />

            <div className="grid gap-8 lg:grid-cols-2">
              <InvestmentForm onSuccess={fetchInvestments} />
              <InvestmentTransactions />
            </div>

            <BrokerAccountManager />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-8">
            <InvestmentList
              investments={investments}
              onDelete={fetchInvestments}
            />
          </TabsContent>

          <TabsContent value="controls" className="space-y-8">
            <InvestmentDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <SnowballCalculator />

            <InvestmentCharts
              investments={investments}
              quotes={quotes}
            />

            <DividendsManager investments={investments} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Investments;
