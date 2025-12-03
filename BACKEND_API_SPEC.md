# Especificação da API REST para Backend Java Spring

Este documento descreve os endpoints que o backend Java Spring precisa implementar para funcionar com o frontend EVOLVIA.

## URL Base
```
http://localhost:8080/api
```

Configure a variável de ambiente `VITE_API_URL` no frontend para apontar para seu backend.

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
