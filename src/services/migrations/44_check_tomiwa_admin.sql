-- DIAGNOSTIC: 44 Check Tomiwa Super Admin
-- Purpose: Verify if 'tomiwab@hotmail.com' is a super admin.

DO $$
DECLARE
    v_email TEXT := 'tomiwab@hotmail.com';
    v_profile_id UUID;
    v_is_super BOOLEAN;
BEGIN
    SELECT id, is_super_admin INTO v_profile_id, v_is_super 
    FROM public.profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = v_email);

    IF v_profile_id IS NULL THEN
        RAISE WARNING '❌ User % not found in profiles.', v_email;
    ELSIF v_is_super IS TRUE THEN
        RAISE NOTICE '✅ User % is a SUPER ADMIN. (Flag is TRUE)', v_email;
    ELSE
        RAISE WARNING '❌ User % found but is_super_admin is FALSE/NULL.', v_email;
        RAISE NOTICE 'Suggestion: Run Migration 39 again.';
    END IF;
END $$;
