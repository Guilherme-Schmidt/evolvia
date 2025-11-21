# 🚀 WhatsApp com Webhook GRATUITO

## 🎯 Solução: Evolution API (Open Source)

**Por que Evolution API?**
- ✅ **100% Gratuito** (open source)
- ✅ WhatsApp **pessoal** (não precisa Business)
- ✅ **Webhook nativo**
- ✅ Deploy grátis (Railway/Render)
- ✅ Fácil de configurar

---

# ESCOLHA SUA OPÇÃO

## 🟢 Opção 1: Direto (Recomendado - Mais Simples)
Webhook → Edge Function → WhatsApp
**Tempo: 10 minutos**

## 🔵 Opção 2: Com n8n Gratuito (Mais Flexível)
Webhook → n8n → Edge Function → WhatsApp
**Tempo: 20 minutos**
**Vantagens**: Interface visual, integrações fáceis, logs detalhados

---

# 🟢 OPÇÃO 1: SETUP DIRETO

## 📱 Passo 1: Deploy da Evolution API

### Opção A: Railway (Recomendado - Mais Fácil)

1. Acesse: https://railway.app/
2. Clique em "Start a New Project"
3. Escolha "Deploy from GitHub repo"
4. Use este template: https://github.com/EvolutionAPI/evolution-api
5. Ou clique aqui para deploy automático

**Configurações importantes:**
```env
AUTHENTICATION_API_KEY=minhaChaveSecreta123
SERVER_URL=https://seu-app.up.railway.app
```

⏱️ Aguarde 3-5 minutos para o deploy completar.

### Opção B: Render (Alternativa Gratuita)

1. Acesse: https://render.com/
2. New → Web Service
3. Conecte o repo: https://github.com/EvolutionAPI/evolution-api
4. Runtime: Docker
5. Configure as mesmas variáveis acima

### Opção C: Self-Hosted (Totalmente Grátis)

```bash
# Clonar repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Rodar com Docker
docker run --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=minhaChaveSecreta123 \
  atendai/evolution-api:latest
```

Acesse: http://localhost:8080

---

## 🔗 Passo 2: Conectar WhatsApp

### 2.1 Criar Instância

**Via cURL:**
```bash
curl -X POST https://seu-app.up.railway.app/instance/create \
-H "apikey: minhaChaveSecreta123" \
-H "Content-Type: application/json" \
-d '{
  "instanceName": "financeiro",
  "webhook": {
    "url": "https://sdjbjcufuiziclxvtcrl.supabase.co/functions/v1/whatsapp-evolution-webhook",
    "enabled": true,
    "events": ["messages.upsert"],
    "webhookByEvents": false,
    "webhookBase64": false,
    "headers": {
      "x-user-id": "SEU_USER_ID_AQUI"
    }
  },
  "qrcode": true
}'
```

**⚠️ IMPORTANTE:** Substitua `SEU_USER_ID_AQUI` pelo seu User ID (veja Passo 3)!

### 2.2 Obter QR Code

**Método 1: Via Browser (Mais Fácil)**
- Acesse: `https://seu-app.up.railway.app/instance/connect/financeiro`
- O QR Code aparecerá na tela
- Escaneie com seu WhatsApp

### 2.3 Escanear com WhatsApp

1. Abra WhatsApp no celular
2. Vá em **⋮** → **Dispositivos Conectados**
3. Clique em **Conectar um dispositivo**
4. Escaneie o QR Code

✅ **Conectado!**

---

## 🔧 Passo 3: Obter seu User ID

Execute no console do navegador (F12):
```javascript
supabase.auth.getUser().then(r => console.log('MEU USER ID:', r.data.user.id))
```

Copie o ID que aparecer.

---

## ✅ Passo 4: Testar

Envie mensagens:
```
Gastei 150 reais no supermercado hoje
Comprei notebook de 3000 em 10x no Nubank
Recebi 5000 de salário
```

A transação será registrada automaticamente! 🎉

---

# 🔵 OPÇÃO 2: COM N8N GRATUITO

