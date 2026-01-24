-- FIX JOSEPH ACCOUNT (Metadata & Tokens)
-- Combined script to fix:
-- 1. Missing raw_app_meta_data (Critical for Login)
-- 2. NULL tokens (Standardize to empty string)

DO $$
DECLARE
    target_email text;
    emp_name text;
BEGIN
    SELECT email, first_name || ' ' || last_name INTO target_email, emp_name 
    FROM public.employees WHERE staff_id = 'XQ-0010';

    RAISE NOTICE 'Fixing ALL fields for: %', target_email;

    -- Update auth.users
    UPDATE auth.users
    SET 
        -- Fix Metadata
        raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
        raw_user_meta_data = json_build_object('full_name', emp_name),
        aud = 'authenticated',
        role = 'authenticated',
        
        -- Fix Tokens (Standardize to empty string)
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        
        updated_at = NOW()
    WHERE email = target_email;

END $$;

SELECT 'Account Fully Repaired for XQ-0010' as status;
