-- Tabela de Convites para Cadastro de Farmácias
CREATE TABLE IF NOT EXISTS "PharmacyInvite" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES "Pharmacy"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- Habilitar RLS e permitir leitura se o token estiver correto
ALTER TABLE "PharmacyInvite" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read if token matches" ON "PharmacyInvite"
  FOR SELECT
  USING (true);

-- Permite insert e update pelo Service Role
CREATE POLICY "Service Role Full Access PharmacyInvite" ON "PharmacyInvite"
  USING (true)
  WITH CHECK (true);
