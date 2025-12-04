import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen = ({ onComplete }: WelcomeScreenProps) => {
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
        setTimeout(onComplete, 2000);
      }
    };

    loadUserProfile();
  }, [onComplete]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center z-50">
        <div className="text-center space-y-4 animate-in fade-in duration-500">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center z-50 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-700">
          Bem-vindo{userName ? `, ${userName}` : ""}!
        </h1>
        <p className="text-lg text-muted-foreground animate-in slide-in-from-bottom-4 duration-700 delay-150">
          Preparando tudo para você...
        </p>
      </div>
    </div>
  );
};
