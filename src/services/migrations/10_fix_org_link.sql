-- MIGRATION: 10 Fix Organization Linkage & RBAC
-- Purpose: Ensure the current user and data are linked to the main Organization.

DO $$
DECLARE
    main_org_id UUID;
    dept_count INT;
    role_count INT;
BEGIN
    SELECT id INTO main_org_id FROM public.organizations LIMIT 1;

    IF main_org_id IS NOT NULL THEN
        -- 1. Fix Profiles
        UPDATE public.profiles
        SET organization_id = main_org_id
        WHERE organization_id IS NULL OR organization_id != main_org_id;
        
        -- 2. Fix Employees
        UPDATE public.employees
        SET organization_id = main_org_id
        WHERE organization_id IS NULL OR organization_id != main_org_id;

        -- 3. Verify Perms
        SELECT COUNT(*) INTO role_count FROM public.job_roles WHERE organization_id = main_org_id AND permissions IS NOT NULL;
        
        RAISE NOTICE 'Fixed linkage to Org: %. Active Roles: %', main_org_id, role_count;
    END IF;
END $$;
