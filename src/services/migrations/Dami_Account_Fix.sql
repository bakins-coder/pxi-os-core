-- ====================================================================
-- PASSWORD RESET: Dami Adebayo (XQ-0013)
-- ====================================================================
-- This script resets the password for the recently onboarded staff 
-- whose initial password was cut off in the UI.

DO $$
DECLARE
    v_email TEXT := 'xq-0013@xquisite.local';
    v_password TEXT := 'Welcome@2026';
BEGIN
    -- 1. Reset the password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE email = v_email;

    -- 2. Diagnostic Output
    IF FOUND THEN
        RAISE NOTICE '✓ Password for % has been reset to: %', v_email, v_password;
    ELSE
        RAISE WARNING 'Account % not found. Please verify the Staff ID.', v_email;
    END IF;
END $$;

-- 3. Verification Query
SELECT 
    'AUTH_STATUS' as check_type,
    email,
    id as user_uuid,
    email_confirmed_at
FROM auth.users 
WHERE email = 'xq-0013@xquisite.local';
