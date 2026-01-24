-- DIAGNOSTIC: 43 Verify Super Admin Access
-- Purpose: Verify if 'akinb@hotmail.com' (or others) have the super admin flag and can see data.

DO $$
DECLARE
    v_email TEXT := 'akinb@hotmail.com'; -- Using one of the confirmed existing users
    v_is_super BOOLEAN;
    v_profile_id UUID;
    v_org_count INT;
BEGIN
    -- 1. Check Flag
    SELECT id, is_super_admin INTO v_profile_id, v_is_super 
    FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = v_email);

    IF v_profile_id IS NULL THEN
        RAISE WARNING '❌ User % not found in profiles.', v_email;
    ELSIF v_is_super IS TRUE THEN
        RAISE NOTICE '✅ User % is a SUPER ADMIN.', v_email;
    ELSE
        RAISE WARNING '❌ User % is found but is_super_admin is FALSE/NULL.', v_email;
    END IF;

    -- 2. Verify RLS (Simulation)
    -- We can't truly "simulate" RLS bypass in a DO block efficiently without SET ROLE (which requires DB ownership),
    -- but we can verify the function works.
    
    IF (SELECT public.is_super_admin()) THEN
         RAISE NOTICE 'Current SQL Runner has Super Admin privileges (via function check).';
    ELSE
         RAISE NOTICE 'Current SQL Runner does NOT have Super Admin privileges (expected if running as Service Role or Anon).';
    END IF;

END $$;
