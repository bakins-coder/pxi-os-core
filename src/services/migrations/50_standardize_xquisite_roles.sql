-- MIGRATION: 50 Standardize Xquisite Roles
-- Purpose: Enforce standard permission matrix for Xquisite Celebrations Limited.

DO $$
DECLARE
    org_id UUID;
    v_role_id UUID;
BEGIN
    -- 1. Get Xquisite Org ID
    SELECT id INTO org_id FROM public.organizations WHERE name ILIKE 'Xquisite%' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE WARNING '❌ Xquisite Org NOT FOUND. Aborting.';
        RETURN;
    END IF;

    RAISE NOTICE '--- SATANDARDIZING ROLES FOR ORG: % ---', org_id;

    -- ==========================================
    -- 1. EXECUTIVE LEVEL (Band 6 & 0)
    -- ==========================================
    
    -- Chairman (Band 0, Super Access)
    UPDATE public.job_roles 
    SET band = 0, permissions = ARRAY['*'] 
    WHERE organization_id = org_id AND title = 'Chairman';
    
    -- CEO (Band 6, Super Access)
    -- Ensure CEO exists
    IF NOT EXISTS (SELECT 1 FROM public.job_roles WHERE organization_id = org_id AND title = 'CEO') THEN
        INSERT INTO public.job_roles (organization_id, department_id, title, band, permissions, salary_min, salary_max)
        SELECT org_id, id, 'CEO', 6, ARRAY['*'], 0, 0 FROM public.departments WHERE organization_id = org_id AND name = 'Executive' LIMIT 1;
    ELSE
         UPDATE public.job_roles SET band = 6, permissions = ARRAY['*'] WHERE organization_id = org_id AND title = 'CEO';
    END IF;

    -- ==========================================
    -- 2. MANAGEMENT LEVEL (Band 5)
    -- ==========================================

    -- General Manager / Admin
    UPDATE public.job_roles 
    SET band = 5, 
        permissions = ARRAY['access:dashboard', 'access:hr', 'access:finance', 'access:settings', 'access:projects', 'access:crm', 'access:reports', 'access:team_chat', 'access:docs'] 
    WHERE organization_id = org_id AND title IN ('General Manager', 'Admin', 'Administrator', 'Manager');

    -- HR Manager
    UPDATE public.job_roles 
    SET band = 5,
        permissions = ARRAY['access:hr', 'access:team_chat', 'access:docs', 'access:self_hr']
    WHERE organization_id = org_id AND title = 'HR Manager';

    -- ==========================================
    -- 3. SALES & MARKETING (Band 3-4)
    -- ==========================================
    
    -- Sales Manager
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:crm', 'access:projects', 'access:calendar', 'access:reports', 'access:team_chat']
    WHERE organization_id = org_id AND title = 'Sales Manager';

    -- Sales Representative / Agent
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:crm', 'access:calendar', 'access:team_chat']
    WHERE organization_id = org_id AND title IN ('Sales Representative', 'Sales Agent', 'Agent');

    -- ==========================================
    -- 4. OPERATIONS & CATERING (Band 3-4)
    -- ==========================================

    -- Event Manager / Coordinator
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:projects', 'access:catering', 'access:inventory', 'access:calendar', 'access:team_chat']
    WHERE organization_id = org_id AND title IN ('Event Manager', 'Event Coordinator', 'Planner');

    -- Head Waiter
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:catering', 'access:inventory_reusables', 'access:team_chat']
    WHERE organization_id = org_id AND title = 'Head Waiter';

    -- Kitchen Staff (Chef)
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:inventory', 'access:catering', 'access:team_chat']
    WHERE organization_id = org_id AND title IN ('Executive Chef', 'Chef', 'Cook');

    -- ==========================================
    -- 5. LOGISTICS (Band 2-3)
    -- ==========================================
    
    -- Logistics Officer / Driver
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:inventory', 'access:projects', 'access:team_chat']
    WHERE organization_id = org_id AND title IN ('Logistics Officer', 'Driver', 'Logistics Manager');


    RAISE NOTICE '✅ Roles Standardized.';

END $$;
