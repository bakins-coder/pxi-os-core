-- RESET PASSWORD FOR XQ-0010 (Logistics)
-- The user is getting "Invalid Credentials", so we must reset the auth password.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    target_email text;
BEGIN
    -- 1. Find the email for XQ-0010
    SELECT email INTO target_email
    FROM public.employees
    WHERE staff_id = 'XQ-0010';

    IF target_email IS NULL THEN
        RAISE EXCEPTION 'Staff ID XQ-0010 not found in employees table.';
    END IF;

    RAISE NOTICE 'Resetting password for: %', target_email;

    -- 2. Update Auth User Password (to 'password123')
    UPDATE auth.users
    SET encrypted_password = crypt('password123', gen_salt('bf'))
    WHERE email = target_email;
    
    -- 3. Ensure Profile Role is correct (Logistics Officer / Manager)
    UPDATE public.profiles
    SET role = 'Logistics Manager' -- Assuming Manager based on title
    WHERE email = target_email;

END $$;

SELECT 'Password Reset Complete' as status;
