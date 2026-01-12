-- RESTORE/CREATE USER SCRIPT
-- This will ensure the user exists and has the correct password.

DO $$
DECLARE
    target_email TEXT := 'toxsyyb@yahoo.co.uk';
    target_password TEXT := 'welcome123';
    new_user_id UUID;
BEGIN
    -- 1. Try to find the user
    SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;

    -- 2. If not found, create the user
    IF new_user_id IS NULL THEN
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            role,
            aud,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            target_email,
            crypt(target_password, gen_salt('bf')),
            now(), -- Confirm immediately
            '{"provider":"email","providers":["email"]}',
            '{"name": "Restored Admin"}',
            now(),
            now()
        );
        
        RAISE NOTICE 'User created with ID: %', new_user_id;
    ELSE
        RAISE NOTICE 'User already exists (ID: %). RESETTING password...', new_user_id;
        UPDATE auth.users 
        SET encrypted_password = crypt(target_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = new_user_id;
    END IF;

    -- 3. Ensure Identity exists (Critical for logins)
    -- Delete existing validty to avoid conflict if partial state
    DELETE FROM auth.identities WHERE user_id = new_user_id;

    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id, -- use user_id as identity_id (common pattern) or gen_random_uuid()
        new_user_id,
        target_email,
        format('{"sub":"%s","email":"%s"}', new_user_id, target_email)::jsonb,
        'email',
        now(),
        now(),
        now()
    );

    RAISE NOTICE 'Identity linked/restored.';
END $$;
