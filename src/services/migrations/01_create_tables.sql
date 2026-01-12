-- MIGRATION: CREATE MISSING TABLES
-- This script creates the tables required for Employees, Assets, and Ledger.

-- 1. Inventory & Assets
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price_cents BIGINT,
    cost_price_cents BIGINT,
    image TEXT,
    description TEXT,
    recipe_id TEXT,
    stock_quantity INT DEFAULT 0,
    is_asset BOOLEAN DEFAULT false,
    is_rental BOOLEAN DEFAULT false,
    rental_vendor TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for inventory" ON inventory FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    salary_cents BIGINT,
    status TEXT DEFAULT 'Active',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for employees" ON employees FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Chart of Accounts (Ledger Headers)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subtype TEXT NOT NULL,
    balance_cents BIGINT DEFAULT 0,
    currency TEXT DEFAULT 'NGN',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for chart_of_accounts" ON chart_of_accounts FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Ledger Transactions (Journal)
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES organizations(id) NOT NULL, -- using tenant_id to match common schema, mapped to company_id
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Posted',
    source TEXT DEFAULT 'Manual',
    entries JSONB, -- Storing journal entries as JSONB for flexibility
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for ledger_transactions" ON ledger_transactions FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Contacts (Required for some ledger entries)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    sentiment_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for contacts" ON contacts FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
