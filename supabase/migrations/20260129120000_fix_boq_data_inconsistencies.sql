-- Migration: Add scaling tiers for non-linear recipe costing
-- Description: Adds a JSONB column to store multiple portion-specific quantities to preserve the MD's signature taste strategy.

ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS scaling_tiers JSONB DEFAULT '{}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN recipe_ingredients.scaling_tiers IS 'Stores quantities for specific portion counts (e.g., {"17.5": 0.17, "500": 0.9}) to support non-linear scaling.';
