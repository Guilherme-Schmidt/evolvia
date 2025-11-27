-- Schema PostgreSQL para Evolvia
-- Migrado do Supabase para PostgreSQL standalone

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE (substitui auth.users do Supabase)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE transaction_category AS ENUM (
  'salary',
  'freelance',
  'investment',
  'other_income',
  'food',
  'transport',
  'housing',
  'entertainment',
  'health',
  'education',
  'shopping',
  'credit_card',
  'meal_voucher',
  'utilities',
  'insurance',
  'subscription',
  'personal_care',
  'gifts',
  'travel',
  'clothing',
  'home_maintenance',
  'other_expense'
);

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TYPE investment_type AS ENUM (
  'stock',
  'fii',
  'etf',
  'bdr',
  'treasury',
  'crypto',
  'fixed_income',
  'other'
);

CREATE TYPE investment_transaction_type AS ENUM ('buy', 'sell');

-- =============================================================================
-- TRANSACTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  credit_card_id UUID,
  installments INTEGER,
  current_installment INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- =============================================================================
-- CREDIT CARDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  credit_limit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL,
  due_day INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);

-- Add foreign key for transactions
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_credit_card
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL;

-- =============================================================================
-- BUDGETS
-- =============================================================================

CREATE TABLE IF NOT EXISTS budgets (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category transaction_category NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month, year)
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);

-- =============================================================================
-- FINANCIAL GOALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);

-- =============================================================================
-- BROKER ACCOUNTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS broker_accounts (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL,
  account_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_broker_accounts_user_id ON broker_accounts(user_id);

-- =============================================================================
-- INVESTMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS investments (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  type investment_type NOT NULL,
  quantity NUMERIC(18, 8) NOT NULL DEFAULT 0,
  average_price NUMERIC(18, 8) NOT NULL DEFAULT 0,
  target_quantity NUMERIC(18, 8) NOT NULL DEFAULT 0,
  total_value NUMERIC(18, 2),
  broker_account_id UUID REFERENCES broker_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_ticker ON investments(ticker);

-- =============================================================================
-- INVESTMENT TRANSACTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  type investment_transaction_type NOT NULL,
  quantity NUMERIC(18, 8) NOT NULL,
  price_per_unit NUMERIC(18, 8) NOT NULL,
  total_amount NUMERIC(18, 2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  broker_account_id UUID REFERENCES broker_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_transactions_investment_id ON investment_transactions(investment_id);
CREATE INDEX idx_investment_transactions_date ON investment_transactions(transaction_date);

-- =============================================================================
-- DIVIDENDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS dividends (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'Dividendo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker, payment_date)
);

CREATE INDEX idx_dividends_user_id ON dividends(user_id);
CREATE INDEX idx_dividends_ticker ON dividends(ticker);
CREATE INDEX idx_dividends_payment_date ON dividends(payment_date);

-- =============================================================================
-- TREASURY BONDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS treasury_bonds (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bond_name TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  invested_amount NUMERIC(10, 2) NOT NULL,
  current_value NUMERIC(10, 2),
  annual_rate NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_treasury_bonds_user_id ON treasury_bonds(user_id);

-- =============================================================================
-- TRIGGERS FOR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_accounts_updated_at
  BEFORE UPDATE ON broker_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_transactions_updated_at
  BEFORE UPDATE ON investment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividends_updated_at
  BEFORE UPDATE ON dividends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treasury_bonds_updated_at
  BEFORE UPDATE ON treasury_bonds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
