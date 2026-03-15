-- Migration: Add packaging metadata to ingredients
-- Purpose: Support tracking of bulk/pack breakdown (e.g. 12 bags of 5kg)

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS last_pack_count INTEGER;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS last_pack_size NUMERIC;

COMMENT ON COLUMN ingredients.last_pack_count IS 'The number of packs/bags in the last received stock movement';
COMMENT ON COLUMN ingredients.last_pack_size IS 'The size of each pack/bag in the last received stock movement';
