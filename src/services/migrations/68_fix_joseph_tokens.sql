-- FIX JOSEPH TOKENS (Standardize to Empty String)
-- User reported these fields are NULL but should be Empty String like others.

DO $$
DECLARE
    target_email text;
BEGIN
    -- 1. Get Email for XQ-0010
    SELECT email INTO target_email FROM public.employees WHERE staff_id = 'XQ-0010';

    RAISE NOTICE 'Fixing tokens for: %', target_email;

    -- 2. Update auth.users
    -- Coalesce NULL to '' is usually done by application, but we force DB state here.
    UPDATE auth.users
    SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, '')
    WHERE email = target_email;
    
    -- Also force re-confirm just in case
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE email = target_email AND email_confirmed_at IS NULL;

END $$;

SELECT 'Tokens Standardized for XQ-0010' as status;
