# Especificação da API REST para Backend Java Spring

Este documento descreve os endpoints que o backend Java Spring precisa implementar para funcionar com o frontend EVOLVIA.

## URL Base
```
http://localhost:8080/api
```

Configure a variável de ambiente `VITE_API_URL` no frontend para apontar para seu backend.

---

## Configuração do PostgreSQL

### application.properties (Spring Boot)
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/evolvia
spring.datasource.username=postgres
spring.datasource.password=sua_senha
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true

# JWT
jwt.secret=sua_chave_secreta_256_bits
jwt.expiration=604800000
```

### Criação do Banco de Dados
```sql
-- Criar banco
CREATE DATABASE evolvia;

-- Conectar ao banco
\c evolvia

-- Criar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Script de Inicialização Completo (schema.sql)
```sql
-- Criar tipos ENUM
CREATE TYPE investment_type AS ENUM (
  'stock', 'fii', 'etf', 'bdr', 'treasury', 'crypto', 'fixed_income', 'other'
);

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TYPE transaction_category AS ENUM (
  'salary', 'freelance', 'investment', 'other_income',
  'food', 'transport', 'housing', 'entertainment', 'health',
  'education', 'shopping', 'other_expense', 'credit_card',
  'meal_voucher', 'utilities', 'insurance', 'subscription',
  'personal_care', 'gifts', 'travel', 'clothing',
  'home_maintenance', 'fuel', 'groceries', 'school', 'leisure',
  'internet', 'phone'
);

-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  birth_date DATE,
  location VARCHAR(255),
  avatar_url TEXT,
  theme VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cartões de crédito
CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  card_limit DECIMAL(10,2) DEFAULT 0,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  color VARCHAR(20) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  installments INTEGER DEFAULT 1,
  current_installment INTEGER DEFAULT 1,
  parent_transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas de corretoras
CREATE TABLE broker_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_name VARCHAR(100) NOT NULL,
  account_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de investimentos
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  type investment_type NOT NULL,
  quantity DECIMAL(15,8) NOT NULL,
  average_price DECIMAL(15,4) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_quantity DECIMAL(15,8) DEFAULT 0,
  total_value DECIMAL(15,2),
  broker VARCHAR(100),
  broker_account_id UUID REFERENCES broker_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  maturity_date DATE,
  rate DECIMAL(8,4),
  indexer VARCHAR(50),
  issuer VARCHAR(100),
  bond_type VARCHAR(50),
  daily_liquidity BOOLEAN DEFAULT FALSE,
  payment_form VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações de investimentos
CREATE TABLE investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  broker_account_id UUID REFERENCES broker_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dividendos recebidos
CREATE TABLE dividends_received (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(20) DEFAULT 'Dividendo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de orçamentos
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category transaction_category NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, month, year)
);

-- Tabela de metas financeiras
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_ticker ON investments(ticker);
CREATE INDEX idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX idx_dividends_received_user_id ON dividends_received(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_accounts_updated_at BEFORE UPDATE ON broker_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_transactions_updated_at BEFORE UPDATE ON investment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividends_received_updated_at BEFORE UPDATE ON dividends_received
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Autenticação

### POST /auth/register
Registra um novo usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "full_name": "Nome Completo",
  "birth_date": "1990-01-01",
  "location": "São Paulo, SP"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "jwt-token"
}
```

