-- Adicionar novas categorias ao enum transaction_category
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'fuel';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'groceries';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'school';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'leisure';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'internet';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'phone';

-- Criar tabela de orçamentos mensais
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category transaction_category NOT NULL,
  amount NUMERIC NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for budgets
CREATE POLICY "Users can view their own budgets"
ON public.budgets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
ON public.budgets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
ON public.budgets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
ON public.budgets
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();