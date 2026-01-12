-- FIX USER PROFILE AND ORGANIZATION
-- This ensures the user is linked to a valid organization and has the correct role.

DO $$
DECLARE
    target_email TEXT := 'toxsyyb@yahoo.co.uk';
    user_id UUID;
    org_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found!', target_email;
    END IF;

    -- 2. Ensure Organization Exists
    SELECT id INTO org_id FROM public.organizations WHERE name = 'Xquisite Celebrations Limited';

    IF org_id IS NULL THEN
        org_id := gen_random_uuid();
        INSERT INTO public.organizations (id, name, type, setup_complete)
        VALUES (org_id, 'Xquisite Celebrations Limited', 'Corporate', true);
        RAISE NOTICE 'Created new Organization: Xquisite Celebrations Limited';
    ELSE
        RAISE NOTICE 'Found existing Organization ID: %', org_id;
    END IF;

    -- 3. Update Profile
    UPDATE public.profiles
    SET 
        full_name = 'Xquisite Admin',
        role = 'system_admin',
        organization_ = org_id,
        avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xquisite'
    WHERE id = user_id;

    -- 4. Sync Auth Metadata (Important for session RLS)
    UPDATE auth.users
    SET raw_user_meta_data = 
        jsonb_build_object(
            'name', 'Xquisite Admin',
            'role', 'system_admin',
            'company_id', org_id,
            'avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xquisite'
        )
    WHERE id = user_id;

    RAISE NOTICE 'User Profile and Metadata updated for System Admin.';
END $$;
