-- Adicionar novas categorias de transação
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'credit_card';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'meal_voucher';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'utilities';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'insurance';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'subscription';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'personal_care';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'gifts';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'travel';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'clothing';
ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'home_maintenance';