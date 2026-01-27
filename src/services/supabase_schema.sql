-- Supabase Schema for Paradigm-Xi OS (Multi-tenant)
-- Enable Row Level Security (RLS) on all tables

-- Organizations
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
CREATE POLICY "Users can see their own organization" ON organizations FOR SELECT USING (id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
CREATE POLICY "Admins can update their own organization" ON organizations FOR UPDATE USING (id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Users
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
CREATE POLICY "Users can see other users in the same company" ON users FOR SELECT USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Inventory
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
CREATE POLICY "Tenant isolation for inventory" ON inventory FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Contacts
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
CREATE POLICY "Tenant isolation for contacts" ON contacts FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Invoices
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
CREATE POLICY "Tenant isolation for invoices" ON invoices FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Bookkeeping
CREATE TABLE IF NOT EXISTS bookkeeping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount_cents BIGINT NOT NULL,
    reference_id TEXT,
    contact_id UUID REFERENCES contacts(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookkeeping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for bookkeeping" ON bookkeeping FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Catering Events
CREATE TABLE IF NOT EXISTS catering_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    customer_name TEXT,
    event_date DATE NOT NULL,
    location TEXT,
    guest_count INT,
    status TEXT,
    current_phase TEXT,
    readiness_score INT,
    items JSONB,
    tasks JSONB,
    hardware_checklist JSONB,
    financials JSONB,
    banquet_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE catering_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for catering_events" ON catering_events FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    dob DATE,
    gender TEXT,
    address TEXT,
    date_of_employment DATE,
    role TEXT NOT NULL,
    salary_cents BIGINT,
    status TEXT NOT NULL,
    kpis TEXT[],
    avatar TEXT,
    id_card_issued_date DATE,
    health_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employees" ON employees FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    employee_id UUID NOT NULL, -- references employees(id) theoretically, but loosely coupled for now
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    employee_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for leave_requests" ON leave_requests FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- Requisitions (Loans/Procurement)
CREATE TABLE IF NOT EXISTS requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES organizations(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    estimated_cost_cents BIGINT,
    priority TEXT,
    status TEXT DEFAULT 'Pending',
    requestor_id TEXT,
    date_required DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for requisitions" ON requisitions FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
