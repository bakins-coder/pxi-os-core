-- ULTIMATE SETUP SCRIPT
-- This script is "Idempotent" - it is safe to run on ANY database state.
-- It will:
-- 1. Create tables if they are missing.
-- 2. Add 'company_id' if it's missing (updates old tables).
-- 3. Enforce Security Policies.

-- HELPER: Create Organizations First
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- HELPER: Create Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    company_id UUID REFERENCES organizations(id),
    name TEXT,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- === 1. CATERING EVENTS ===
CREATE TABLE IF NOT EXISTS catering_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Force add column if table existed but was old
ALTER TABLE catering_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE catering_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for catering_events" ON catering_events;
CREATE POLICY "Tenant isolation for catering_events" ON catering_events FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- === 2. TASKS ===
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    title TEXT,
    status TEXT DEFAULT 'Todo',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for tasks" ON tasks;
CREATE POLICY "Tenant isolation for tasks" ON tasks FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- === 3. PROJECTS ===
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for projects" ON projects;
CREATE POLICY "Tenant isolation for projects" ON projects FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- === 4. REQUISITIONS ===
CREATE TABLE IF NOT EXISTS requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    item_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for requisitions" ON requisitions;
CREATE POLICY "Tenant isolation for requisitions" ON requisitions FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- === 5. INVENTORY ===
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for inventory" ON inventory;
CREATE POLICY "Tenant isolation for inventory" ON inventory FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- === 6. CONTACTS ===
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for contacts" ON contacts;
CREATE POLICY "Tenant isolation for contacts" ON contacts FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- === 7. FINANCIALS ===
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    code TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for chart_of_accounts" ON chart_of_accounts;
CREATE POLICY "Tenant isolation for chart_of_accounts" ON chart_of_accounts FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for bank_transactions" ON bank_transactions;
CREATE POLICY "Tenant isolation for bank_transactions" ON bank_transactions FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
