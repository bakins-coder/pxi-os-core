-- FORCE ACCESS REPAIR
-- This script HARDCODES the specific Organization ID we found to verify fixes.
-- Org ID: 10959119-72e4-4e57-ba54-923e36bba6a6 (Xquisite Celebrations Limited)
-- User: tomiwab@hotmail.com

DO $$
DECLARE
    target_org_id UUID := '10959119-72e4-4e57-ba54-923e36bba6a6';
    target_user_email TEXT := 'tomiwab@hotmail.com';
    target_user_id UUID;
BEGIN
    -- Get User ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    -- 1. FIX AUTH METADATA (The "Keys" to the house)
    -- We completely overwrite it to be safe and clean.
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
        'company_id', target_org_id,
        'role', 'Admin',
        'full_name', 'Tomiwa B',
        'firstName', 'Tomiwa',
        'lastName', 'B'
    )
    WHERE id = target_user_id;
    RAISE NOTICE '✅ Auth Metadata updated (Role=Admin, Org=Xquisite)';

    -- 2. FIX PUBLIC PROFILE (The "ID Card")
    UPDATE public.profiles
    SET organization_id = target_org_id,
        role = 'Admin'
    WHERE id = target_user_id;
    RAISE NOTICE '✅ Public Profile updated.';

    -- 3. FIX ORGANIZATION OWNER (The "Deed")
    UPDATE public.organizations
    SET owner_id = target_user_id
    WHERE id = target_org_id;
    RAISE NOTICE '✅ Organization Owner updated.';

    -- 4. ENSURE EMPLOYEE RECORD (The "Directory Entry")
    -- This fixes the "People Page is empty" issue.
    INSERT INTO public.employees (company_id, name, role, email, status, salary_cents)
    VALUES (target_org_id, 'Tomiwa B', 'Admin', target_user_email, 'Active', 0)
    ON CONFLICT (id) DO NOTHING;
    
    -- If conflict on ID is tricky, check by email manually:
    IF NOT EXISTS (SELECT 1 FROM employees WHERE email = target_user_email AND company_id = target_org_id) THEN
         INSERT INTO public.employees (company_id, name, role, email, status, salary_cents)
         VALUES (target_org_id, 'Tomiwa B', 'Admin', target_user_email, 'Active', 0);
         RAISE NOTICE '✅ Employee Record created for Tomiwa.';
    ELSE
         RAISE NOTICE 'ℹ️ Employee Record already exists.';
    END IF;

    RAISE NOTICE '🚀 REPAIR COMPLETE. Please SIGN OUT and SIGN IN.';

END $$;
