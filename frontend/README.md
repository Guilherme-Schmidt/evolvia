# Evolvia Frontend

Interface web para a plataforma de gestão financeira Evolvia.

## 🚀 Tecnologias

- **React 18.3.1**
- **TypeScript**
- **Vite 5.4.19**
- **TailwindCSS 3.4.17**
- **shadcn/ui** + Radix UI
- **React Query (TanStack Query)**
- **React Router DOM v6**
- **Recharts** para gráficos

## 📋 Pré-requisitos

- Node.js 20+ ou Bun
- npm ou bun

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
npm install
# ou
bun install
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🏃 Executando o Projeto

### Desenvolvimento

```bash
npm run dev
# ou
bun dev
```

A aplicação estará disponível em: `http://localhost:8080`

### Build para Produção

```bash
npm run build
# ou
bun run build
```

Os arquivos de build estarão em `dist/`.

### Preview do Build

```bash
npm run preview
# ou
bun preview
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
├── contexts/            # React Contexts (Theme, etc)
├── hooks/               # Custom React Hooks
├── integrations/        # Integrações (API client)
│   └── supabase/        # Cliente da API (compatível com Supabase)
├── lib/                 # Utilitários
│   ├── api-client.ts    # Cliente HTTP customizado
│   └── utils.ts         # Funções auxiliares
├── pages/               # Páginas da aplicação
│   ├── Auth.tsx         # Login/Registro
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Investments.tsx  # Gestão de investimentos
│   └── Home.tsx         # Página inicial
├── App.tsx              # Componente raiz
└── main.tsx             # Entry point
```

## 🎨 Componentes UI

O projeto utiliza componentes do **shadcn/ui**, uma biblioteca de componentes baseada em:
- Radix UI (primitivos acessíveis)
- TailwindCSS (estilização)

### Principais Componentes

- `Button`, `Card`, `Input`, `Select`
- `Dialog`, `DropdownMenu`, `Tabs`
- `Table`, `Chart`
- `Toast` (notificações)

## 📡 Integração com API

O frontend se comunica com o backend Spring Boot através do cliente HTTP customizado em `src/lib/api-client.ts`.

### Exemplo de Uso

```typescript
import { supabase } from '@/integrations/supabase/client';

// Login
const { data, error } = await supabase.auth.signIn({
  email: 'user@example.com',
  password: 'password123'
});

// Listar transações
const { data: transactions } = await supabase
  .from('transactions')
  .select('*')
  .order('date', { ascending: false });
```

## 🎯 Funcionalidades

### Autenticação
- Login e registro de usuários
- Gerenciamento de sessão com JWT
- Logout

### Dashboard Financeiro
- Resumo de receitas e despesas
- Gráficos de transações por categoria
- Saldo atual

### Gestão de Transações
- Adicionar receitas e despesas
- Categorização automática
- Filtros por data e tipo
- Parcelamento em cartão de crédito

### Investimentos
- Portfólio de investimentos
- Cotações em tempo real (Yahoo Finance)
- Cálculo de preço médio
- Registro de dividendos

### Metas Financeiras
- Criação de metas de economia
- Acompanhamento de progresso
- Prazos e status

### Orçamentos
- Orçamentos mensais por categoria
- Comparação de gastos vs orçado

## 🧪 Testes

```bash
npm run test
# ou
bun test
```

## 🔧 Lint

```bash
npm run lint
# ou
bun lint
```

## 📝 Licença

Este projeto é privado.
