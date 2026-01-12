-- FIX: Ensure all hardware/crockery are marked as Assets
-- This prevents them from showing up in the Food Menu (Banquet Creation)

BEGIN;

-- 1. Mark known Asset categories as is_asset = true
UPDATE inventory
SET is_asset = true
WHERE category IN ('Hardware', 'Crockery', 'Glassware', 'Cutlery', 'Chargers', 'Components');

-- 2. Mark specific items if they missed category match
UPDATE inventory
SET is_asset = true
WHERE name ILIKE '%Charger%' 
   OR name ILIKE '%Plate%' 
   OR name ILIKE '%Glass%' 
   OR name ILIKE '%Spoon%' 
   OR name ILIKE '%Fork%' 
   OR name ILIKE '%Knife%'
   OR name ILIKE '%Cup%';

-- 3. Mark Food categories as is_asset = false (Safety)
UPDATE inventory
SET is_asset = false
WHERE category IN ('Food', 'Ingredients', 'Beverages', 'Spices', 'Produce', 'Proteins', 'Dry Goods');

COMMIT;

-- Verification Log
DO $$
DECLARE
    asset_count INT;
BEGIN
    SELECT COUNT(*) INTO asset_count FROM inventory WHERE is_asset = true;
    RAISE NOTICE '✅ Fixed Asset Flags. Total Assets in Ledger: %', asset_count;
END $$;
