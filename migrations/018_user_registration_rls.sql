-- Fix user registration by allowing inserts to User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'User' AND policyname = 'allow_insert_customer'
  ) THEN
    CREATE POLICY allow_insert_customer ON "User"
      FOR INSERT
      WITH CHECK (role = 'customer');
  END IF;
END $$;
