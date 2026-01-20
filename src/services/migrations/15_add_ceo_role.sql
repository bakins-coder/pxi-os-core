-- MIGRATION: 15 Add CEO Role
-- Purpose: Add 'Executive' department and 'Chief Executive Officer' role.

DO $$
DECLARE
    target_org_id UUID;
    dept_exec UUID;
BEGIN
    -- 1. Find Xquisite Org
    SELECT id INTO target_org_id 
    FROM public.organizations 
    WHERE name ILIKE '%Xquisite%' 
    LIMIT 1;

    IF target_org_id IS NULL THEN
        RAISE EXCEPTION 'Xquisite Organization not found';
    END IF;

    -- 2. Create 'Executive' Department (if not exists)
    INSERT INTO public.departments (organization_id, name)
    VALUES (target_org_id, 'Executive')
    ON CONFLICT DO NOTHING; -- Note: 'name' isn't unique constraint usually, but we'll check existence to avoid dups if run twice
    
    -- Better safe existence check:
    SELECT id INTO dept_exec FROM public.departments WHERE organization_id = target_org_id AND name = 'Executive';
    
    IF dept_exec IS NULL THEN
        INSERT INTO public.departments (organization_id, name)
        VALUES (target_org_id, 'Executive')
        RETURNING id INTO dept_exec;
    END IF;

    -- 3. Add CEO Role
    -- Band 5 (Max), Salary ~1M - 2M NGN (stored as cents: x100)
    -- 1,000,000 * 100 = 100,000,000
    INSERT INTO public.job_roles (organization_id, department_id, title, band, salary_min, salary_mid, salary_max)
    VALUES (
        target_org_id, 
        dept_exec, 
        'Chief Executive Officer', 
        5, 
        100000000, -- 1M starts
        150000000, -- 1.5M mid
        200000000  -- 2M max
    );

    RAISE NOTICE 'Added Executive Department and CEO Role.';

END $$;
