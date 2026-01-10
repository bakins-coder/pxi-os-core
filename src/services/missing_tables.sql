-- Financial Accounts & Transactions Schema Update
-- Run this in your Supabase SQL Editor to enable syncing for these tables.

-- 1. Chart of Accounts
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
CREATE POLICY "Tenant isolation for chart_of_accounts" ON chart_of_accounts FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- 2. Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    amount_cents BIGINT DEFAULT 0,
    type TEXT NOT NULL, -- 'Credit' or 'Debit'
    category TEXT,
    contact_id UUID REFERENCES contacts(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for bank_transactions" ON bank_transactions FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- 3. Requisitions (If missing)
CREATE TABLE IF NOT EXISTS requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    item_name TEXT NOT NULL,
    ingredient_id UUID,
    quantity NUMERIC DEFAULT 1,
    price_per_unit_cents BIGINT DEFAULT 0,
    total_amount_cents BIGINT DEFAULT 0,
    requestor_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'Pending',
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for requisitions" ON requisitions FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- 4. Tasks (If missing)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id),
    assignee_role TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Todo',
    created_date TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for tasks" ON tasks FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- 5. Projects (If missing)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    client_contact_id UUID REFERENCES contacts(id),
    status TEXT DEFAULT 'Planning',
    start_date DATE,
    end_date DATE,
    budget_cents BIGINT DEFAULT 0,
    progress INT DEFAULT 0,
    reference_id TEXT,
    ai_alerts JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for projects" ON projects FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
