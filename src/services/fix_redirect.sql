-- FIX REDIRECT LOOP FOR tomiwab@hotmail.com
-- This script ensures the user is linked to 'Xquisite Celebrations Limited' and the org is marked as 'Setup Complete'.

DO $$
DECLARE
    target_email TEXT := 'tomiwab@hotmail.com';
    target_org_name TEXT := 'Xquisite Celebrations Limited';
    user_id UUID;
    org_id UUID;
BEGIN
    -- 1. Get User
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User % NOT FOUND', target_email;
    END IF;

    -- 2. Find or Create Organization
    SELECT id INTO org_id FROM public.organizations WHERE name = target_org_name;
    
    IF org_id IS NULL THEN
        org_id := gen_random_uuid();
        INSERT INTO public.organizations (id, name, type, setup_complete)
        VALUES (org_id, target_org_name, 'Corporate', true);
        RAISE NOTICE 'Created new Organization: %', target_org_name;
    ELSE
        -- FORCE UPDATE setup_complete to TRUE
        UPDATE public.organizations 
        SET setup_complete = true 
        WHERE id = org_id;
        RAISE NOTICE 'Updated existing Organization: % (Marked Setup Complete)', target_org_name;
    END IF;

    -- 3. Link User to Organization
    UPDATE public.profiles
    SET 
        organization_id = org_id,
        role = 'system_admin'  -- Ensure they are an admin
    WHERE id = user_id;

    -- 4. Sync Auth Metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
        jsonb_build_object(
            'role', 'system_admin',
            'company_id', org_id,
            'name', 'Xquisite Admin' -- You can change this if needed
        )
    WHERE id = user_id;

    RAISE NOTICE 'User % successfully linked to % and setup marked complete.', target_email, target_org_name;
END $$;
