# 🚀 WhatsApp com Webhook GRATUITO

## 🎯 Solução: Evolution API (Open Source)

**Por que Evolution API?**
- ✅ **100% Gratuito** (open source)
- ✅ WhatsApp **pessoal** (não precisa Business)
- ✅ **Webhook nativo**
- ✅ Deploy grátis (Railway/Render)
- ✅ Fácil de configurar

---

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

**Via Postman/Insomnia:**
- Method: POST
- URL: `https://seu-app.up.railway.app/instance/create`
- Header: `apikey: minhaChaveSecreta123`
- Body (JSON):
```json
{
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
}
```

**⚠️ IMPORTANTE:** Substitua `SEU_USER_ID_AQUI` pelo seu User ID!

### 2.2 Obter QR Code

**Método 1: Via Browser (Mais Fácil)**
- Acesse: `https://seu-app.up.railway.app/instance/connect/financeiro`
- O QR Code aparecerá na tela
- Escaneie com seu WhatsApp

**Método 2: Via API**
```bash
curl https://seu-app.up.railway.app/instance/qrcode/financeiro?apikey=minhaChaveSecreta123
```

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

### Enviar Mensagem de Teste

Envie uma mensagem para o seu próprio WhatsApp:

```
Gastei 150 reais no supermercado hoje
```

Ou:

```
Comprei um celular de 3000 em 12x no Nubank
```

A transação será registrada automaticamente! 🎉

---

## 💬 Exemplos de Mensagens

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

## 📊 Verificar Status da Conexão

```bash
curl https://seu-app.up.railway.app/instance/connectionState/financeiro?apikey=minhaChaveSecreta123
```

**Resposta esperada:**
```json
{
  "instance": "financeiro",
  "state": "open"
}
```

---

## 💰 Custos

| Item | Custo |
|------|-------|
| Evolution API (Railway) | **R$ 0,00** (500h/mês grátis) ✅ |
| WhatsApp | **R$ 0,00** (usa seu pessoal) ✅ |
| Lovable AI | **Incluído no projeto** ✅ |
| **TOTAL** | **R$ 0,00/mês** 🎉 |

**Limites Railway Free:**
- 500 horas/mês (suficiente para uso normal)
- Se acabar: deploy na Render (também grátis)
- Ou self-host (grátis ilimitado)

---

## 🔒 Segurança

### ⚠️ IMPORTANTE

1. **API Key**: Guarde `minhaChaveSecreta123` em segredo
2. **User ID**: Não compartilhe
3. **Webhook URL**: Já está pública (precisa ser para receber webhooks)

### 🛡️ Melhorias Futuras

- Validar assinatura do webhook
- Adicionar autenticação por telefone
- Rate limiting por número

---

## 🐛 Troubleshooting

### QR Code não aparece
```bash
# Verificar se a API está online
curl https://seu-app.up.railway.app/instance/fetchInstances?apikey=minhaChaveSecreta123
```

### Mensagens não chegam
1. Verifique o estado da conexão (comando acima)
2. Veja os logs no Railway/Render
3. Teste o webhook manualmente:
```bash
curl -X POST https://sdjbjcufuiziclxvtcrl.supabase.co/functions/v1/whatsapp-evolution-webhook \
-H "Content-Type: application/json" \
-H "x-user-id: SEU_USER_ID" \
-d '{
  "event": "messages.upsert",
  "instance": "financeiro",
  "data": {
    "key": { "fromMe": false },
    "message": { "conversation": "Teste 100 reais" }
  }
}'
```

### WhatsApp desconectou
- Escaneie o QR Code novamente
- Acesse: `https://seu-app.up.railway.app/instance/connect/financeiro`

---

## 🚀 Próximos Passos

Depois de configurar:

1. ✅ Envie transações por mensagem de voz (Evolution API transcreve)
2. ✅ Receba confirmações automáticas
3. ✅ Veja tudo no dashboard
4. 📊 (Futuro) Relatórios diários no WhatsApp
5. 📊 (Futuro) Alertas de vencimento
6. 🤖 (Futuro) Comandos: `/saldo`, `/gastos`, `/cartoes`

---

## 📚 Documentação

- **Evolution API**: https://doc.evolution-api.com/
- **Railway**: https://docs.railway.app/
- **Render**: https://render.com/docs

---

## 🎁 Dica Extra: Mensagens de Voz

A Evolution API **transcreve mensagens de voz automaticamente**!

Você pode simplesmente falar:
🎤 *"Gastei 80 reais no restaurante com o cartão Nubank"*

E funciona! 🔥
