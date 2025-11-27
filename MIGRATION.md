# Guia de Migração: Supabase → PostgreSQL

Este documento descreve a migração completa do Supabase para PostgreSQL standalone com backend Node.js/Express.

## 📋 O que foi migrado

### Backend
- ✅ **Autenticação**: Sistema JWT próprio substituindo Supabase Auth
- ✅ **Banco de Dados**: PostgreSQL standalone com schema completo
- ✅ **API REST**: Express.js com rotas para todas as tabelas
- ✅ **Edge Functions**: Migradas para endpoints do backend
  - `get-quote` → `/api/functions/get-quote`
  - `sync-dividends` → `/api/functions/sync-dividends`
  - `get-historical-dividends` → `/api/functions/get-historical-dividends`

### Frontend
- ✅ **Cliente HTTP**: API Client próprio substituindo `@supabase/supabase-js`
- ✅ **Compatibilidade**: Mantém a mesma interface do Supabase
- ✅ **Query Builder**: Suporta `.select()`, `.eq()`, `.in()`, `.order()`, etc.

## 🚀 Como configurar

### 1. Configurar PostgreSQL

```bash
# Instalar PostgreSQL (se ainda não tiver)
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Criar banco de dados
sudo -u postgres createdb evolvia

# Criar usuário
sudo -u postgres createuser -P evolvia_user
# Digite uma senha quando solicitado

# Dar permissões
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE evolvia TO evolvia_user;"
```

### 2. Executar o schema

```bash
# Conectar ao banco e executar o schema
psql -U evolvia_user -d evolvia -f server/schema.sql
```

### 3. Configurar variáveis de ambiente

#### Backend (`server/.env`)

```bash
cd server
cp .env.example .env
```

Edite `server/.env`:
```env
DATABASE_URL=postgresql://evolvia_user:sua_senha@localhost:5432/evolvia
JWT_SECRET=gere-uma-chave-secreta-forte-aqui
PORT=3001
NODE_ENV=development
```

#### Frontend (`.env`)

```bash
cp .env.example .env
```

Edite `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Instalar dependências

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 5. Executar a aplicação

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

## 📊 Migração de Dados

Se você já tem dados no Supabase, você pode exportá-los:

### Exportar dados do Supabase

```bash
# Usando o CLI do Supabase
supabase db dump -f supabase_dump.sql

# Ou via pgAdmin/psql conectando no Supabase
```

### Importar para PostgreSQL local

```bash
# Ajustar o dump removendo referências ao schema auth
sed 's/auth\.users/users/g' supabase_dump.sql > adjusted_dump.sql

# Importar
psql -U evolvia_user -d evolvia -f adjusted_dump.sql
```

## 🔄 Mudanças no Código

### Autenticação

**Antes (Supabase):**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

**Depois (API própria):**
```typescript
// O código permanece o mesmo!
// O client foi substituído internamente
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

### Queries

**Antes e Depois (mesma interface):**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('type', 'income')
  .order('date', { ascending: false });
