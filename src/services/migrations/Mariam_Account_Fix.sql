-- ====================================================================
-- FINAL FIX: Align Staff Login with Activation Flow
-- ====================================================================

-- 1. UPDATE RPC: Match the "Activate Profile" logic from Auth.tsx
-- This ensures that XQ-0005 resolves to xq-0005@xquisite.local
CREATE OR REPLACE FUNCTION get_email_by_staff_id(lookup_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If it's an Xquisite Staff ID, use the .local identity (Source of Truth for Auth)
    IF lookup_id ILIKE 'XQ-%' THEN
        RETURN LOWER(TRIM(lookup_id)) || '@xquisite.local';
    END IF;

    -- Otherwise lookup email from employees table
    RETURN (
        SELECT email 
        FROM public.employees 
        WHERE TRIM(staff_id) ILIKE TRIM(lookup_id) 
        LIMIT 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_staff_id(text) TO anon, authenticated, service_role;

-- 2. RESET .LOCAL IDENTITY
-- We reset the password for the account she actually created during "Activation".
DO $$
DECLARE
    v_temp_email TEXT := 'xq-0005@xquisite.local';
    v_password TEXT := 'welcome123';
BEGIN
    -- Update the confirmed status and password for the identity she ACTIVATED
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE email = v_temp_email;

    -- Diagnostic print
    IF FOUND THEN
        RAISE NOTICE '✓ Staff Account % reset to %', v_temp_email, v_password;
    ELSE
        RAISE WARNING 'Account % not found. She might need to click "Sign Up" as XQ-0005 once more.', v_temp_email;
    END IF;
END $$;

-- 3. VERIFICATION QUERY
SELECT 
    'RPC_TEST' as test, 
    get_email_by_staff_id('XQ-0005') as result
UNION ALL
SELECT 
    'AUTH_CHECK' as test, 
    email || ' (Password reset: SUCCESS)'
FROM auth.users 
WHERE email = 'xq-0005@xquisite.local';
