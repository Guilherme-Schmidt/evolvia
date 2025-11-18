import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  Dumbbell, 
  Apple, 
  Calendar,
  ClipboardList,
  LogOut,
  User
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        }
      }
    };
    
    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const modules = [
    {
      title: "Financeiro",
      description: "Gerencie suas transações e investimentos",
      icon: DollarSign,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      path: "/dashboard",
    },
    {
      title: "Investimentos",
      description: "Acompanhe sua carteira de investimentos",
      icon: TrendingUp,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      path: "/dashboard?tab=investments",
    },
    {
      title: "Academia",
      description: "Controle seus treinos e evolução",
      icon: Dumbbell,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      path: "/gym",
      disabled: true,
    },
    {
      title: "Nutrição",
      description: "Planeje suas refeições",
      icon: Apple,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      path: "/nutrition",
      disabled: true,
    },
    {
      title: "Rotina",
      description: "Organize suas tarefas diárias",
      icon: ClipboardList,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      path: "/routine",
      disabled: true,
    },
    {
      title: "Agenda",
      description: "Gerencie seus compromissos",
      icon: Calendar,
      color: "text-chart-6",
      bgColor: "bg-chart-6/10",
      path: "/calendar",
      disabled: true,
    },
  ];

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
                Sua plataforma completa
              </p>
            </div>
            <div className="flex items-center gap-3">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Bem-vindo{userName ? `, ${userName}` : ""}!</h2>
            <p className="text-muted-foreground">
              Escolha um módulo para começar
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card
                key={module.title}
                className={`group cursor-pointer transition-all hover:shadow-lg ${
                  module.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => !module.disabled && navigate(module.path)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <module.icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    {module.title}
                    {module.disabled && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Em breve
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;