Use esta opção para ter controle visual do fluxo e facilitar integrações futuras.

## 🛠️ Passo 1: Instalar n8n (Escolha uma)

### Opção A: n8n Cloud (Gratuito - 5,000 execuções/mês)
1. Acesse [n8n.io](https://n8n.io) e crie conta gratuita
2. Clique em "Create new workflow"
3. Já vem configurado e pronto!

### Opção B: Self-Hosted Docker (Gratuito Ilimitado)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Acesse: `http://localhost:5678`

---

## 📊 Passo 2: Criar Workflow no n8n

### 2.1 Adicionar Webhook Node (Gatilho)
1. No canvas, adicione um **Webhook** node
2. Configurações:
   - **HTTP Method**: POST
   - **Path**: `whatsapp` (ou qualquer nome)
3. **Copie a Webhook URL** gerada
   - Ex: `https://sua-instancia.app.n8n.cloud/webhook/whatsapp`

### 2.2 Adicionar HTTP Request (Processar com AI)
1. Adicione um **HTTP Request** node
2. Conecte ao Webhook
3. Configurações:
   - **Method**: POST
   - **URL**: `https://sdjbjcufuiziclxvtcrl.supabase.co/functions/v1/whatsapp-evolution-webhook`
   - **Send Headers**: ON
   - Headers:
     - `Content-Type`: `application/json`
     - `x-user-id`: `SEU_USER_ID_AQUI` ⚠️ **Substitua!**
   - **Send Body**: ON
   - Body: `{{ JSON.stringify($json) }}`

### 2.3 Adicionar HTTP Request (Responder WhatsApp)
1. Adicione outro **HTTP Request** node
2. Conecte ao node anterior
3. Configurações:
   - **Method**: POST
   - **URL**: `https://sua-evolution-api.com/message/sendText/financeiro`
   - **Send Headers**: ON
   - Headers:
     - `Content-Type`: `application/json`
     - `apikey`: `minhaChaveSecreta123` ⚠️ **Use sua key!**
   - **Send Body**: ON
   - Body:
   ```json
   {
     "number": "{{ $('Webhook').item.json.data.key.remoteJid }}",
     "text": "{{ $('HTTP Request').item.json.message }}"
   }
   ```

### 2.4 Ativar Workflow
- Clique no toggle **Active** no canto superior direito
- Status deve ficar verde: **Active**

---

## 📱 Passo 3: Deploy Evolution API + Conectar

Siga os **Passos 1-3 da Opção 1**, mas com UMA diferença:

**Ao criar a instância** (passo 2.1), use a URL do n8n:

```bash
curl -X POST https://seu-app.up.railway.app/instance/create \
-H "apikey: minhaChaveSecreta123" \
-H "Content-Type: application/json" \
-d '{
  "instanceName": "financeiro",
  "webhook": {
    "url": "https://sua-instancia.app.n8n.cloud/webhook/whatsapp",
    "enabled": true,
    "events": ["messages.upsert"],
    "webhookByEvents": false,
    "webhookBase64": false
  },
  "qrcode": true
}'
```

⚠️ **ATENÇÃO**: 
- URL do webhook agora é do n8n
- **NÃO** adicione o `x-user-id` nos headers aqui (já está no workflow do n8n)

Continue com o resto dos passos da Opção 1.

---

## ✅ Passo 4: Testar

Envie uma mensagem no WhatsApp:
```
Gastei 200 reais de mercado
```

**No n8n**, você verá:
1. Webhook recebeu a mensagem ✅
2. HTTP Request processou com AI ✅
3. HTTP Request enviou resposta ✅

Veja tudo no histórico de execuções! 📊

---

## 🎁 Vantagens do n8n

✅ **Interface visual** - veja o fluxo em tempo real
✅ **Logs detalhados** - debug fácil
✅ **Integrações prontas** - Google Sheets, Notion, Slack, etc
✅ **Lógica condicional** - adicione regras visuais
✅ **Testes fáceis** - execute manualmente
✅ **Versão gratuita generosa** - 5,000 exec/mês
✅ **Self-hosted = ilimitado** - totalmente grátis

---

## 🔄 Exemplos de Extensões (Fáceis no n8n)

### Salvar no Google Sheets
Adicione um node **Google Sheets** após o HTTP Request

### Enviar notificação no Slack
Adicione um node **Slack** para avisar a equipe

### Filtrar por valor
Adicione um node **IF** antes de processar:
- Se valor > R$ 1000 → enviar alerta
- Senão → processar normal

---

# 💬 EXEMPLOS DE MENSAGENS (Ambas Opções)

### ✅ Despesas Simples
- "Gastei 50 reais de uber"
- "Almoço 35 reais"
- "Academia 150"
- "Netflix 55.90"

### ✅ Com Cartão
- "Compras 250 reais no Nubank"
- "Gasolina 200 no Inter"
- "Farmácia 80 no Itaú"

### ✅ Parcelado
- "Notebook 5000 em 10x no Nubank"
- "Geladeira 2500 em 12x no Inter"
- "TV 3000 em 6x"

### ✅ Receitas
- "Recebi 5000 do salário"
- "Freela 1500"
- "Dividendos 300"

---

# 💰 COMPARAÇÃO DE CUSTOS

## Opção 1: Direto
| Item | Custo |
|------|-------|
| Evolution API (Railway) | R$ 0,00 ✅ |
| Lovable AI | Incluído ✅ |
| **TOTAL** | **R$ 0,00/mês** 🎉 |

## Opção 2: Com n8n
| Item | Custo |
|------|-------|
| Evolution API (Railway) | R$ 0,00 ✅ |
| n8n Cloud | R$ 0,00* ✅ |
| Lovable AI | Incluído ✅ |
| **TOTAL** | **R$ 0,00/mês** 🎉 |

*5,000 execuções/mês grátis (ou ilimitado self-hosted)

---

# 🐛 TROUBLESHOOTING

## Mensagens não chegam

### Opção 1 (Direto):
1. Verifique conexão WhatsApp:
```bash
curl https://seu-app.up.railway.app/instance/connectionState/financeiro?apikey=minhaChaveSecreta123
```

2. Teste o webhook manualmente:
```bash
curl -X POST https://sdjbjcufuiziclxvtcrl.supabase.co/functions/v1/whatsapp-evolution-webhook \
-H "Content-Type: application/json" \
-H "x-user-id: SEU_USER_ID" \
-d '{
  "event": "messages.upsert",
  "instance": "financeiro",
  "data": {
    "key": { "fromMe": false, "remoteJid": "5511999999999@s.whatsapp.net" },
    "message": { "conversation": "Teste 100 reais" }
  }
}'
```

3. Veja logs da Edge Function no Lovable Cloud

### Opção 2 (Com n8n):
1. Vá em **Executions** no n8n
2. Veja onde o workflow falhou
3. Clique na execução para ver detalhes
4. Verifique os dados de entrada/saída de cada node

## WhatsApp desconectou
- Escaneie QR Code novamente:
  `https://seu-app.up.railway.app/instance/connect/financeiro`

---

# 🚀 PRÓXIMOS PASSOS

Depois de configurar:

1. ✅ Envie transações por voz (Evolution API transcreve)
2. ✅ Receba confirmações automáticas
3. ✅ Veja tudo no dashboard
4. 📊 (Futuro) Relatórios diários no WhatsApp
5. 📊 (Futuro) Alertas de vencimento
6. 🤖 (Futuro) Comandos: `/saldo`, `/gastos`, `/cartoes`

---

## 📚 Documentação

- **Evolution API**: https://doc.evolution-api.com/
- **n8n**: https://docs.n8n.io/
- **Railway**: https://docs.railway.app/
- **Render**: https://render.com/docs

---

## 🎁 Dica Extra: Mensagens de Voz

A Evolution API **transcreve mensagens de voz automaticamente**!

Você pode simplesmente falar:
🎤 *"Gastei 80 reais no restaurante com o cartão Nubank"*

E funciona! 🔥
