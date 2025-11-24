import { z } from "zod";

// Schema de validação para formulário de investimento
export const investmentFormSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(4, "Ticker deve ter no mínimo 4 caracteres")
    .max(10, "Ticker deve ter no máximo 10 caracteres")
    .regex(/^[A-Z0-9]+$/, "Ticker deve conter apenas letras maiúsculas e números")
    .optional(),
  
  type: z.string().refine(
    (val) => ["stock", "fii", "etf", "bdr", "treasury", "crypto", "fixed_income", "other"].includes(val),
    { message: "Tipo de investimento inválido" }
  ),
  
  quantity: z
    .number()
    .positive("Quantidade deve ser maior que zero")
    .max(1000000, "Quantidade muito alta")
    .optional(),
  
  average_price: z
    .number()
    .positive("Preço deve ser maior que zero")
    .max(1000000, "Preço muito alto")
    .optional(),
  
  target_quantity: z
    .number()
    .nonnegative("Meta não pode ser negativa")
    .max(1000000, "Meta muito alta")
    .optional(),
  
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use formato YYYY-MM-DD)")
    .refine((date) => {
      const purchaseDate = new Date(date);
      const today = new Date();
      return purchaseDate <= today;
    }, "Data de compra não pode ser no futuro"),
  
  notes: z
    .string()
    .max(500, "Notas não podem exceder 500 caracteres")
    .optional(),
  
  broker: z
    .string()
    .trim()
    .max(100, "Nome da corretora não pode exceder 100 caracteres")
    .optional(),
  
  // Campos específicos para Renda Fixa e Tesouro Direto
  issuer: z
    .string()
    .trim()
    .max(100, "Nome do emissor não pode exceder 100 caracteres")
    .optional(),
  
  bond_type: z
    .string()
    .trim()
    .max(50, "Tipo de título não pode exceder 50 caracteres")
    .optional(),
  
  indexer: z
    .string()
    .trim()
    .max(50, "Indexador não pode exceder 50 caracteres")
    .optional(),
  
  rate: z
    .number()
    .nonnegative("Taxa não pode ser negativa")
    .max(1000, "Taxa muito alta")
    .optional(),
  
  payment_form: z
    .string()
    .trim()
    .max(50, "Forma de pagamento não pode exceder 50 caracteres")
    .optional(),
  
  maturity_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use formato YYYY-MM-DD)")
    .optional(),
  
  daily_liquidity: z
    .boolean()
    .optional(),
  
  total_value: z
    .number()
    .positive("Valor total deve ser maior que zero")
    .max(100000000, "Valor muito alto")
    .optional(),
});

// Schema para transação de venda
export const sellTransactionSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(4, "Ticker deve ter no mínimo 4 caracteres")
    .max(10, "Ticker deve ter no máximo 10 caracteres"),
  
  quantity: z
    .number()
    .positive("Quantidade deve ser maior que zero"),
  
  price: z
    .number()
    .positive("Preço deve ser maior que zero"),
  
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  
  notes: z
    .string()
    .max(500, "Notas não podem exceder 500 caracteres")
    .optional(),
});

// Schema para dividendos
export const dividendFormSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(4, "Ticker deve ter no mínimo 4 caracteres")
    .max(10, "Ticker deve ter no máximo 10 caracteres"),
  
  amount: z
    .number()
    .positive("Valor deve ser maior que zero")
    .max(1000000, "Valor muito alto"),
  
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  
  type: z.string().refine(
    (val) => ["Dividendo", "JCP", "Rendimento"].includes(val),
    { message: "Tipo de provento inválido" }
  ),
});

// Schema para conta de corretora
export const brokerAccountSchema = z.object({
  broker_name: z
    .string()
    .trim()
    .min(2, "Nome da corretora deve ter no mínimo 2 caracteres")
    .max(100, "Nome da corretora não pode exceder 100 caracteres"),
  
  account_balance: z
    .number()
    .nonnegative("Saldo não pode ser negativo")
    .max(100000000, "Saldo muito alto"),
});

// Tipos inferidos dos schemas para TypeScript
export type InvestmentFormData = z.infer<typeof investmentFormSchema>;
export type SellTransactionData = z.infer<typeof sellTransactionSchema>;
export type DividendFormData = z.infer<typeof dividendFormSchema>;
export type BrokerAccountData = z.infer<typeof brokerAccountSchema>;
