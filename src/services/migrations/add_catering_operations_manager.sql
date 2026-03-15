-- MIGRATION: Add Catering Operations Manager Role
-- Purpose: Add 'Catering Operations Manager' at Band 5 to the Service department.

DO $$
DECLARE
    org_id UUID;
    dept_service_id UUID;
BEGIN
    -- Find the organisation ID
    SELECT id INTO org_id FROM public.organizations LIMIT 1;

    IF org_id IS NOT NULL THEN
        -- Find the Service department for this organisation
        SELECT id INTO dept_service_id
        FROM public.departments
        WHERE organization_id = org_id AND name = 'Service';

        IF dept_service_id IS NOT NULL THEN
            -- Insert the new role if it doesn't already exist
            INSERT INTO public.job_roles (
                organization_id, department_id, title, band,
                salary_min, salary_mid, salary_max
            )
            SELECT
                org_id,
                dept_service_id,
                'Catering Operations Manager',
                5,
                50000000,   -- ₦500,000 min
                60000000,   -- ₦600,000 mid
                70000000    -- ₦700,000 max
            WHERE NOT EXISTS (
                SELECT 1 FROM public.job_roles
                WHERE organization_id = org_id
                  AND title = 'Catering Operations Manager'
            );

            RAISE NOTICE 'Catering Operations Manager (Band 5) added to Service department.';
        ELSE
            RAISE WARNING 'Service department not found for org_id: %', org_id;
        END IF;
    ELSE
        RAISE WARNING 'No organisation found. Migration skipped.';
    END IF;
END $$;
