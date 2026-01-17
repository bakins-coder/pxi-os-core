
-- MIGRATION: Fix Employees Table Schema
-- Run this in the Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS salary_cents bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_of_employment text,
ADD COLUMN IF NOT EXISTS dob text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS kpis jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS avatar text,
ADD COLUMN IF NOT EXISTS health_notes text;

-- 2. Migrate existing 'name' data to 'first_name' and 'last_name' (Basic split)
-- Only runs if 'name' column exists and has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'name') THEN
        UPDATE employees
        SET 
            first_name = split_part(name, ' ', 1),
            last_name = substring(name FROM position(' ' in name) + 1)
        WHERE first_name IS NULL;
    END IF;
END $$;

-- 3. Enable RLS (Security Best Practice)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policy (Tenant Isolation)
-- Allow users to see/edit employees belonging to their organization
DROP POLICY IF EXISTS "Tenant isolation for employees" ON employees;

CREATE POLICY "Tenant isolation for employees" ON employees
FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- 5. Verification Output
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees';
