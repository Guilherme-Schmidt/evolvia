-- Add fields for fixed income and treasury investments
ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS issuer TEXT,
ADD COLUMN IF NOT EXISTS bond_type TEXT,
ADD COLUMN IF NOT EXISTS indexer TEXT,
ADD COLUMN IF NOT EXISTS rate NUMERIC,
ADD COLUMN IF NOT EXISTS payment_form TEXT,
ADD COLUMN IF NOT EXISTS maturity_date DATE,
ADD COLUMN IF NOT EXISTS daily_liquidity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_value NUMERIC;

COMMENT ON COLUMN public.investments.issuer IS 'Emissor do título (para renda fixa)';
COMMENT ON COLUMN public.investments.bond_type IS 'Tipo de título (LCI, LCA, CDB, etc)';
COMMENT ON COLUMN public.investments.indexer IS 'Indexador (CDI, IPCA, Prefixado, etc)';
COMMENT ON COLUMN public.investments.rate IS 'Taxa ou percentual do indexador';
COMMENT ON COLUMN public.investments.payment_form IS 'Forma de pagamento (Pós-fixado, Pré-fixado, etc)';
COMMENT ON COLUMN public.investments.maturity_date IS 'Data de vencimento do título';
COMMENT ON COLUMN public.investments.daily_liquidity IS 'Indica se tem liquidez diária';
COMMENT ON COLUMN public.investments.total_value IS 'Valor total investido (para renda fixa que não usa quantidade)';