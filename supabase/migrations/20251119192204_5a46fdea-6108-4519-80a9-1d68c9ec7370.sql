-- Add target_quantity field to investments table
ALTER TABLE public.investments
ADD COLUMN target_quantity numeric DEFAULT 0;