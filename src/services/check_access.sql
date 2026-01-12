-- TEST RLS ACCESS FOR tomiwab@hotmail.com
-- This simulates what the frontend "Auto-Reset" logic is trying to do.

DO $$
DECLARE
    target_user_id UUID;
    profile_check RECORD;
    org_check RECORD;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'tomiwab@hotmail.com';
    RAISE NOTICE 'Testing access for User ID: %', target_user_id;

    -- SIMULATE AUTH CONTEXT (Approximation for testing logic, actual RLS test needs 'set local role')
    -- Note: We can't perfectly simulate 'auth.uid()' in a DO block without impersonation, 
    -- but we can check the table policies if we had access to system catalogs.
    
    -- Instead, let's just inspect the ROWS directly to ensure they exist and look correct.
    -- If the user can't select them via the API, it's due to policies.

    -- 1. Check Profile existence
    SELECT * INTO profile_check FROM public.profiles WHERE id = target_user_id;
    IF profile_check IS NULL THEN
        RAISE NOTICE 'FAIL: Profile row not found for user (even as admin).';
    ELSE
        RAISE NOTICE 'SUCCESS: Profile found. Org ID: %', profile_check.organization_id;
    END IF;

    -- 2. Check Organization existence
    IF profile_check.organization_id IS NOT NULL THEN
        SELECT * INTO org_check FROM public.organizations WHERE id = profile_check.organization_id;
        IF org_check IS NULL THEN
             RAISE NOTICE 'FAIL: Linked Organization not found (even as admin).';
        ELSE
             RAISE NOTICE 'SUCCESS: Organization found. Name: %', org_check.name;
        END IF;
    END IF;

END $$;

-- 2. LIST ACTIVE POLICIES on profiles and organizations
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'organizations');
