-- Catalog visibility: RLS read policies and stock backfill for existing medicines

UPDATE "Medicine"
SET stock = 1
WHERE stock IS NULL OR stock <= 0;

ALTER TABLE "Medicine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pharmacy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Images" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Medicine' AND policyname = 'catalog_read_medicines'
  ) THEN
    CREATE POLICY catalog_read_medicines ON "Medicine"
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Pharmacy' AND policyname = 'catalog_read_pharmacies'
  ) THEN
    CREATE POLICY catalog_read_pharmacies ON "Pharmacy"
      FOR SELECT
      USING (active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'Images' AND policyname = 'catalog_read_images'
  ) THEN
    CREATE POLICY catalog_read_images ON "Images"
      FOR SELECT
      USING (true);
  END IF;
END $$;
