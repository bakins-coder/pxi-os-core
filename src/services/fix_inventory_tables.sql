-- SQL Fix for Inventory Tables
-- Run this script in the Supabase SQL Editor.
-- It adds the missing 'company_id' column to inventory sub-tables.

-- 1. Reusable Items
CREATE TABLE IF NOT EXISTS reusable_items (id UUID DEFAULT gen_random_uuid());
DO $$ BEGIN
    ALTER TABLE reusable_items ADD COLUMN company_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 2. Rental Items
CREATE TABLE IF NOT EXISTS rental_items (id UUID DEFAULT gen_random_uuid());
DO $$ BEGIN
    ALTER TABLE rental_items ADD COLUMN company_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 3. Ingredients
CREATE TABLE IF NOT EXISTS ingredients (id UUID DEFAULT gen_random_uuid());
DO $$ BEGIN
    ALTER TABLE ingredients ADD COLUMN company_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 4. Products
CREATE TABLE IF NOT EXISTS products (id UUID DEFAULT gen_random_uuid());
DO $$ BEGIN
    ALTER TABLE products ADD COLUMN company_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 5. Ensure Primary Keys on these as well (to prevent future ON CONFLICT errors)
DO $$ BEGIN ALTER TABLE reusable_items ADD CONSTRAINT reusable_items_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE rental_items ADD CONSTRAINT rental_items_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE ingredients ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Enable RLS
ALTER TABLE reusable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 7. Add Policies
DROP POLICY IF EXISTS "Tenant isolation" ON reusable_items;
CREATE POLICY "Tenant isolation" ON reusable_items FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

DROP POLICY IF EXISTS "Tenant isolation" ON rental_items;
CREATE POLICY "Tenant isolation" ON rental_items FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

DROP POLICY IF EXISTS "Tenant isolation" ON ingredients;
CREATE POLICY "Tenant isolation" ON ingredients FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

DROP POLICY IF EXISTS "Tenant isolation" ON products;
CREATE POLICY "Tenant isolation" ON products FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
