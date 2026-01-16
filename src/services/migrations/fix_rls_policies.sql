-- Fix RLS Policies to use Profiles table instead of JWT metadata
-- This resolves issues where user_metadata in the JWT is stale or missing.

-- 1. Employees
DROP POLICY IF EXISTS "Tenant isolation for employees" ON employees;
CREATE POLICY "Tenant isolation for employees" ON employees 
FOR ALL 
USING (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 2. Chart of Accounts
DROP POLICY IF EXISTS "Tenant isolation for chart_of_accounts" ON chart_of_accounts;
CREATE POLICY "Tenant isolation for chart_of_accounts" ON chart_of_accounts 
FOR ALL 
USING (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 3. Inventory (Preventative)
DROP POLICY IF EXISTS "Tenant isolation for inventory" ON inventory;
CREATE POLICY "Tenant isolation for inventory" ON inventory 
FOR ALL 
USING (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 4. Contacts (Preventative)
DROP POLICY IF EXISTS "Tenant isolation for contacts" ON contacts;
CREATE POLICY "Tenant isolation for contacts" ON contacts 
FOR ALL 
USING (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 5. Ledger Transactions (Preventative - note check for tenant_id vs company_id)
-- Original table ledgers used 'tenant_id'. Verify column name from create_tables.
-- 01_create_tables.sql uses 'tenant_id'.
DROP POLICY IF EXISTS "Tenant isolation for ledger_transactions" ON ledger_transactions;
CREATE POLICY "Tenant isolation for ledger_transactions" ON ledger_transactions 
FOR ALL 
USING (tenant_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
