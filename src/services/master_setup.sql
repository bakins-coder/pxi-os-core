-- MASTER SETUP SCRIPT
-- Run this entire script to ensure ALL tables exist and security is enabled.

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    currency TEXT DEFAULT 'NGN',
    brand_color TEXT,
    setup_complete BOOLEAN DEFAULT false,
    enabled_modules TEXT[],
    agent_mode TEXT,
    firs_tin TEXT,
    annual_turnover_cents BIGINT,
    integrations TEXT[],
    api_keys JSONB,
    size TEXT,
    logo TEXT,
    address TEXT,
    contact_phone TEXT,
    contact_person JSONB,
    bank_info JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    company_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Base Tables (Safe to re-run)
DO $$ BEGIN
    CREATE POLICY "Users can see their own organization" ON organizations FOR SELECT USING (id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update their own organization" ON organizations FOR UPDATE USING (id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can see other users in the same company" ON users FOR SELECT USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Inventory
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

-- 5. Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    sentiment_score FLOAT DEFAULT 0.5,
    industry TEXT,
    registration_number TEXT,
    contact_person TEXT,
    address TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for contacts" ON contacts FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    contact_id UUID REFERENCES contacts(id),
    number TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    total_cents BIGINT DEFAULT 0,
    paid_amount_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for invoices" ON invoices FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Chart of Accounts (Financials)
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

-- 8. Bank Transactions (Financials)
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    amount_cents BIGINT DEFAULT 0,
    type TEXT NOT NULL, 
    category TEXT,
    contact_id UUID REFERENCES contacts(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for bank_transactions" ON bank_transactions FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. Other Tables (Bookkeeping, Employees, Events, Tasks, Projects, Requisitions)
CREATE TABLE IF NOT EXISTS bookkeeping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount_cents BIGINT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    receipt_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bookkeeping ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for bookkeeping" ON bookkeeping FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    salary_cents BIGINT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for employees" ON employees FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS catering_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    client_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    guest_count INT,
    status TEXT DEFAULT 'Confirmed',
    total_amount_cents BIGINT,
    menu_items JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE catering_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation for catering_events" ON catering_events FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
DO $$ BEGIN CREATE POLICY "Tenant isolation for tasks" ON tasks FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
DO $$ BEGIN CREATE POLICY "Tenant isolation for projects" ON projects FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
DO $$ BEGIN CREATE POLICY "Tenant isolation for requisitions" ON requisitions FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