```

### Functions

**Antes (Supabase):**
```typescript
const { data, error } = await supabase.functions.invoke('get-quote', {
  body: { ticker: 'PETR4' }
});
```

**Depois (API própria):**
```typescript
// O código permanece o mesmo!
const { data, error } = await supabase.functions.invoke('get-quote', {
  body: { ticker: 'PETR4' }
});
```

## 🗺️ Estrutura do Projeto

```
evolvia/
├── server/                      # Backend Node.js/Express
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # Configuração PostgreSQL
│   │   ├── controllers/         # Controladores da API
│   │   │   ├── authController.js
│   │   │   ├── transactionsController.js
│   │   │   ├── investmentsController.js
│   │   │   └── genericController.js
│   │   ├── middleware/
│   │   │   └── auth.js          # Middleware JWT
│   │   ├── routes/              # Rotas da API
│   │   │   ├── auth.js
│   │   │   ├── transactions.js
│   │   │   ├── investments.js
│   │   │   ├── functions.js
│   │   │   └── generic.js
│   │   ├── services/            # Serviços (ex: cotações)
│   │   │   ├── quoteService.js
│   │   │   └── dividendsService.js
│   │   └── index.js             # Servidor principal
│   ├── schema.sql               # Schema do PostgreSQL
│   ├── package.json
│   └── .env
├── src/
│   ├── lib/
│   │   └── api-client.ts        # Cliente HTTP (substitui Supabase)
│   └── integrations/supabase/
│       └── client.ts            # Exporta apiClient como supabase
├── .env
└── package.json
```

## 🔐 Segurança

### Tokens JWT
- Tokens expiram em 7 dias
- Armazenados no localStorage
- Verificados em todas as requisições protegidas

### Variáveis de Ambiente
- **NUNCA** commite arquivos `.env`
- Use `.env.example` como template
- Gere um JWT_SECRET forte: `openssl rand -base64 32`

## 📝 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/user` - Obter usuário atual
- `POST /api/auth/logout` - Logout

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `DELETE /api/transactions/:id` - Deletar transação

### Investimentos
- `GET /api/investments` - Listar investimentos
- `POST /api/investments` - Criar investimento
- `PUT /api/investments/:id` - Atualizar investimento
- `DELETE /api/investments/:id` - Deletar investimento

### Funções
- `POST /api/functions/get-quote` - Buscar cotação
- `POST /api/functions/sync-dividends` - Sincronizar dividendos
- `POST /api/functions/get-historical-dividends` - Histórico de dividendos

### Tabelas Genéricas
Todas seguem o padrão CRUD:
- `/api/credit-cards`
- `/api/budgets`
- `/api/financial-goals`
- `/api/broker-accounts`
- `/api/dividends`
- `/api/treasury-bonds`

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solução**: Verifique se o PostgreSQL está rodando:
```bash
sudo service postgresql status
sudo service postgresql start
```

### Erro de autenticação no banco
```
Error: password authentication failed
```
**Solução**: Verifique o `DATABASE_URL` no `.env` do servidor.

### Token inválido no frontend
```
Error: Token inválido
```
**Solução**: Faça logout e login novamente. O token pode ter expirado.

### CORS Error
```
Access to fetch at 'http://localhost:3001/api/...' has been blocked by CORS
```
**Solução**: Verifique se o backend está rodando na porta 3001.

## ✅ Checklist de Migração

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `evolvia` criado
- [ ] Schema executado com sucesso
- [ ] Backend `.env` configurado
- [ ] Frontend `.env` configurado
- [ ] Dependências instaladas (backend + frontend)
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando
- [ ] Teste de login/registro funcionando
- [ ] Teste de criação de transação funcionando

## 📦 Remover Supabase (Opcional)

Após confirmar que tudo está funcionando:

```bash
# Remover dependência do Supabase
npm uninstall @supabase/supabase-js

# Remover pastas não utilizadas
rm -rf supabase/
rm -rf src/integrations/supabase/types.ts
```

**Nota**: Mantenha `src/integrations/supabase/client.ts` - ele agora exporta o novo cliente API.

## 🎯 Próximos Passos

1. **Deploy do Backend**: Configure em um servidor (Heroku, Railway, DigitalOcean, etc.)
2. **Deploy do PostgreSQL**: Use um PostgreSQL gerenciado (AWS RDS, DigitalOcean Databases, etc.)
3. **SSL/HTTPS**: Configure certificados SSL para produção
4. **Variáveis de Produção**: Atualize `.env` com URLs de produção
5. **Backups**: Configure backups automáticos do PostgreSQL

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do backend: `cd server && npm run dev`
2. Verifique o console do navegador (F12)
3. Confirme que ambos backend e frontend estão rodando
4. Verifique a conectividade com o PostgreSQL

---

**Migração concluída com sucesso! 🎉**
