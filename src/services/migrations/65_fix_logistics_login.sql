-- FIX LOGIN FOR XQ-0010 (Definitive)
-- Check Email, Ensure Auth User, Force Password.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    emp_record RECORD;
BEGIN
    -- 1. Get Employee Info
    SELECT * INTO emp_record FROM public.employees WHERE staff_id = 'XQ-0010';

    IF emp_record.id IS NULL THEN
        RAISE EXCEPTION 'Employee XQ-0010 was not found in public.employees.';
    END IF;

    RAISE NOTICE 'Found Employee: % (Email: %)', emp_record.staff_id, emp_record.email;

    -- 2. Upsert Auth User (Ensure it exists and has correct password)
    -- We use ON CONFLICT to update if exists.
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        emp_record.id, -- Force ID match
        'authenticated',
        'authenticated',
        emp_record.email,
        crypt('password123', gen_salt('bf')), -- Force Password
        NOW(), -- Force Confirmed
        NOW(),
        NOW(),
        json_build_object('full_name', emp_record.first_name || ' ' || emp_record.last_name)
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        updated_at = NOW();

    -- 3. Sync Profile
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (emp_record.id, emp_record.email, 'Logistics Manager', emp_record.first_name || ' ' || emp_record.last_name)
    ON CONFLICT (id) DO UPDATE
    SET role = 'Logistics Manager';

END $$;

SELECT 'Login Fixed for XQ-0010' as status;
