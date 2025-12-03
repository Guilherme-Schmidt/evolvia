-- Add installment fields to transactions table
ALTER TABLE public.transactions
  ADD COLUMN installments INTEGER DEFAULT 1,
  ADD COLUMN current_installment INTEGER DEFAULT 1,
  ADD COLUMN parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;