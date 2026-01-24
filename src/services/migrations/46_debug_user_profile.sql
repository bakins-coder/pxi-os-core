-- DIAGNOSTIC: 46 Deep Dive on Specific User
-- Purpose: Inspect the state of User ID '3e8d990c-b0b9-47d0-9726-bab7925b61d5'

DO $$
DECLARE
    v_user_id UUID := '3e8d990c-b0b9-47d0-9726-bab7925b61d5';
    v_auth_email TEXT;
    v_profile_exists BOOLEAN;
    v_is_super BOOLEAN;
    v_profile_role TEXT;
BEGIN
    -- 1. Check Auth Table
    SELECT email INTO v_auth_email FROM auth.users WHERE id = v_user_id;
    
    IF v_auth_email IS NULL THEN
        RAISE WARNING 'CRITICAL: User ID % does not exist in auth.users table!', v_user_id;
        RETURN;
    ELSE
        RAISE NOTICE 'Found Auth User: %', v_auth_email;
    END IF;

    -- 2. Check Profile Table
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        RAISE WARNING 'CRITICAL: User % has no row in public.profiles!', v_auth_email;
        
        -- Auto-Fix Attempt: Create the missing profile
        INSERT INTO public.profiles (id, email, name, role, is_super_admin)
        VALUES (v_user_id, v_auth_email, 'Admin User', 'Admin', true);
        
        RAISE NOTICE 'FIX APPLIED: Created missing profile for % and set is_super_admin = TRUE.', v_auth_email;
    ELSE
        -- 3. Check Flags
        SELECT is_super_admin, role INTO v_is_super, v_profile_role 
        FROM public.profiles WHERE id = v_user_id;
        
        RAISE NOTICE 'Profile Found. Role: %, SuperAdmin Flag: %', v_profile_role, v_is_super;
        
        IF v_is_super IS NOT TRUE THEN
            UPDATE public.profiles SET is_super_admin = true WHERE id = v_user_id;
            RAISE NOTICE 'FIX APPLIED: Forced is_super_admin to TRUE for %', v_auth_email;
        END IF;
    END IF;

END $$;
