-- FIX HR PERSISTENCE ISSUES
-- This script does two things:
-- 1. Links your user profile explicitly to 'Xquisite Celebrations Limited' to ensure you have permission.
-- 2. Resets the security policies on the 'employees' table to allow you to Add/Edit staff.

-- PART 1: SELF-HEAL PROFILE
-- Force update your profile to point to Xquisite
UPDATE profiles 
SET organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6' 
WHERE id = auth.uid();

-- PART 2: FIX RLS POLICIES
-- Enable Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Tenant isolation for employees" ON employees;
DROP POLICY IF EXISTS "Enable read access for users based on organization_id" ON employees;
DROP POLICY IF EXISTS "Enable insert access for users based on organization_id" ON employees;
DROP POLICY IF EXISTS "Enable update access for users based on organization_id" ON employees;

-- Create a single, permissive policy for your organization
CREATE POLICY "Tenant isolation for employees" ON employees 
FOR ALL 
USING (company_id = '10959119-72e4-4e57-ba54-923e36bba6a6' OR company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id = '10959119-72e4-4e57-ba54-923e36bba6a6' OR company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Verify Fix
-- You should see the organization ID below if Part 1 worked
SELECT id, email, organization_id FROM profiles WHERE id = auth.uid();
