-- DIAGNOSTIC & FIX: 45 Force Super Admin
-- Purpose: Force 'tomiwab@hotmail.com' -> is_super_admin = true

DO $$
DECLARE
    v_email TEXT := 'tomiwab@hotmail.com';
    v_rows_updated INT;
BEGIN
    -- 1. Perform Update (Case-Insensitive)
    UPDATE public.profiles
    SET is_super_admin = true
    WHERE id IN (
        SELECT id FROM auth.users 
        WHERE LOWER(email) = LOWER(v_email)
    );
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    -- 2. Report Result
    IF v_rows_updated > 0 THEN
        RAISE NOTICE '✅ SUCCESS: User % is now a SUPER ADMIN. (Updated % rows)', v_email, v_rows_updated;
    ELSE
        RAISE WARNING '❌ FAILURE: Could not find user % in profiles table.', v_email;
        RAISE NOTICE 'Check if the user has signed up and has a profile row.';
    END IF;

END $$;
