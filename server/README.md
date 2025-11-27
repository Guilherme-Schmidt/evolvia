# Evolvia Backend API

Backend Node.js/Express com PostgreSQL para o Evolvia.

## 🚀 Quick Start

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar PostgreSQL

Certifique-se de ter o PostgreSQL instalado e rodando.

```bash
# Criar banco de dados
createdb evolvia

# Executar schema
psql -d evolvia -f schema.sql
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas configurações:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/evolvia
JWT_SECRET=your-secret-key-here
PORT=3001
NODE_ENV=development
```

### 4. Executar

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

## 📚 Documentação da API

### Autenticação

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer <token>
```

#### POST /api/auth/register
Registrar novo usuário.

**Body:**
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
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/login
Login de usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "jwt-token"
}
```

#### GET /api/auth/user
Obter dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Transações

#### GET /api/transactions
Listar transações do usuário.

**Query Parameters:**
- `limit` (opcional): Número de resultados
- `offset` (opcional): Paginação
- `type` (opcional): income | expense
- `category` (opcional): categoria da transação

#### POST /api/transactions
Criar nova transação.

**Body:**
```json
{
  "title": "Salário",
  "amount": 5000.00,
  "type": "income",
  "category": "salary",
  "date": "2024-01-01",
  "description": "Salário mensal",
  "credit_card_id": null,
  "installments": null,
  "current_installment": null
}
```

#### DELETE /api/transactions/:id
Deletar transação.

### Investimentos

#### GET /api/investments
Listar investimentos.

#### POST /api/investments
Criar investimento.

**Body:**
```json
{
  "ticker": "PETR4",
  "type": "stock",
  "quantity": 100,
  "average_price": 30.50,
  "target_quantity": 200
}
```

#### PUT /api/investments/:id
Atualizar investimento.

#### PATCH /api/investments/ticker/:ticker
Atualizar investimento por ticker.

#### DELETE /api/investments/:id
Deletar investimento.

### Funções

#### POST /api/functions/get-quote
Buscar cotação de ativo.

**Body:**
```json
{
  "ticker": "PETR4"
}
```

**Response:**
```json
{
  "results": [
    {
      "ticker": "PETR4",
      "regularMarketPrice": 30.50,
      "regularMarketChange": 0.50,
      "regularMarketChangePercent": 1.67,
      "currency": "BRL"
    }
  ]
}
```

#### POST /api/functions/sync-dividends
Sincronizar dividendos de um ticker.

**Body:**
```json
{
  "ticker": "PETR4"
}
```

#### POST /api/functions/get-historical-dividends
Buscar histórico de dividendos.

**Body:**
```json
{
  "ticker": "PETR4",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Rotas Genéricas (CRUD)

Todas seguem o mesmo padrão:

- GET `/api/:table` - Listar todos
- GET `/api/:table/:id` - Obter por ID
- POST `/api/:table` - Criar
- PUT `/api/:table/:id` - Atualizar
- DELETE `/api/:table/:id` - Deletar

**Tabelas disponíveis:**
- `credit-cards`
- `budgets`
- `financial-goals`
- `broker-accounts`
- `dividends`
- `treasury-bonds`

## 🗄️ Estrutura do Banco de Dados

### Tabelas principais:
- `users` - Usuários
- `transactions` - Transações financeiras
- `investments` - Investimentos
- `investment_transactions` - Transações de investimentos
- `credit_cards` - Cartões de crédito
- `budgets` - Orçamentos
- `financial_goals` - Metas financeiras
- `broker_accounts` - Contas de corretoras
- `dividends` - Dividendos recebidos
- `treasury_bonds` - Títulos do tesouro

Veja `schema.sql` para detalhes completos.

## 🔧 Desenvolvimento

### Estrutura de Pastas

```
src/
├── config/
│   └── database.js       # Configuração PostgreSQL
├── controllers/          # Lógica de negócio
├── middleware/           # Middlewares (auth, etc)
├── routes/               # Definição de rotas
├── services/             # Serviços externos (APIs)
└── index.js              # Servidor principal
```

### Adicionar Nova Rota

1. Criar controller em `src/controllers/`
2. Criar rota em `src/routes/`
3. Registrar rota em `src/index.js`

### Exemplo:

```javascript
// src/controllers/exampleController.js
import { query } from '../config/database.js';

export const getExamples = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM examples WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar examples' });
  }
};

// src/routes/examples.js
import express from 'express';
import { getExamples } from '../controllers/exampleController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/', getExamples);

export default router;

// src/index.js
import examplesRoutes from './routes/examples.js';
app.use('/api/examples', examplesRoutes);
```

## 📊 Logging

O servidor loga automaticamente:
- Requisições HTTP (método, path, timestamp)
- Queries SQL (query, duração, rows afetadas)
- Erros

## 🔒 Segurança

- Senhas hashadas com bcrypt (salt rounds: 10)
- JWT com expiração de 7 dias
- Proteção CORS ativada
- Validação de inputs com express-validator
- SQL Injection protection via prepared statements

## 🚀 Deploy

### Railway / Render / Heroku

1. Configure as variáveis de ambiente
2. Configure o PostgreSQL
3. Execute as migrations: `psql $DATABASE_URL -f schema.sql`
4. Deploy!

### Docker (opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "src/index.js"]
```

## 📝 Scripts Disponíveis

- `npm run dev` - Desenvolvimento com hot reload (nodemon)
- `npm start` - Produção

## 🐛 Troubleshooting

### Conexão com PostgreSQL falha
- Verifique se o PostgreSQL está rodando
- Confirme DATABASE_URL no .env
- Teste conexão: `psql $DATABASE_URL`

### Erro 401 Unauthorized
- Verifique se o token JWT está sendo enviado
- Confirme que o JWT_SECRET está correto
- Token pode ter expirado (7 dias)

### Erro 500 Internal Server Error
- Verifique logs do servidor
- Confirme que o schema foi executado
- Verifique permissões do banco

## 📄 Licença

MIT
