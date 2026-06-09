-- Medicine-Pharmacy relationship: default pharmacy seed and foreign key constraints
-- Required for Supabase PostgREST nested selects (e.g. Medicine -> Pharmacy)

DO $$
DECLARE
  default_pharmacy_id UUID;
BEGIN
  SELECT id INTO default_pharmacy_id
  FROM "Pharmacy"
  WHERE name = 'Umbrella Farmácia'
  LIMIT 1;

  IF default_pharmacy_id IS NULL THEN
    INSERT INTO "Pharmacy" (
      name,
      address,
      city,
      state,
      active,
      onboarding_status,
      plan_tier,
      operational_status
    )
    VALUES (
      'Umbrella Farmácia',
      'Rua Principal, 100',
      'São Paulo',
      'SP',
      TRUE,
      'approved',
      'free',
      'open'
    )
    RETURNING id INTO default_pharmacy_id;
  END IF;

  UPDATE "Medicine"
  SET pharmacy_id = default_pharmacy_id
  WHERE pharmacy_id IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM "Pharmacy" p WHERE p.id = "Medicine".pharmacy_id
     );
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'medicine_pharmacy_id_fkey'
  ) THEN
    ALTER TABLE "Medicine"
      ADD CONSTRAINT medicine_pharmacy_id_fkey
      FOREIGN KEY (pharmacy_id) REFERENCES "Pharmacy"(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchase_pharmacy_id_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT purchase_pharmacy_id_fkey
      FOREIGN KEY (pharmacy_id) REFERENCES "Pharmacy"(id);
  END IF;
END $$;
