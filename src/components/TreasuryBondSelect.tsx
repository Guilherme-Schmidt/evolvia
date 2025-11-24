import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TreasuryBond {
  name: string;
  maturityDate: string;
  buyPrice: number;
  sellPrice: number;
  buyRate: number;
  sellRate: number;
  minInvestment: number;
}

interface TreasuryBondSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onBondSelect?: (bond: TreasuryBond) => void;
}

export const TreasuryBondSelect = ({
  value,
  onValueChange,
  onBondSelect,
}: TreasuryBondSelectProps) => {
  const [bonds, setBonds] = useState<TreasuryBond[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTreasuryBonds();
  }, []);

  const fetchTreasuryBonds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-treasury-bonds");

      if (error) throw error;

      if (data?.bonds) {
        setBonds(data.bonds);
      }
    } catch (error: any) {
      console.error("Error fetching treasury bonds:", error);
      toast.error("Erro ao buscar títulos do Tesouro Direto");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    
    // Encontrar o bond selecionado e passar os dados
    const selectedBond = bonds.find((bond) => {
      const bondIdentifier = `${bond.name} ${new Date(bond.maturityDate).getFullYear()}`;
      return bondIdentifier === newValue;
    });
    
    if (selectedBond && onBondSelect) {
      // Não temos preços da API, então o usuário deverá preencher manualmente
      onBondSelect({
        ...selectedBond,
        buyPrice: 0,
        buyRate: 0,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Carregando títulos disponíveis...
        </span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o título do Tesouro" />
      </SelectTrigger>
      <SelectContent>
        {bonds.map((bond) => {
          const bondIdentifier = `${bond.name} ${new Date(bond.maturityDate).getFullYear()}`;
          const maturityYear = new Date(bond.maturityDate).getFullYear();
          
          return (
            <SelectItem key={bondIdentifier} value={bondIdentifier}>
              <div className="flex flex-col">
                <span className="font-medium">{bond.name}</span>
                <span className="text-xs text-muted-foreground">
                  Vencimento: {new Date(bond.maturityDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </SelectItem>
          );
        })}
        {bonds.length === 0 && (
          <SelectItem value="none" disabled>
            Nenhum título disponível
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
