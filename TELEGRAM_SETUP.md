# 🚀 Configuração GRATUITA com Telegram

## 🎯 Por que Telegram?
- ✅ **100% Gratuito** (sem limites de API)
- ✅ **Mais fácil** que WhatsApp Business
- ✅ **Configuração em 5 minutos**
- ✅ Funciona igual ao WhatsApp para o usuário

---

## 📱 Passo 1: Criar Bot no Telegram

### 1.1 Abrir o BotFather
1. No Telegram, procure por: **@BotFather**
2. Inicie a conversa com `/start`

### 1.2 Criar seu Bot
1. Envie o comando: `/newbot`
2. Escolha um nome: `Meu Gestor Financeiro`
3. Escolha um username: `seu_bot_financeiro_bot` (deve terminar com "bot")
4. **Copie o TOKEN** que ele te dá (algo como: `7293847293:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`)

✅ Pronto! Seu bot está criado!

---

## 🔧 Passo 2: Configurar n8n (Grátis)

### 2.1 Criar Conta
- Acesse: https://n8n.io/
- Clique em "Start for free"
- Crie sua conta

### 2.2 Criar Workflow
1. Clique em "New workflow"
2. Nome: "Telegram Financeiro"

### 2.3 Adicionar Nós

#### Nó 1: Telegram Trigger
1. Clique no "+"
2. Procure por "Telegram Trigger"
3. Clique em "Create New Credentials"
4. Cole o **TOKEN** do BotFather
5. Salve
6. Configure: "Updates" → "Message"

#### Nó 2: HTTP Request
1. Adicione novo nó: "HTTP Request"
2. Configure:
   - **Method**: POST
   - **URL**: `https://sdjbjcufuiziclxvtcrl.supabase.co/functions/v1/process-whatsapp-transaction`
   - **Authentication**: None
   - **Body Content Type**: JSON
   - **Body**:
   ```json
   {
     "message": "={{ $json.message.text }}",
     "userId": "SEU_USER_ID_AQUI"
   }
   ```

#### Nó 3: Telegram Reply
1. Adicione: "Telegram"
2. Escolha: "Send Message"
3. Use suas credenciais do bot
4. Configure:
   - **Chat ID**: `={{ $('Telegram Trigger').item.json.message.chat.id }}`
   - **Text**: `={{ $json.message }}`

### 2.4 Ativar Workflow
- Clique no botão "Active" (canto superior direito)

---

## 🔑 Passo 3: Pegar seu User ID

### Opção A: Via DevTools (Navegador)
1. Abra seu app no navegador
2. Pressione F12 (DevTools)
3. Vá na aba Console
4. Cole e execute:
```javascript
supabase.auth.getUser().then(r => console.log(r.data.user.id))
```
5. Copie o ID que aparece

### Opção B: Via Lovable Cloud
1. Abra Lovable Cloud (botão no topo)
2. Vá em "Users & Authentication"
3. Copie seu User ID

### Opção C: Via Código
1. Adicione temporariamente no seu código:
```typescript
const { data } = await supabase.auth.getUser();
console.log('MEU USER ID:', data.user?.id);
```

---

## ✅ Passo 4: Testar

1. Abra o Telegram
2. Procure pelo seu bot: `@seu_bot_financeiro_bot`
3. Envie uma mensagem:

```
Gastei 50 reais de uber hoje
```

Ou:

```
Comprei um celular de 3000 em 12x no Nubank
```

**O bot deve responder com a confirmação!** 🎉

---

## 💬 Exemplos de Mensagens

### ✅ Despesas
- "Gastei 50 reais de uber hoje"
- "Comprei um notebook de 5000 em 10x no Inter"
- "Paguei 200 de conta de luz"
- "Jantar romântico 180 reais no Itaú"
- "Supermercado 300 reais"

### ✅ Receitas
- "Recebi 3000 do meu salário"
- "Freela de 1500"
- "Dividendos de 250"

### ✅ Com Cartão e Parcelas
- "Geladeira 2500 em 10x no Inter"
- "Passagem 800 em 6x no Nubank"

---

## 💰 Custos

| Item | Custo |
|------|-------|
| Telegram Bot API | **R$ 0,00** ✅ |
| n8n (até 5.000 msg/mês) | **R$ 0,00** ✅ |
| Lovable AI | **Incluído** ✅ |
| **TOTAL** | **R$ 0,00/mês** 🎉 |

Se precisar de mais de 5.000 mensagens/mês:
- n8n self-hosted: Totalmente gratuito (infinito)
- Ou n8n pago: €20/mês (20.000 execuções)

---

## 🔒 Segurança

### ⚠️ IMPORTANTE
Seu User ID é como uma senha! Não compartilhe.

### 🛡️ Melhorias Futuras
- Adicionar código de verificação
- Autenticação por token
- Limitar uso por telefone

Por enquanto, **só você** deve usar o bot.

---

## 🚀 Próximos Passos

Depois de configurar, você pode:
1. ✅ Enviar mensagens naturais
2. ✅ Receber confirmações instantâneas
3. ✅ Ver tudo no dashboard
4. 📊 (Futuro) Receber relatórios diários
5. 📊 (Futuro) Receber alertas de limite

---

## 📞 Suporte

- **Problemas com n8n**: https://community.n8n.io/
- **Telegram Bot API**: https://core.telegram.org/bots
- **Lovable**: https://docs.lovable.dev/

---

## 🎁 Bônus: Self-Hosted n8n (Infinito Grátis)

Se quiser **zero limites**:

```bash
# Instalar n8n localmente
npx n8n

# Ou com Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  n8nio/n8n
```

Acesse: http://localhost:5678

Mesma configuração, mas **totalmente gratuito e ilimitado**! 🚀
