-- MIGRATION: 39 Enable Super Admin Access
-- Purpose: Allow specific users to bypass tenant isolation (ROW LEVEL SECURITY).

-- 1. Add 'is_super_admin' flag to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Define Super Admin Policy Logic (Helper Function for cleaner policies)
-- This function checks if the current user is a super admin.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- SECURITY DEFINER is crucial: it runs with owner permissions, bypassing RLS on 'profiles' table itself to check the flag.

-- 3. Update RLS Policies for Key Tables
-- We need to DROP existing policies and replace them with strict tenant isolation OR super admin access.
-- NOTE: We are modifying the "Select" (Read) policies primarily. Write access logic might remain tenant-scoped or full access depending on requirement.
-- For now, we grant Full Access to Super Admins.

DO $$
DECLARE
    table_name text;
BEGIN
    -- List of tables to update
    FOR table_name IN SELECT unnest(ARRAY[
        'organizations', 
        'employees', 
        'inventory', 
        'job_roles', 
        'departments',
        'chart_of_accounts',
        'ledger_transactions',
        'contacts'
    ]) LOOP
        
        -- Drop common existing isolation policies to avoid conflicts
        -- (Names might vary, trying common patterns from previous migrations)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation for %I" ON public.%I', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view own organization data" ON public.%I', table_name);
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Create NEW "Super Admin or Tenant" Policy
        -- Logic: User can access if Super Admin OR (standard company_id check)
        
        -- Special case: Organizations table usually doesn't have 'company_id', it has 'id'. 
        -- Others have 'company_id' or 'organization_id'.
        
        IF table_name = 'organizations' THEN
             EXECUTE format('
                CREATE POLICY "Super Admin or Tenant Access" ON public.%I
                FOR ALL USING (
                    public.is_super_admin() 
                    OR 
                    id = (auth.jwt() -> ''user_metadata'' ->> ''company_id'')::uuid
                )', table_name);
        
        ELSIF table_name = 'ledger_transactions' THEN
             -- Uses tenant_id
             EXECUTE format('
                CREATE POLICY "Super Admin or Tenant Access" ON public.%I
                FOR ALL USING (
                    public.is_super_admin() 
                    OR 
                    tenant_id = (auth.jwt() -> ''user_metadata'' ->> ''company_id'')::uuid
                )', table_name);
        
        ELSE
             -- Standard tables (employees, inventory, etc) use organization_id or company_id
             -- We need to check which column exists.
             -- Simplification: Most use 'company_id', but job_roles/departments use 'organization_id'
             IF table_name IN ('job_roles', 'departments', 'employees') THEN
                 EXECUTE format('
                    CREATE POLICY "Super Admin or Tenant Access" ON public.%I
                    FOR ALL USING (
                        public.is_super_admin() 
                        OR 
                        organization_id = (auth.jwt() -> ''user_metadata'' ->> ''company_id'')::uuid
                    )', table_name);
             ELSE
                 EXECUTE format('
                    CREATE POLICY "Super Admin or Tenant Access" ON public.%I
                    FOR ALL USING (
                        public.is_super_admin() 
                        OR 
                        company_id = (auth.jwt() -> ''user_metadata'' ->> ''company_id'')::uuid
                    )', table_name);
             END IF;
        END IF;
        
        RAISE NOTICE 'Updated Policy for table: %', table_name;
    END LOOP;
END $$;


-- 4. Grant Super Admin Privileges to Users
-- We update by Email (via auth.users -> profiles join)
DO $$
DECLARE
    target_email TEXT;
BEGIN
    FOR target_email IN SELECT unnest(ARRAY[
        'akinbee@gmail.com',
        'akinb@hotmail.com', 
        'tomiwab@hotmail.com', 
        'oreoluwatomiwab@gmail.com'
    ]) LOOP
        
        UPDATE public.profiles
        SET is_super_admin = true
        WHERE id IN (SELECT id FROM auth.users WHERE email = target_email);
        
        IF FOUND THEN
            RAISE NOTICE '✅ Promoted to Super Admin: %', target_email;
        ELSE
            RAISE NOTICE '⚠️ User not found (skipped): %', target_email;
        END IF;

    END LOOP;
END $$;
