DO $$
DECLARE
    emp_record RECORD;
    org_exists BOOLEAN;
BEGIN
    RAISE NOTICE '--- DEBUGGING STAFF ID XQ-0001 ---';

    -- 1. Check Employee
    SELECT * INTO emp_record FROM public.employees WHERE staff_id ILIKE 'XQ-0001';
    
    IF emp_record IS NULL THEN
        RAISE NOTICE '❌ Employee with staff_id XQ-0001 NOT FOUND.';
    ELSE
        RAISE NOTICE '✅ Employee Found: % (ID: %, Org: %)', emp_record.first_name || ' ' || emp_record.last_name, emp_record.id, emp_record.organization_id;

        -- 2. Check Organization Validity
        IF emp_record.organization_id IS NOT NULL THEN
            SELECT EXISTS(SELECT 1 FROM public.organizations WHERE id = emp_record.organization_id) INTO org_exists;
            IF org_exists THEN
                RAISE NOTICE '✅ Organization Link Valid.';
            ELSE
                RAISE NOTICE '❌ CRITICAL: Organization ID % does not exist in organizations table! This causes FK violation on Profile creation.', emp_record.organization_id;
            END IF;
        ELSE
            RAISE NOTICE '⚠️ Employee has NO Organization ID. Trigger inserts NULL organization_id into profiles. (Allowed?)';
        END IF;

        -- 3. Check for existing Profile/User linked to this employee
        IF emp_record.user_id IS NOT NULL THEN
             RAISE NOTICE 'ℹ️ Employee is already linked to User ID: %', emp_record.user_id;
        ELSE
             RAISE NOTICE 'ℹ️ Employee is NOT linked to any User ID yet.';
        END IF;
    END IF;

    -- 4. Check for existing Auth User with this email
    -- Note: We can only check public.profiles for hints as we can't query auth.users directly easily in DO block without context, 
    -- but usually we can check if a profile exists for this email.
    -- (Simulated check via profiles matching email)
    PERFORM * FROM public.profiles WHERE email ILIKE 'xq-0001@xquisite.local';
    IF FOUND THEN
        RAISE NOTICE 'ℹ️ A Profile already exists for xq-0001@xquisite.local.';
    ELSE
        RAISE NOTICE 'ℹ️ No Profile found for xq-0001@xquisite.local (User clean).';
    END IF;

END $$;
