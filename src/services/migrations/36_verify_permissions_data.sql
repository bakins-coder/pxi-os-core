-- DIAGNOSTIC: Verify Employee Roles & Permissions Mapping
-- Purpose: Check if text roles in 'employees' match 'job_roles.title' and have permissions set.

DO $$
DECLARE
    role_record RECORD;
    perm_count INT;
BEGIN
    RAISE NOTICE '--- 1. SAMPLING EMPLOYEE ROLES ---';
    -- List distinct roles currently assigned to employees
    FOR role_record IN SELECT DISTINCT role, count(*) as c FROM public.employees GROUP BY role LOOP
        
        -- Check if this role exists in job_roles
        SELECT count(*) INTO perm_count 
        FROM public.job_roles 
        WHERE title = role_record.role OR title ILIKE role_record.role;

        IF perm_count > 0 THEN
             -- Check if permissions are actually populated
             SELECT array_length(permissions, 1) INTO perm_count
             FROM public.job_roles
             WHERE title = role_record.role OR title ILIKE role_record.role;
             
             IF perm_count > 0 THEN
                RAISE NOTICE '✅ Role "%" (used by % employees): FOUND in job_roles with % permissions.', role_record.role, role_record.c, perm_count;
             ELSE
                RAISE NOTICE '⚠️ Role "%" (used by % employees): FOUND but has NO permissions (NULL or Empty).', role_record.role, role_record.c;
             END IF;
        ELSE
             RAISE NOTICE '❌ Role "%" (used by % employees): NOT FOUND in job_roles table. (UI lookup will fail)', role_record.role, role_record.c;
        END IF;

    END LOOP;

    RAISE NOTICE '--- 2. CHECKING SPECIFIC EXAMPLES ---';
    -- Check a few key roles
    PERFORM * FROM public.job_roles WHERE title = 'Finance Manager' AND 'access:finance_all' = ANY(permissions);
    IF FOUND THEN RAISE NOTICE '✅ Finance Manager has access:finance_all'; ELSE RAISE NOTICE '❌ Finance Manager missing access:finance_all'; END IF;

    PERFORM * FROM public.job_roles WHERE title = 'Banquet Manager' AND 'access:catering' = ANY(permissions);
    IF FOUND THEN RAISE NOTICE '✅ Banquet Manager has access:catering'; ELSE RAISE NOTICE '❌ Banquet Manager missing access:catering'; END IF;

END $$;
