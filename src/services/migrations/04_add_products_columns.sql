-- Add missing columns for products if they don't exist
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS price_cents BIGINT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS description TEXT;

-- Reload schema cache to ensure API sees them
NOTIFY pgrst, 'reload schema';
