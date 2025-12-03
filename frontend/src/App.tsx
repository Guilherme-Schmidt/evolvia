import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Investments from "./pages/Investments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Check if user has already seen the welcome screen in this session
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }
  }, []);

  const handleWelcomeComplete = () => {
    sessionStorage.setItem("hasSeenWelcome", "true");
    setShowWelcome(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/home" element={<Home />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
