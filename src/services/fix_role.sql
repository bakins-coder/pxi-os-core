-- FIX ROLE MISMATCH
-- The app expects 'Admin', but we set 'system_admin'.
-- This script corrects it so the Sidebar menu items appear.

DO $$
DECLARE
    target_email TEXT := 'tomiwab@hotmail.com';
BEGIN
    -- 1. Update Profile Role
    UPDATE public.profiles
    SET role = 'Admin'  -- Must match Role.ADMIN in types.ts (Case Sensitive)
    WHERE id = (SELECT id FROM auth.users WHERE email = target_email);

    -- 2. Update User Metadata (for Session)
    UPDATE auth.users
    SET raw_user_meta_data = 
        jsonb_set(
            jsonb_set(raw_user_meta_data, '{role}', '"Admin"'),
            '{company_id}', 
            (SELECT to_jsonb(organization_id) FROM public.profiles WHERE id = auth.uid())
        )
    WHERE email = target_email;

    RAISE NOTICE 'Role updated to "Admin" for %', target_email;
END $$;
