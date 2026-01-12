-- INSPECT SKIPPED SETUP STATUS
-- Using correct column: organization_id

DO $$
DECLARE
    target_email TEXT := 'tomiwab@hotmail.com';
    user_rec RECORD;
    profile_rec RECORD;
    org_rec RECORD;
BEGIN
    SELECT * INTO user_rec FROM auth.users WHERE email = target_email;
    
    IF user_rec IS NULL THEN
        RAISE NOTICE 'User NOT FOUND';
        RETURN;
    END IF;

    SELECT * INTO profile_rec FROM public.profiles WHERE id = user_rec.id;
    
    RAISE NOTICE 'User Role: %', profile_rec.role;
    RAISE NOTICE 'Org ID in Profile: %', profile_rec.organization_id;

    IF profile_rec.organization_id IS NOT NULL THEN
        SELECT * INTO org_rec FROM public.organizations WHERE id = profile_rec.organization_id;
        RAISE NOTICE 'Org Name: %', org_rec.name;
        RAISE NOTICE 'Org Setup Complete: %', org_rec.setup_complete;
    ELSE
        RAISE NOTICE 'WARNING: No Organization Linked in Profile!';
    END IF;
END $$;
