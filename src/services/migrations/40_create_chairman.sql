-- MIGRATION: 40 Create Chairman Role & Employee
-- Purpose: Create "Chairman" role (Band 0/Unpaid) and specific employee "Akin Braithwaite".

DO $$
DECLARE
    org_id UUID;
    dept_executive UUID;
    chairman_role_id UUID;
BEGIN
    -- 0. Get Context (Main Org)
    SELECT id INTO org_id FROM public.organizations WHERE name ILIKE 'Xquisite%' LIMIT 1;
    -- Fallback if not found by name
    IF org_id IS NULL THEN
        SELECT id INTO org_id FROM public.organizations LIMIT 1;
    END IF;

    -- 1. Get Executive Department
    SELECT id INTO dept_executive FROM public.departments WHERE organization_id = org_id AND name = 'Executive';
     IF dept_executive IS NULL THEN
        INSERT INTO public.departments (organization_id, name) VALUES (org_id, 'Executive') RETURNING id INTO dept_executive;
    END IF;


    -- 2. Allow Band 0 (Unpaid/Owner) in Job Roles
    -- We need to drop the constraint allowing 1-6 and allow 0-6.
    BEGIN
        ALTER TABLE public.job_roles DROP CONSTRAINT IF EXISTS job_roles_band_check;
        ALTER TABLE public.job_roles ADD CONSTRAINT job_roles_band_check CHECK (band BETWEEN 0 AND 6);
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if permission issue
    END;


    -- 3. Create 'Chairman' Role (Band 0, Unpaid)
    SELECT id INTO chairman_role_id FROM public.job_roles WHERE title = 'Chairman' AND organization_id = org_id;
    
    IF chairman_role_id IS NULL THEN
        INSERT INTO public.job_roles (
            organization_id, 
            department_id, 
            title, 
            band, 
            salary_min, 
            salary_mid, 
            salary_max, 
            permissions
        ) VALUES (
            org_id, 
            dept_executive, 
            'Chairman', 
            0, -- Specific Request: No Band (represented as 0)
            0, -- Unpaid
            0, 
            0, 
            ARRAY['*'] -- Full Permissions
        ) RETURNING id INTO chairman_role_id;
    ELSE
         -- Ensure it's Band 0 if it exists
         UPDATE public.job_roles SET band = 0 WHERE id = chairman_role_id;
    END IF;


    -- 4. Create Employee 'Akin Braithwaite'
    -- Check if email exists to avoid duplicate
    IF NOT EXISTS (SELECT 1 FROM public.employees WHERE email = 'akinbee@gmail.com') THEN
        INSERT INTO public.employees (
            organization_id, -- Correct column name
            name,
            first_name,
            last_name,
            email,
            role,
            status,
            dob,
            address,
            date_of_employment,
            salary_cents
        ) VALUES (
            org_id,
            'Akin Braithwaite',
            'Akin',
            'Braithwaite',
            'akinbee@gmail.com',
            'Chairman',
            'Active',
            '1958-01-30',
            'A23 Primrose Drive Pinnock Beach Estate',
            '2001-01-01',
            0 -- Unpaid
        );
        RAISE NOTICE '✅ Created Employee: Akin Braithwaite (Chairman)';
    ELSE
        RAISE NOTICE '⚠️ Employee with email akinbee@gmail.com already exists.';
        -- Update details to match request just in case
        UPDATE public.employees 
        SET 
            role = 'Chairman',
            name = 'Akin Braithwaite',
            first_name = 'Akin',
            last_name = 'Braithwaite',
            dob = '1958-01-30',
            address = 'A23 Primrose Drive Pinnock Beach Estate',
            date_of_employment = '2001-01-01'
        WHERE email = 'akinbee@gmail.com';
    END IF;

END $$;
