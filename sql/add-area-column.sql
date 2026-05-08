-- Run this once in Supabase SQL Editor
-- Adds 'area' as a direct text column in crm_negocios (more reliable than JSONB)

ALTER TABLE crm_negocios ADD COLUMN IF NOT EXISTS area text;

-- Migrate existing area values stored in campos_extras JSONB
UPDATE crm_negocios
SET area = campos_extras->>'area'
WHERE area IS NULL AND campos_extras IS NOT NULL AND campos_extras::text != 'null';

-- Also ensure campos_extras is JSONB (not text) — if it's text, convert it
-- Uncomment the line below only if Supabase shows campos_extras type as "text":
-- ALTER TABLE crm_negocios ALTER COLUMN campos_extras TYPE jsonb USING campos_extras::jsonb;
