-- CREATE AUTH USER FOR XQ-0010
-- Reason: The user exists in 'employees' but not 'auth.users', preventing login.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    emp_record RECORD;
    new_user_id UUID;
BEGIN
    -- 1. Fetch Employee Details
    SELECT * INTO emp_record FROM public.employees WHERE staff_id = 'XQ-0010';
    
    IF emp_record.id IS NULL THEN
        RAISE EXCEPTION 'Employee XQ-0010 not found!';
    END IF;

    -- 2. Check if Auth User exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = emp_record.email) THEN
        RAISE NOTICE 'Auth user already exists for %', emp_record.email;
        -- Reset password just in case
        UPDATE auth.users
        SET encrypted_password = crypt('password123', gen_salt('bf'))
        WHERE email = emp_record.email;
    ELSE
        -- 3. Create Auth User
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            emp_record.id, -- Use existing Employee ID to link them
            'authenticated',
            'authenticated',
            emp_record.email,
            crypt('password123', gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            json_build_object('full_name', emp_record.first_name || ' ' || emp_record.last_name),
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created Auth User for %', emp_record.email;
    END IF;

    -- 4. Ensure Profile Link
    INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
    VALUES (
        emp_record.id,
        emp_record.email,
        'Logistics Manager', -- Set Role explicitly
        emp_record.first_name || ' ' || emp_record.last_name,
        emp_record.avatar
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'Logistics Manager';

END $$;

SELECT 'Logistics User Created/Reset' as status;
