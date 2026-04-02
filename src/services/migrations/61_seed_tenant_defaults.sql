-- MIGRATION: 61 Seed Tenant Defaults
-- Purpose: Address the 'Access Denied' issue for new tenants by seeding missing departments and job roles.

DO $$
DECLARE
    org_record RECORD;
    dept_executive_id UUID;
    dept_operations_id UUID;
BEGIN
    FOR org_record IN SELECT id, name FROM organizations LOOP
        -- RAISE NOTICE 'Processing Organization: % (%)', org_record.name, org_record.id;

        -- 1. Ensure 'Executive' Department Exists
        SELECT id INTO dept_executive_id FROM departments WHERE organization_id = org_record.id AND (name = 'Executive' OR name = 'Administration');
        IF dept_executive_id IS NULL THEN
            INSERT INTO departments (organization_id, name) VALUES (org_record.id, 'Executive') RETURNING id INTO dept_executive_id;
        END IF;

        -- 2. Ensure 'Operations' Department Exists
        SELECT id INTO dept_operations_id FROM departments WHERE organization_id = org_record.id AND (name = 'Operations' OR name = 'Production');
        IF dept_operations_id IS NULL THEN
            INSERT INTO departments (organization_id, name) VALUES (org_record.id, 'Operations') RETURNING id INTO dept_operations_id;
        END IF;

        -- 3. Ensure 'Chief Executive Officer' (CEO) Role Exists
        IF NOT EXISTS (SELECT 1 FROM job_roles WHERE organization_id = org_record.id AND (title = 'Chief Executive Officer' OR title = 'CEO' OR title = 'Managing Director')) THEN
            INSERT INTO job_roles (organization_id, department_id, title, band, permissions, salary_min, salary_mid, salary_max)
            VALUES (org_record.id, dept_executive_id, 'Chief Executive Officer', 6, ARRAY['*'], 0, 0, 0);
        ELSE
            -- Ensure existing CEO has full permissions
            UPDATE job_roles SET permissions = ARRAY['*'] WHERE organization_id = org_record.id AND (title = 'Chief Executive Officer' OR title = 'CEO' OR title = 'Managing Director');
        END IF;

        -- 4. Ensure 'Admin' Role Exists
        IF NOT EXISTS (SELECT 1 FROM job_roles WHERE organization_id = org_record.id AND title = 'Admin') THEN
            INSERT INTO job_roles (organization_id, department_id, title, band, permissions, salary_min, salary_mid, salary_max)
            VALUES (org_record.id, dept_executive_id, 'Admin', 5, ARRAY['*'], 0, 0, 0);
        END IF;

        -- 5. Ensure 'Manager' Role Exists
        IF NOT EXISTS (SELECT 1 FROM job_roles WHERE organization_id = org_record.id AND title = 'Manager') THEN
            INSERT INTO job_roles (organization_id, department_id, title, band, permissions, salary_min, salary_mid, salary_max)
            VALUES (org_record.id, dept_operations_id, 'Manager', 4, ARRAY['access:dashboard', 'access:hr', 'access:finance', 'access:inventory', 'access:crm', 'access:reports'], 0, 0, 0);
        END IF;

    END LOOP;
    
    -- Final check on band constraint (just in case)
    ALTER TABLE IF EXISTS public.job_roles DROP CONSTRAINT IF EXISTS job_roles_band_check;
    ALTER TABLE IF EXISTS public.job_roles ADD CONSTRAINT job_roles_band_check CHECK (band BETWEEN 0 AND 10);

END $$;
