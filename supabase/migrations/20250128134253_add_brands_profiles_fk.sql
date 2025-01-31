-- First, drop existing constraint if it exists
ALTER TABLE "public"."brands"
DROP CONSTRAINT IF EXISTS "brands_user_id_fkey";

-- First, create missing profile records for existing brands
INSERT INTO "public"."profiles" (id, user_type, onboarding_completed, created_at, updated_at)
SELECT 
    b.user_id,
    'brand',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."brands" b
LEFT JOIN "public"."profiles" p ON p.id = b.user_id
WHERE p.id IS NULL;

-- Now add the foreign key constraint
ALTER TABLE "public"."brands"
ADD CONSTRAINT "brands_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "public"."profiles"("id")
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "brands_user_id_idx" ON "public"."brands" ("user_id");
