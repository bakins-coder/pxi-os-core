-- MIGRATION: 49 Audit Xquisite Roles
-- Purpose: List all current roles and their permissions for Xquisite Celebrations to plan standardisation.

DO $$
DECLARE
    org_id UUID;
    v_role RECORD;
    v_emp RECORD;
BEGIN
    -- 1. Get Org ID
    SELECT id INTO org_id FROM public.organizations WHERE name ILIKE 'Xquisite%' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE WARNING '❌ Xquisite Org NOT FOUND';
        RETURN;
    END IF;

    RAISE NOTICE '--- AUDIT REPORT FOR: Xquisite Celebrations (%) ---', org_id;

    -- 2. Audit Roles
    RAISE NOTICE '--- ROLES & PERMISSIONS ---';
    FOR v_role IN SELECT * FROM public.job_roles WHERE organization_id = org_id ORDER BY band DESC LOOP
        RAISE NOTICE 'Rank % | % | % | Perms: %', v_role.band, v_role.title, v_role.salary_max, v_role.permissions;
    END LOOP;

    -- 3. Audit Key Employees
    RAISE NOTICE '--- KEY EMPLOYEES ---';
    FOR v_emp IN SELECT * FROM public.employees WHERE organization_id = org_id AND (role ILIKE '%Admin%' OR role ILIKE '%Manager%' OR role ILIKE '%Chair%' OR role ILIKE '%CEO%') ORDER BY name LOOP
         RAISE NOTICE '% | Role: % | Email: %', v_emp.name, v_emp.role, v_emp.email;
    END LOOP;

END $$;
