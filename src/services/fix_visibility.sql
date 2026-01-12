-- FIX VISIBILITY
-- The data is in Org ID X, but the User is likely linked to Org ID Y (or NULL).
-- This script forces the User to be linked to the Organization where the data is.

DO $$
DECLARE
    target_email TEXT := 'tomiwab@hotmail.com';
    target_org_id UUID;
    target_org_name TEXT;
BEGIN
    -- 1. Find the ID where the data actually is (we know it starts with Xquisite)
    SELECT id, name INTO target_org_id, target_org_name
    FROM organizations 
    WHERE name LIKE 'Xquisite%' 
    LIMIT 1;

    IF target_org_id IS NULL THEN
         RAISE EXCEPTION 'Could not find Xquisite Organization';
    END IF;

    RAISE NOTICE 'Found Data Organization: % (%)', target_org_name, target_org_id;

    -- 2. Update Profile to point to this Org
    UPDATE public.profiles
    SET organization_id = target_org_id,
        role = 'Admin'
    WHERE id = (SELECT id FROM auth.users WHERE email = target_email);

    -- 3. Update Auth Metadata (Crucial for Session/RLS)
    UPDATE auth.users
    SET raw_user_meta_data = 
        jsonb_set(
            jsonb_set(raw_user_meta_data, '{company_id}', to_jsonb(target_org_id)),
            '{role}', '"Admin"'
        )
    WHERE email = target_email;

    RAISE NOTICE '✅ SUCCESS: User % re-linked to %.', target_email, target_org_name;
    RAISE NOTICE '👉 IMPORTANT: You MUST Sign Out and Sign In again for this to take effect.';
END $$;
