-- MIGRATION: Fix RLS for Split Schema (Reusable, Products, etc.)
-- Description: Ensures robust access control for the split inventory tables using both Profile and JWT checks.
-- CRITICAL FIX: Ensures tables use 'organization_id' column instead of 'company_id'.

BEGIN;

-- 0. Standardize Column Names (Fix incorrect 'company_id' from previous migrations)
DO $$
BEGIN
    -- Reusable Items
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'company_id') THEN
        ALTER TABLE reusable_items RENAME COLUMN company_id TO organization_id;
    END IF;

    -- Products
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'company_id') THEN
        ALTER TABLE products RENAME COLUMN company_id TO organization_id;
    END IF;

    -- Rental Items
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_items' AND column_name = 'company_id') THEN
        ALTER TABLE rental_items RENAME COLUMN company_id TO organization_id;
    END IF;

    -- Ingredients
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'company_id') THEN
        ALTER TABLE ingredients RENAME COLUMN company_id TO organization_id;
    END IF;
END $$;


-- 1. Reusable Items
ALTER TABLE reusable_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for organization members" ON reusable_items;
-- Also drop old incorrect policy if it exists
DROP POLICY IF EXISTS "Tenant isolation" ON reusable_items;

CREATE POLICY "Enable access for organization members" ON reusable_items FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
) WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);
GRANT ALL ON reusable_items TO authenticated;

-- 2. Products (Menu Items)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for organization members" ON products;
DROP POLICY IF EXISTS "Tenant isolation" ON products;

CREATE POLICY "Enable access for organization members" ON products FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
) WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);
GRANT ALL ON products TO authenticated;

-- 3. Rental Items
ALTER TABLE rental_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for organization members" ON rental_items;
DROP POLICY IF EXISTS "Tenant isolation" ON rental_items;

CREATE POLICY "Enable access for organization members" ON rental_items FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
) WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);
GRANT ALL ON rental_items TO authenticated;

-- 4. Ingredients
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for organization members" ON ingredients;
DROP POLICY IF EXISTS "Tenant isolation" ON ingredients;

CREATE POLICY "Enable access for organization members" ON ingredients FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
) WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);
GRANT ALL ON ingredients TO authenticated;

COMMIT;
