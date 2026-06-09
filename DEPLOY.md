# Deploy do Backend

Guia para publicar a API em produção (Render, Railway, VPS ou similar).

## Pré-requisitos

1. Rodar todas as migrations (`001` a `005`) no Supabase SQL Editor.
2. Conta Stripe em modo live (ou test) com webhook configurado.
3. Domínio do frontend definido para `SUCCESS_URL`, `CANCEL_URL` e `PHARMACY_PANEL_URL`.

## Variáveis de ambiente (produção)

```env
PORT=4000
NODE_ENV=production

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_API_KEY=sua_service_role_ou_anon_key

JWT_TOKEN=chave_longa_aleatoria

STRIPE_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

SUCCESS_URL=https://seu-frontend.com/checkout/success
CANCEL_URL=https://seu-frontend.com/checkout/cancel
PHARMACY_PANEL_URL=https://seu-frontend.com/pharmacy

SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

WHATSAPP_API_URL=...   # opcional
WHATSAPP_API_TOKEN=... # opcional
```

## Render (Web Service)

1. Conecte o repositório `UmbrellaMarket-Backend`.
2. Branch: `fix/marketplace-api-contracts` (ou `main` após merge).
3. Build command: `npm install`
4. Start command: `npm start`
5. Configure todas as variáveis acima em **Environment**.
6. Após deploy, anote a URL: `https://sua-api.onrender.com`.

### Stripe webhook em produção

```text
https://sua-api.onrender.com/api/webhooks/stripe
```

Eventos: `checkout.session.completed`, `checkout.session.async_payment_failed`, `customer.subscription.deleted`, `invoice.payment_failed`.

### Health check

Configure o monitor de uptime em:

```text
GET https://sua-api.onrender.com/health
```

## Pós-deploy

1. Promova um usuário admin no Supabase.
2. Valide `GET /health` e `GET /docs`.
3. Atualize o `apiUrl` do frontend para `https://sua-api.onrender.com/api`.
4. Teste login, checkout e webhook com evento de teste na Stripe.

## Logs

Cada requisição gera log JSON estruturado no stdout com `requestId`, `durationMs` e `status`. Use o painel do provedor ou um agregador (Datadog, Logtail, etc.) para consulta.
