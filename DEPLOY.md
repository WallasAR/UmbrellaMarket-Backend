# Deploy do Backend

Guia para publicar a API em produção (Render, Railway, VPS ou similar).

## Pré-requisitos

1. Rodar todas as migrations (`001` a `017`) no Supabase SQL Editor — lista completa em [SETUP.md](./SETUP.md#banco-de-dados).
2. Conta Stripe em modo live (ou test) com webhook configurado.
3. Domínio do frontend definido para `SUCCESS_URL`, `CANCEL_URL` e `PHARMACY_PANEL_URL`.

## Backend vs frontend — onde configurar o quê

| Configuração | Onde |
|--------------|------|
| `CRON_SECRET`, `OPENAI_API_KEY`, `STRIPE_*`, `UBER_*`, `NINETYNINE_*`, Supabase, JWT | **Backend** (Render Web Service → Environment) |
| `apiUrl` apontando para a API | **Frontend** (`src/environments/environment.ts`) |

**Nunca** coloque segredos (`CRON_SECRET`, chaves Stripe, OpenAI, couriers) no repositório ou no build do Angular.

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

VAPID_PUBLIC_KEY=...   # opcional — push no navegador
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@seudominio.com

# Cron de alertas de preço — ver seção Render Cron Job abaixo
CRON_SECRET=

# Copilot — OCR + chat IA (opcional)
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4o-mini

# Uber Direct (opcional — sem credenciais: cotação simulada)
UBER_CLIENT_ID=
UBER_CLIENT_SECRET=
UBER_CUSTOMER_ID=

# 99 Entrega (opcional — sem credenciais: cotação simulada)
NINETYNINE_API_KEY=
NINETYNINE_API_URL=https://api.99app.com/v1/logistics
```

### Gerar `CRON_SECRET`

No terminal:

```bash
openssl rand -hex 32
```

Alternativa com Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o valor gerado em **Environment** do Web Service (e do Cron Job, se criar um).

## Render (Web Service)

1. Conecte o repositório `UmbrellaMarket-Backend`.
2. Branch: `master` (ou a branch de release).
3. Build command: `npm install`
4. Start command: `npm start`
5. Configure todas as variáveis acima em **Environment**.
6. Após deploy, anote a URL: `https://sua-api.onrender.com`.

**Plano Free:** o serviço pode hibernar após inatividade; a primeira requisição após dormir pode levar ~30–60s (cold start). Para produção estável, considere plano pago.

### Stripe webhook em produção

```text
https://sua-api.onrender.com/api/webhooks/stripe
```

Eventos recomendados:

```text
checkout.session.completed
checkout.session.async_payment_failed
customer.subscription.deleted
invoice.payment_failed
invoice.payment_succeeded
```

### Health check

Configure o monitor de uptime em:

```text
GET https://sua-api.onrender.com/health
```

## Render Cron Job — alertas de preço

O endpoint `POST /api/cron/price-alerts` **não roda sozinho**. Algo externo precisa chamá-lo periodicamente.

### 1. Configurar secret no Web Service

Em **Environment** do Web Service da API:

```env
CRON_SECRET=seu_valor_gerado_com_openssl
```

Salve e aguarde o redeploy.

### 2. Testar manualmente

```bash
curl -X POST "https://sua-api.onrender.com/api/cron/price-alerts" \
  -H "x-cron-secret: seu_valor_gerado_com_openssl"
```

Respostas:

| Status | Significado |
|--------|-------------|
| **200** | Varredura executada (JSON com alertas disparados) |
| **401** | Secret incorreto no header |
| **503** | `CRON_SECRET` não configurado no Web Service |

Preferir o header `x-cron-secret` em vez de `?secret=` na URL (evita vazamento em logs).

### 3. Criar Cron Job no Render

1. Dashboard Render → **New** → **Cron Job**
2. Conecte o repositório do backend (ou job vazio só com comando)
3. Configure:

| Campo | Valor sugerido |
|-------|----------------|
| **Name** | `umbrella-price-alerts` |
| **Schedule** | `0 * * * *` (a cada hora) ou `0 8,20 * * *` (8h e 20h) |
| **Command** | ver abaixo |

**Command** (substitua a URL):

```bash
curl -sS -f -X POST "https://sua-api.onrender.com/api/cron/price-alerts" -H "x-cron-secret: $CRON_SECRET"
```

4. Em **Environment** do Cron Job, adicione a **mesma** variável:

```env
CRON_SECRET=mesmo_valor_do_web_service
```

5. **Create Cron Job**

Verifique **Cron Job → Logs** (curl com status 200) e **Web Service → Logs** (`POST /api/cron/price-alerts`).

## Pós-deploy

1. Promova um usuário admin no Supabase.
2. Valide `GET /health` e `GET /docs`.
3. Atualize o `apiUrl` do frontend para `https://sua-api.onrender.com/api`.
4. Teste login, checkout unificado multi-farmácia e webhook com evento de teste na Stripe.
5. Confirme que farmácias concluíram onboarding Stripe Connect para repasses automáticos.

## Teste rápido da API em produção

```bash
# Health
curl https://sua-api.onrender.com/health

# Cron (após configurar CRON_SECRET)
curl -X POST "https://sua-api.onrender.com/api/cron/price-alerts" \
  -H "x-cron-secret: SEU_CRON_SECRET"

# Couriers disponíveis (público)
curl https://sua-api.onrender.com/api/delivery/couriers
```

## Logs

Cada requisição gera log JSON estruturado no stdout com `requestId`, `durationMs` e `status`. Use o painel do Render ou um agregador (Datadog, Logtail, etc.) para consulta.

## Testes de API (CI / local)

```bash
npm test
```

O pipeline valida `/health`, `/` e endpoints públicos de notificações sem banco real (variáveis dummy no workflow).

Para setup local completo, consulte [SETUP.md](./SETUP.md).
