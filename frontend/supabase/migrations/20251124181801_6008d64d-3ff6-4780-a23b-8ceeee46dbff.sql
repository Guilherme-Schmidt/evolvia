-- Tabela de contas de corretoras
CREATE TABLE IF NOT EXISTS public.broker_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_name TEXT NOT NULL,
  account_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.broker_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para broker_accounts
CREATE POLICY "Users can view their own broker accounts"
  ON public.broker_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own broker accounts"
  ON public.broker_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own broker accounts"
  ON public.broker_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own broker accounts"
  ON public.broker_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Adicionar coluna broker_account_id em investments
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS broker_account_id UUID REFERENCES public.broker_accounts(id);

-- Adicionar coluna broker_account_id em investment_transactions
ALTER TABLE public.investment_transactions 
ADD COLUMN IF NOT EXISTS broker_account_id UUID REFERENCES public.broker_accounts(id);

-- Tabela de dividendos recebidos
CREATE TABLE IF NOT EXISTS public.dividends_received (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'Dividendo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.dividends_received ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para dividends_received
CREATE POLICY "Users can view their own dividends"
  ON public.dividends_received FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dividends"
  ON public.dividends_received FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dividends"
  ON public.dividends_received FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dividends"
  ON public.dividends_received FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_broker_accounts_updated_at
  BEFORE UPDATE ON public.broker_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_dividends_received_updated_at
  BEFORE UPDATE ON public.dividends_received
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();