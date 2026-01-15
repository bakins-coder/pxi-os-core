-- SQL Fix for Missing Tables
-- Run this script in the Supabase SQL Editor to create the missing tables.

-- 1. Invoices Table
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
    lines JSONB DEFAULT '[]'::jsonb, -- Found in TypeScript interface
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for invoices" ON invoices;
CREATE POLICY "Tenant isolation for invoices" ON invoices FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);


-- 2. Bookkeeping Table
-- This corresponds to the 'BookkeepingEntry' interface in the frontend
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

-- Enable RLS for Bookkeeping
ALTER TABLE bookkeeping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for bookkeeping" ON bookkeeping;
CREATE POLICY "Tenant isolation for bookkeeping" ON bookkeeping FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);

-- 3. Grant permissions (optional but recommended if using authenticated role)
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON bookkeeping TO authenticated;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON bookkeeping TO service_role;
