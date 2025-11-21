# 🚀 Como Configurar WhatsApp com n8n

## Visão Geral
Sua edge function `process-whatsapp-transaction` está pronta! Agora você precisa conectar o n8n para enviar mensagens do WhatsApp para ela.

## Passo a Passo

### 1. Criar Conta no n8n
- Acesse: https://n8n.io/
- Crie uma conta gratuita
- Ou faça self-host: https://docs.n8n.io/hosting/

### 2. Criar Workflow no n8n

#### Nó 1: WhatsApp Trigger
1. Adicione o nó "WhatsApp Business"
2. Configure sua conta do WhatsApp Business
3. Selecione "On Message Received"

**Alternativas se não tiver WhatsApp Business:**
- Use "Webhook" e integre com Twilio
- Use "Telegram" (funciona similar e é gratuito)

#### Nó 2: HTTP Request
1. Adicione um nó "HTTP Request"
2. Configure:
   - **Method**: POST
   - **URL**: `https://sdjbjcufuiziclxvtcrl.supabase.co/functions/v1/process-whatsapp-transaction`
   - **Authentication**: None (a função é pública)
   - **Body**: 
   ```json
   {
     "message": "{{ $json.body }}",
     "userId": "SEU_USER_ID_AQUI"
   }
   ```

#### Nó 3: WhatsApp Send (Resposta)
1. Adicione um nó "WhatsApp Business" 
2. Configure para "Send Message"
3. Use o response da edge function:
   ```
   {{ $json.message }}
   ```

### 3. Como Pegar seu User ID
1. Abra o DevTools no navegador (F12)
2. No Console, execute:
```javascript
(await supabase.auth.getUser()).data.user.id
```
3. Copie o ID retornado

### 4. Testar a Integração

Envie uma mensagem no WhatsApp:
```
Gastei 150 reais no supermercado hoje
```

Ou:
```
Comprei um celular de R$ 3000 em 12x no Nubank
```

A IA vai processar e registrar automaticamente!

## Exemplos de Mensagens que Funcionam

✅ "Gastei 50 reais de uber hoje"
✅ "Recebi 3000 do meu salário"
✅ "Comprei um notebook de 5000 em 10x no Inter"
✅ "Paguei 200 de conta de luz"
✅ "Jantar romântico 180 reais no Itaú"

## URL da Edge Function
```
https://sdjbjcufuiziclxvtcrl.supabase.co/functions/v1/process-whatsapp-transaction
```

## Alternativa: Telegram (Mais Fácil e Gratuito)
Se preferir usar Telegram em vez de WhatsApp:
1. No n8n, use o trigger "Telegram"
2. Crie um bot com @BotFather no Telegram
3. Use o mesmo workflow, só muda o trigger

## Suporte
A IA processa linguagem natural em português, então pode escrever naturalmente!

## Custo
- **n8n Cloud**: Grátis até 5.000 execuções/mês
- **Self-hosted**: Totalmente gratuito
- **Lovable AI**: Incluído no seu projeto
- **WhatsApp Business API**: Grátis (até certo limite)

## Segurança
⚠️ **IMPORTANTE**: Guarde seu User ID em segredo! Qualquer pessoa com ele pode adicionar transações na sua conta.

**Melhoria futura**: Adicionar autenticação por token ou código de verificação.
