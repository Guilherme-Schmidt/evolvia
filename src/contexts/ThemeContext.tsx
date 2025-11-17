import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("theme")
          .eq("user_id", user.id)
          .single();
        
        if (data?.theme) {
          setTheme(data.theme as Theme);
          document.documentElement.classList.toggle("dark", data.theme === "dark");
        }
      }
      setLoading(false);
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ theme: newTheme })
        .eq("user_id", user.id);
    }
  };

  if (loading) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};