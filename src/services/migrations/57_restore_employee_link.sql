-- RESTORE EMPLOYEE LINK (Constraint-Free)
-- Uses PL/pgSQL to check existence logic manually to avoid "ON CONFLICT" errors.

DO $$
DECLARE
    target_email text := 'toxsyyb@yahoo.co.uk';
    target_staff_id text := 'XQ-0001';
    org_id uuid;
BEGIN
    -- 1. Get a valid Organization ID
    SELECT id INTO org_id FROM public.organizations WHERE name ILIKE 'Xquisite%' LIMIT 1;
    -- Fallback if specific org not found
    IF org_id IS NULL THEN
        SELECT id INTO org_id FROM public.organizations LIMIT 1;
    END IF;

    -- 2. Logic: Check Staff ID first (Primary ident for employment)
    IF EXISTS (SELECT 1 FROM public.employees WHERE staff_id = target_staff_id) THEN
        UPDATE public.employees
        SET email = target_email,
            role = 'Admin',
            status = 'active',
            first_name = COALESCE(first_name, 'Tomiwa'),
            last_name = COALESCE(last_name, 'B')
        WHERE staff_id = target_staff_id;
        RAISE NOTICE '✓ FOUND Staff ID % -> Updated Email to %', target_staff_id, target_email;
        
    -- 3. Logic: Check Email second (If ID wasn't found but email exists)
    ELSIF EXISTS (SELECT 1 FROM public.employees WHERE email = target_email) THEN
        UPDATE public.employees
        SET staff_id = target_staff_id,
            role = 'Admin',
            status = 'active',
             first_name = COALESCE(first_name, 'Tomiwa'),
            last_name = COALESCE(last_name, 'B')
        WHERE email = target_email;
        RAISE NOTICE '✓ FOUND Email % -> Assigned Staff ID %', target_email, target_staff_id;
        
    -- 4. Logic: Insert New Record (If neither found)
    ELSE
        INSERT INTO public.employees (
            organization_id, first_name, last_name, email, staff_id, role, status
        ) VALUES (
            org_id, 'Tomiwa', 'B', target_email, target_staff_id, 'Admin', 'active'
        );
        RAISE NOTICE '✓ INSERTED New Employee: % (%)', target_email, target_staff_id;
    END IF;
END $$;