### POST /auth/login
Autentica um usuário existente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "jwt-token"
}
```

### GET /auth/user
Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### POST /auth/logout
Invalida o token (opcional, JWT geralmente é stateless).

---

## CRUD Genérico

O frontend espera endpoints REST padrão para cada tabela. Todos requerem `Authorization: Bearer <token>`.

### Tabelas

- `transactions` - Transações financeiras
- `investments` - Investimentos
- `investment_transactions` - Transações de investimentos
- `credit_cards` - Cartões de crédito
- `budgets` - Orçamentos
- `financial_goals` - Metas financeiras
- `broker_accounts` - Contas de corretoras
- `dividends_received` - Dividendos recebidos
- `profiles` - Perfis de usuários

### Endpoints por Tabela

#### GET /{table}
Lista registros com filtros opcionais.

**Query Params:**
- `{field}=value` - Filtro de igualdade
- `{field}.neq=value` - Diferente de
- `{field}.gt=value` - Maior que
- `{field}.gte=value` - Maior ou igual
- `{field}.lt=value` - Menor que
- `{field}.lte=value` - Menor ou igual
- `{field}.in=val1,val2` - Está na lista
- `order={field}.asc|desc` - Ordenação
- `limit=N` - Limite de registros
- `offset=N` - Pular N registros
- `single=true` - Retornar apenas 1 registro

**Response:** Array de objetos ou objeto único se `single=true`

#### GET /{table}/{id}
Retorna um registro específico.

#### POST /{table}
Cria um novo registro.

**Request Body:** Objeto com campos da tabela

**Response:** Objeto criado com ID

#### PUT /{table}/{id}
Atualiza um registro existente.

#### DELETE /{table}/{id}
Remove um registro.

#### POST /{table}/delete-multiple
Remove múltiplos registros.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2"]
}
```

---

## Endpoints Especiais

### PATCH /investments/ticker/{ticker}
Atualiza investimento pelo ticker.

### POST /functions/{functionName}
Executa funções serverless (Edge Functions equivalentes).

**Functions implementadas:**
- `get-quote` - Busca cotação de ativo
- `get-dividends` - Busca dividendos de ativo
- `get-treasury-bonds` - Lista títulos do Tesouro
- `search-tickers` - Busca tickers
- `sync-dividends` - Sincroniza dividendos
- `suggest-goals` - Sugere metas financeiras (IA)

---

## Schemas das Tabelas

### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'income' | 'expense'
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  credit_card_id UUID,
  installments INTEGER,
  current_installment INTEGER,
  parent_transaction_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### investments
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'stock'|'fii'|'etf'|'bdr'|'treasury'|'crypto'|'fixed_income'|'other'
  quantity DECIMAL(15,8) NOT NULL,
  average_price DECIMAL(15,4) NOT NULL,
  purchase_date DATE NOT NULL,
  target_quantity DECIMAL(15,8),
  total_value DECIMAL(15,2),
  broker VARCHAR(100),
  broker_account_id UUID,
  notes TEXT,
  maturity_date DATE,
  rate DECIMAL(8,4),
  indexer VARCHAR(50),
  issuer VARCHAR(100),
  bond_type VARCHAR(50),
  daily_liquidity BOOLEAN,
  payment_form VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name VARCHAR(255),
  birth_date DATE,
  location VARCHAR(255),
  avatar_url TEXT,
  theme VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### credit_cards
```sql
CREATE TABLE credit_cards (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  card_limit DECIMAL(10,2) DEFAULT 0,
  due_day INTEGER NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### budgets
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### financial_goals
```sql
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### broker_accounts
```sql
CREATE TABLE broker_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_name VARCHAR(100) NOT NULL,
  account_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### investment_transactions
```sql
CREATE TABLE investment_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'buy' | 'sell'
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  transaction_date DATE NOT NULL,
  broker_account_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### dividends_received
```sql
CREATE TABLE dividends_received (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  payment_date DATE NOT NULL,
  type VARCHAR(20) DEFAULT 'Dividendo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Exemplo de Implementação Spring Boot

### Application.java
```java
@SpringBootApplication
public class EvolviaApplication {
    public static void main(String[] args) {
        SpringApplication.run(EvolviaApplication.class, args);
    }
}
```

### SecurityConfig.java
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .authorizeHttpRequests()
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("*"));
        config.setAllowedMethods(List.of("*"));
        config.setAllowedHeaders(List.of("*"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### Dependências Maven
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
</dependencies>
```

---

## Configuração do Frontend

Adicione ao arquivo `.env` ou `.env.local`:

```env
VITE_API_URL=http://localhost:8080/api
```

O frontend já está configurado para usar essa variável. Se não estiver definida, usa `http://localhost:8080/api` como padrão.
