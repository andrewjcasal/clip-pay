-- First create the missing profiles
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

-- Now verify all brands have profiles
DO $$
DECLARE
    missing_count integer;
BEGIN
    SELECT COUNT(*)
    INTO missing_count
    FROM "public"."brands" b
    LEFT JOIN "public"."profiles" p ON p.id = b.user_id
    WHERE p.id IS NULL;

    IF missing_count > 0 THEN
        RAISE EXCEPTION 'Still found % brands with missing profiles after insert', missing_count;
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "brands_user_id_idx" ON "public"."brands" ("user_id");
