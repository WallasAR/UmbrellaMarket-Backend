-- 020_favorites_and_ratings.sql
-- Create Favorites Table and optimize Review Ratings

-- 1. Create Favorite table
CREATE TABLE IF NOT EXISTS "Favorite" (
  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "medicine_id" BIGINT NOT NULL REFERENCES "Medicine"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE("user_id", "medicine_id")
);

-- RLS for Favorite
ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
ON "Favorite" FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON "Favorite" FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON "Favorite" FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add Denormalized Rating Fields to Medicine
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "average_rating" NUMERIC(3, 2) DEFAULT 0.00;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "review_count" INTEGER DEFAULT 0;

-- 3. Create Trigger Function to Auto-Update Medicine Ratings
CREATE OR REPLACE FUNCTION update_medicine_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_medicine_id BIGINT;
  v_avg_rating NUMERIC;
  v_review_count INTEGER;
BEGIN
  -- Determine which medicine to update
  IF (TG_OP = 'DELETE') THEN
    v_medicine_id := OLD.medicine_id;
  ELSE
    v_medicine_id := NEW.medicine_id;
  END IF;

  -- Calculate average rating and count
  SELECT 
    COALESCE(ROUND(AVG(rating), 2), 0), 
    COUNT(*)
  INTO 
    v_avg_rating, 
    v_review_count
  FROM "Review"
  WHERE medicine_id = v_medicine_id;

  -- Update Medicine
  UPDATE "Medicine"
  SET 
    average_rating = v_avg_rating,
    review_count = v_review_count
  WHERE id = v_medicine_id;

  RETURN NULL; -- AFTER triggers don't need to return the row
END;
$$ LANGUAGE plpgsql;

-- 4. Apply Trigger on Review
DROP TRIGGER IF EXISTS review_rating_update_trigger ON "Review";
CREATE TRIGGER review_rating_update_trigger
AFTER INSERT OR UPDATE OF rating OR DELETE ON "Review"
FOR EACH ROW
EXECUTE FUNCTION update_medicine_rating();

-- 5. Seed Existing Ratings (Backfill)
DO $$
DECLARE
  med RECORD;
BEGIN
  FOR med IN SELECT DISTINCT medicine_id FROM "Review" LOOP
    UPDATE "Medicine"
    SET 
      average_rating = (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM "Review" WHERE medicine_id = med.medicine_id),
      review_count = (SELECT COUNT(*) FROM "Review" WHERE medicine_id = med.medicine_id)
    WHERE id = med.medicine_id;
  END LOOP;
END;
$$;
