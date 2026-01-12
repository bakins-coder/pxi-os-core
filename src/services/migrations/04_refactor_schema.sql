-- MIGRATION: REFACTOR SCHEMA (Taxonomy, Contacts, Ledger)

BEGIN;

-- ==========================================
-- 1. INVENTORY TAXONOMY REFACTOR
-- ==========================================
-- Add explicit 'type' column to replace fragile boolean flags
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS type TEXT;

-- Migrate Existing Data to New Types
-- A. Assets (Hardware, Crockery, etc.)
UPDATE inventory 
SET type = 'asset' 
WHERE is_asset = true 
   OR category IN ('Hardware', 'Crockery', 'Glassware', 'Cutlery', 'Chargers', 'Components', 'Kitchen Equipment');

-- B. Raw Materials (Food, Ingredients)
UPDATE inventory 
SET type = 'raw_material' 
WHERE type IS NULL 
  AND category IN ('Food', 'Ingredients', 'Beverages', 'Spices', 'Produce', 'Proteins', 'Dry Goods', 'Dairy');

-- C. Rentals (Third-party items)
UPDATE inventory 
SET type = 'rental' 
WHERE is_rental = true;

-- D. Fixtures (Office, Furniture) - New Category
UPDATE inventory 
SET type = 'fixture' 
WHERE category IN ('Furniture', 'Decor', 'Office');

-- E. Menu Items (Products) - If any exist in inventory table (usually they are recipes, but if treated as stock items)
-- Assuming current 'inventory' table is primarily stock. Menu Items are often derived from Recipes. 
-- If there are pre-made products:
UPDATE inventory 
SET type = 'product' 
WHERE category = 'Finished Goods';

-- Fallback: Default to 'raw_material' if unknown
UPDATE inventory SET type = 'raw_material' WHERE type IS NULL;


-- ==========================================
-- 2. CONTACT DIRECTORY REFACTOR
-- ==========================================
-- Add columns to distinguish contact types
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS category TEXT; -- 'Customer', 'Supplier', 'Bank_Partner', 'Employee'
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS customer_type TEXT; -- 'Individual', 'Corporate'

-- Seed Standard Categories
UPDATE contacts SET category = 'Customer' WHERE category IS NULL;

-- Seed known Suppliers if possible (Logic placeholder)
-- UPDATE contacts SET category = 'Supplier' WHERE name ILIKE '%Store%' OR name ILIKE '%Supermarket%';


-- ==========================================
-- 3. LEDGER EXPANSION (RESERVES)
-- ==========================================
-- Add Reserves and Sinking Funds to Chart of Accounts
INSERT INTO chart_of_accounts (company_id, code, name, type, subtype, balance_cents)
SELECT 
    (SELECT id FROM organizations LIMIT 1), -- Assign to first org
    code, name, type, subtype, 0
FROM (VALUES
    ('3002', 'General Reserve', 'Equity', 'Reserve'),
    ('3003', 'Retained Earnings', 'Equity', 'Reserve'),
    ('1005', 'Asset Replacement Fund', 'Asset', 'Sinking Fund'),
    ('1006', 'Emergency Sinking Fund', 'Asset', 'Sinking Fund'),
    ('1007', 'Operational Savings', 'Asset', 'Sinking Fund'),
    ('2001', 'Accounts Payable', 'Liability', 'Current'),
    ('1101', 'Accounts Receivable', 'Asset', 'Current')
) AS new_acc(code, name, type, subtype)
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE code = new_acc.code);


COMMIT;

-- Verification
DO $$
DECLARE
    inv_dist JSONB;
BEGIN
    SELECT jsonb_object_agg(type, count) INTO inv_dist 
    FROM (SELECT type, COUNT(*) as count FROM inventory GROUP BY type) t;
    
    RAISE NOTICE '✅ Schema Refactor Complete.';
    RAISE NOTICE '📊 Inventory Distribution: %', inv_dist;
END $$;
