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
-- Ensure these exist first or update if any matching category found
UPDATE inventory 
SET type = 'fixture' 
WHERE category IN ('Furniture', 'Decor', 'Office');

-- E. Menu Items (Products) 
UPDATE inventory 
SET type = 'product' 
WHERE category = 'Finished Goods';

-- Fallback
UPDATE inventory SET type = 'raw_material' WHERE type IS NULL;


-- ==========================================
-- 2. CONTACT DIRECTORY REFACTOR
-- ==========================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS category TEXT; 
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS customer_type TEXT;

-- Seed Standard Categories
UPDATE contacts SET category = 'Customer' WHERE category IS NULL;


-- ==========================================
-- 3. LEDGER EXPANSION (RESERVES)
-- ==========================================
-- Using DO block to find Organization ID dynamicallly
DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM organizations LIMIT 1;

    IF org_id IS NOT NULL THEN
        INSERT INTO chart_of_accounts (company_id, code, name, type, subtype, balance_cents)
        SELECT 
            org_id, code, name, type, subtype, 0
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
    END IF;
END $$;

COMMIT;
