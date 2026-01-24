-- MIGRATION: Mass Password Reset
-- Purpose: Set a default password 'Xquisite2025!' for all existing staff to flatten the login issues.
-- Exceptions: Does NOT touch 'tomiwab@hotmail.com' or 'toxsyyb@yahoo.co.uk'.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    target_count INT;
BEGIN
    -- 1. Identify Target Audience
    -- Users who are linked to employees OR exist in the system (safety check via email match)
    SELECT count(*) INTO target_count
    FROM auth.users
    WHERE email NOT IN ('tomiwab@hotmail.com', 'toxsyyb@yahoo.co.uk'); -- Broad safety net, or narrow it down to employees table linkage

    RAISE NOTICE 'Targeting % users for password reset...', target_count;

    -- 2. Update Passwords
    -- We use pgcrypto's crypt function to generate a valid bcrypt hash for 'Xquisite2025!'
    UPDATE auth.users
    SET encrypted_password = crypt('Xquisite2025!', gen_salt('bf')),
        updated_at = now(),
        raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{provider}', '"email"') -- Ensure they are treated as email providers
    WHERE email NOT IN ('tomiwab@hotmail.com', 'toxsyyb@yahoo.co.uk');
    
    RAISE NOTICE '✅ SUCCESS: passwords reset to "Xquisite2025!" for regular staff.';
    RAISE NOTICE 'ℹ️ Admin accounts (Tomiwa/Tox) were skipped.';
END $$;
