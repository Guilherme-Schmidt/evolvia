import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [location, setLocation] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações para signup
    if (!isLogin) {
      if (email !== emailConfirm) {
        toast.error("Os emails não coincidem");
        return;
      }
      
      if (password !== passwordConfirm) {
        toast.error("As senhas não coincidem");
        return;
      }

      if (!fullName || !birthDate || !location) {
        toast.error("Por favor, preencha todos os campos");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        onSuccess?.();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              birth_date: birthDate,
              location: location,
            },
          },
        });

        if (error) throw error;
        toast.success("Conta criada com sucesso! Verifique seu email.");
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar requisição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {isLogin ? "Entrar" : "Criar conta"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Entre com suas credenciais para acessar sua conta"
            : "Preencha os dados abaixo para criar sua conta"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Cidade, Estado"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="emailConfirm">Confirme o email</Label>
              <Input
                id="emailConfirm"
                type="email"
                placeholder="seu@email.com"
                value={emailConfirm}
                onChange={(e) => setEmailConfirm(e.target.value)}
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirme a senha</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required={!isLogin}
                disabled={loading}
                minLength={6}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : isLogin ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
            disabled={loading}
          >
            {isLogin
              ? "Não tem uma conta? Criar conta"
              : "Já tem uma conta? Entrar"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
