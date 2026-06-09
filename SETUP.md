# Setup do Backend

Este guia prepara o `UmbrellaMarket-Backend`, a API Express/Supabase/Stripe do marketplace de medicamentos.

## Requisitos

- Node.js
- npm
- Projeto Supabase com as tabelas base existentes
- Conta Stripe
- Opcional: SMTP para envio de e-mails

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do backend:

```env
PORT=4000

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_API_KEY=sua_chave_supabase

JWT_TOKEN=uma_chave_segura

STRIPE_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUCCESS_URL=http://localhost:4200/checkout/success
CANCEL_URL=http://localhost:4200/checkout/cancel

SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario
SMTP_PASS=senha
SMTP_FROM=Umbrella Farmácia <noreply@seudominio.com>
```

SMTP é opcional. Se não estiver configurado, os e-mails são ignorados com log no console.

## Banco de dados

Execute as migrations em ordem no Supabase SQL Editor:

```text
migrations/001_marketplace_saas_extensions.sql
migrations/002_reviews_subscriptions_webhooks.sql
migrations/003_pharmacy_operations.sql
migrations/004_saas_onboarding.sql
```

Essas migrations adicionam:

- Roles de usuário
- Campos de categoria, prescrição, laboratório, farmácia e assinatura em medicamentos
- Farmácias
- Cupons
- Receitas
- Notificações
- Avaliações
- Assinaturas
- Controle de eventos de webhook
- Vínculo de usuário com farmácia (`User.pharmacy_id`)
- Lotes com validade (`MedicineBatch`)
- Status operacional e plano da farmácia
- Planos SaaS (`SaasPlan`), onboarding de farmácias e comissões por venda

## Rodando localmente

```bash
npm start
```

Servidor:

```text
http://localhost:4000
```

Swagger:

```text
http://localhost:4000/docs
```

## Stripe

### Checkout

Configure:

```env
SUCCESS_URL=http://localhost:4200/checkout/success
CANCEL_URL=http://localhost:4200/checkout/cancel
```

### Webhook

No painel da Stripe, crie um webhook para:

```text
https://sua-api.com/api/webhooks/stripe
```

Eventos recomendados:

```text
checkout.session.completed
checkout.session.async_payment_failed
customer.subscription.deleted
invoice.payment_failed
```

Copie o signing secret para:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Roles de usuário

Roles aceitas:

```text
customer
operator
pharmacist
admin
```

Para liberar o painel admin, atualize o usuário no Supabase:

```sql
UPDATE "User"
SET role = 'admin'
WHERE email = 'seu-email@dominio.com';
```

Para liberar o painel da farmácia, vincule o usuário a uma farmácia:

```sql
UPDATE "User"
SET role = 'pharmacist', pharmacy_id = 'uuid-da-farmacia'
WHERE email = 'farmaceutico@dominio.com';
```

Roles `pharmacist` e `operator` precisam de `pharmacy_id` para acessar `/api/pharmacy/*`.
Admins podem informar `x-pharmacy-id` no header para operar uma farmácia específica.

## Produtos

Campos importantes para os novos fluxos:

```text
category
requires_prescription
active_ingredient
laboratory
pharmacy_id
allows_subscription
```

- `requires_prescription = true`: bloqueia checkout sem receita aprovada.
- `allows_subscription = true`: habilita assinatura mensal no frontend.
- `pharmacy_id`: habilita checkout multi-farmácia.

## Endpoints principais

```text
POST /api/auth/login
POST /api/auth/register

GET  /api/product/list
GET  /api/product/categories
GET  /api/product/:id

GET  /api/cart/list
POST /api/cart/add
PUT  /api/cart/update
DELETE /api/cart/delete/:id

POST /api/checkout/cart
POST /api/checkout/item/:id
GET  /api/checkout/success
POST /api/webhooks/stripe

GET  /api/orders
GET  /api/orders/:sessionId

GET  /api/prescriptions
POST /api/prescriptions
GET  /api/prescriptions/pending
PATCH /api/prescriptions/:id/review

GET  /api/reviews/product/:medicineId
POST /api/reviews

GET  /api/subscriptions
POST /api/subscriptions/medicine/:medicineId
DELETE /api/subscriptions/:id

GET  /api/notifications
PATCH /api/notifications/:id/read

GET  /api/admin/dashboard
GET  /api/admin/orders
PATCH /api/admin/orders/:sessionId/status
GET  /api/admin/users
PATCH /api/admin/users/:id/role

GET  /api/pharmacy/dashboard
GET  /api/pharmacy/products
GET  /api/pharmacy/batches
POST /api/pharmacy/batches
PUT  /api/pharmacy/batches/:id
DELETE /api/pharmacy/batches/:id
GET  /api/pharmacy/alerts
POST /api/pharmacy/alerts/scan
GET  /api/pharmacy/orders
PATCH /api/pharmacy/orders/:sessionId/status
PATCH /api/pharmacy/status
GET  /api/pharmacy/financial

GET  /api/onboarding/plans
GET  /api/onboarding/status
POST /api/onboarding/register

GET  /api/admin/pharmacies/pending
PATCH /api/admin/pharmacies/:id/approve
PATCH /api/admin/pharmacies/:id/reject
GET  /api/admin/financial
```

## Observações de produção

- Use HTTPS para Stripe webhook.
- Garanta que `SUCCESS_URL` aponte para o domínio real do frontend.
- Configure SMTP antes de depender de e-mails transacionais.
- Rode as migrations antes do deploy que usa os novos endpoints.
- O webhook é idempotente via tabela `WebhookEvent`.

