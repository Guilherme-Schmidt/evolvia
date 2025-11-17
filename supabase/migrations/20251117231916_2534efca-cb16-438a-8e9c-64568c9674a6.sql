-- Create investment_transactions table for tracking buy/sell history
CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  total_amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own investment transactions"
ON public.investment_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment transactions"
ON public.investment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment transactions"
ON public.investment_transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment transactions"
ON public.investment_transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investment_transactions_updated_at
BEFORE UPDATE ON public.investment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_investment_transactions_user_id ON public.investment_transactions(user_id);
CREATE INDEX idx_investment_transactions_investment_id ON public.investment_transactions(investment_id);
CREATE INDEX idx_investment_transactions_date ON public.investment_transactions(transaction_date);