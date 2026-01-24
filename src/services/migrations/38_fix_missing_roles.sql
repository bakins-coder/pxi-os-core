-- MIGRATION: 38 Fix Missing Roles and Permissions
-- Purpose: Address gaps found in diagnostic (CEO missing perms, Admin/Cook missing roles).

DO $$
DECLARE
    org_id UUID;
    dept_executive UUID;
    dept_kitchen UUID;
BEGIN
    -- 0. Get Context
    SELECT id INTO org_id FROM organizations LIMIT 1;

    -- 1. Ensure Departments Exists
    -- Executive (for Admin)
    SELECT id INTO dept_executive FROM departments WHERE organization_id = org_id AND name = 'Executive';
    IF dept_executive IS NULL THEN
        INSERT INTO departments (organization_id, name) VALUES (org_id, 'Executive') RETURNING id INTO dept_executive;
    END IF;

    -- Kitchen (for Cook)
    SELECT id INTO dept_kitchen FROM departments WHERE organization_id = org_id AND name = 'Kitchen';
    IF dept_kitchen IS NULL THEN
        INSERT INTO departments (organization_id, name) VALUES (org_id, 'Kitchen') RETURNING id INTO dept_kitchen;
    END IF;


    -- 1.5 Ensure Band 6 is allowed (Re-applying logic from migr 16 just in case)
    BEGIN
        ALTER TABLE public.job_roles DROP CONSTRAINT IF EXISTS job_roles_band_check;
        ALTER TABLE public.job_roles ADD CONSTRAINT job_roles_band_check CHECK (band BETWEEN 1 AND 6);
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if already done or permission issue, usually fine in DO block
    END;

    -- 2. Fix CEO Permissions
    UPDATE public.job_roles 
    SET permissions = ARRAY['*'] 
    WHERE title = 'Chief Executive Officer';

    -- 3. Add 'Admin' Role if missing
    IF NOT EXISTS (SELECT 1 FROM public.job_roles WHERE title = 'Admin') THEN
        INSERT INTO public.job_roles (title, department_id, permissions, organization_id, band, salary_min, salary_mid, salary_max)
        VALUES ('Admin', dept_executive, ARRAY['*'], org_id, 5, 0, 0, 0);
    ELSE
        UPDATE public.job_roles SET permissions = ARRAY['*'] WHERE title = 'Admin';
    END IF;

    -- 4. Standardize 'cook' to 'Cook' in employees table
    UPDATE public.employees 
    SET role = 'Cook' 
    WHERE role = 'cook';

    -- 5. Add 'Cook' Role if missing
    IF NOT EXISTS (SELECT 1 FROM public.job_roles WHERE title = 'Cook') THEN
        INSERT INTO public.job_roles (title, department_id, permissions, organization_id, band, salary_min, salary_mid, salary_max)
        VALUES ('Cook', dept_kitchen, ARRAY['access:inventory', 'access:inventory_ingredients', 'access:catering', 'access:team_chat', 'access:docs', 'access:self_hr'], org_id, 2, 0, 0, 0);
    END IF;

END $$;
