import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string;
  status: string;
}

export const FinancialGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("savings");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar metas");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("financial_goals").insert({
        user_id: user.id,
        title,
        description: description || null,
        target_amount: parseFloat(targetAmount),
        current_amount: 0,
        deadline: deadline || null,
        category,
      });

      if (error) throw error;

      toast.success("Meta criada com sucesso!");
      setOpen(false);
      resetForm();
      fetchGoals();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar meta");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("financial_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Meta removida");
      fetchGoals();
    } catch (error: any) {
      toast.error("Erro ao remover meta");
    }
  };

  const getAISuggestions = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-goals");
      
      if (error) throw error;
      
      if (data?.suggestions) {
        toast.success("Sugestões recebidas! Escolha uma para adicionar.");
        // Aqui você pode implementar um modal com as sugestões
      }
    } catch (error: any) {
      toast.error("Erro ao obter sugestões");
    } finally {
      setAiLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetAmount("");
    setDeadline("");
    setCategory("savings");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getAISuggestions}
              disabled={aiLoading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {aiLoading ? "Carregando..." : "Sugestões IA"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Meta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Alvo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Criando..." : "Criar Meta"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma meta cadastrada ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <div
                  key={goal.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>R$ {goal.current_amount.toFixed(2)}</span>
                      <span>R$ {goal.target_amount.toFixed(2)}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(1)}% concluído</span>
                      {goal.deadline && (
                        <span>
                          Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};