CREATE TABLE IF NOT EXISTS "UserAddress" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cep TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing addresses
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, address, cep FROM "User" WHERE address IS NOT NULL OR cep IS NOT NULL
  LOOP
    INSERT INTO "UserAddress" (user_id, name, address, cep, is_default)
    VALUES (rec.id, 'Meu Endereço', COALESCE(rec.address, ''), COALESCE(rec.cep, ''), TRUE);
  END LOOP;
END $$;

-- Drop constraints or columns on User if desired? For now, we leave them as fallback or for backwards compatibility, 
-- but in a real-world scenario we might eventually drop them. We will just keep them and stop updating them.

ALTER TABLE "UserAddress" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses"
ON "UserAddress"
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
