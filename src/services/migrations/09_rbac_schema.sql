-- MIGRATION: 09 RBAC Schema
-- Purpose: Add 'permissions' column to job_roles and seed role-specific access tags.

-- 1. Add Permissions Column
ALTER TABLE public.job_roles
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- 2. Seed Permissions & New Roles (Using DO block for logic)
DO $$
DECLARE
    org_id UUID;
    dept_finance UUID;
    dept_kitchen UUID;
    dept_service UUID;
    dept_logistics UUID;
BEGIN
    -- Get Main Org
    SELECT id INTO org_id FROM public.organizations LIMIT 1;

    IF org_id IS NOT NULL THEN
        
        -- A. Create Finance Department if missing
        SELECT id INTO dept_finance FROM public.departments WHERE organization_id = org_id AND name = 'Finance';
        
        IF dept_finance IS NULL THEN
            INSERT INTO public.departments (organization_id, name) VALUES (org_id, 'Finance') RETURNING id INTO dept_finance;
        END IF;

        -- B. Ensure 'Kitchen', 'Service', 'Logistics' Ids are grabbed
        SELECT id INTO dept_kitchen FROM public.departments WHERE organization_id = org_id AND name = 'Kitchen';
        SELECT id INTO dept_service FROM public.departments WHERE organization_id = org_id AND name = 'Service';
        SELECT id INTO dept_logistics FROM public.departments WHERE organization_id = org_id AND name = 'Logistics';

        -- C. Update / Insert Roles with Permissions

        -- 1. FINANCE (Bookkeeper/Officer)
        -- Check if exists, else insert
        PERFORM 1 FROM public.job_roles WHERE organization_id = org_id AND title = 'Finance Officer';
        IF NOT FOUND THEN
             INSERT INTO public.job_roles (organization_id, department_id, title, band, salary_min, salary_mid, salary_max, permissions) VALUES
            (org_id, dept_finance, 'Finance Officer', 3, 20000000, 25000000, 30000000, ARRAY['access:finance', 'access:finance_bookkeeping', 'access:team_chat', 'access:docs', 'access:self_hr']);
        ELSE
            UPDATE public.job_roles SET permissions = ARRAY['access:finance', 'access:finance_bookkeeping', 'access:team_chat', 'access:docs', 'access:self_hr'] 
            WHERE organization_id = org_id AND title = 'Finance Officer';
        END IF;

        -- CFO (If exists or add?) - Let's assume we update if exists, or maybe add 'Finance Manager'
        PERFORM 1 FROM public.job_roles WHERE organization_id = org_id AND title = 'Finance Manager';
        IF NOT FOUND THEN
             INSERT INTO public.job_roles (organization_id, department_id, title, band, salary_min, salary_mid, salary_max, permissions) VALUES
            (org_id, dept_finance, 'Finance Manager', 5, 60000000, 70000000, 80000000, ARRAY['access:finance', 'access:finance_all', 'access:dashboard', 'access:inventory_fixed_assets', 'access:crm', 'access:reports', 'access:team_chat', 'access:docs', 'access:self_hr']);
        ELSE
             UPDATE public.job_roles SET permissions = ARRAY['access:finance', 'access:finance_all', 'access:dashboard', 'access:inventory_fixed_assets', 'access:crm', 'access:reports', 'access:team_chat', 'access:docs', 'access:self_hr']
             WHERE organization_id = org_id AND title = 'Finance Manager';
        END IF;


        -- 2. KITCHEN (Chef, Cook, etc)
        UPDATE public.job_roles SET permissions = ARRAY['access:inventory', 'access:inventory_ingredients', 'access:inventory_offerings', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND department_id = dept_kitchen;
        
        -- Executive Chef gets more
        UPDATE public.job_roles SET permissions = ARRAY['access:inventory', 'access:inventory_all', 'access:catering', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND title = 'Executive Chef';


        -- 3. LOGISTICS (Logistics Officer)
        UPDATE public.job_roles SET permissions = ARRAY['access:inventory', 'access:inventory_reusables', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND title = 'Logistics Officer';
        
        -- Logistics Manager
        UPDATE public.job_roles SET permissions = ARRAY['access:inventory', 'access:inventory_all', 'access:projects', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND title = 'Logistics Manager';


        -- 4. SERVICE (Banquet Manager, Event Coordinator)
        
        -- Banquet Manager
        UPDATE public.job_roles SET permissions = ARRAY['access:catering', 'access:projects', 'access:crm', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND title = 'Banquet Manager';

        -- Event Coordinator
        UPDATE public.job_roles SET permissions = ARRAY['access:projects', 'access:catering', 'access:inventory_reusables', 'access:crm', 'access:reports', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND title = 'Event Coordinator';
        
        -- Head Waiter
        UPDATE public.job_roles SET permissions = ARRAY['access:catering', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND title = 'Head Waiter';
        
        -- Waiter/Cleaner
        UPDATE public.job_roles SET permissions = ARRAY['access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND department_id = dept_service AND title IN ('Waiter/Server', 'Cleaner', 'Runner/Busser');


        -- 5. STOCK KEEPER (If exists in Logistics generally)
        UPDATE public.job_roles SET permissions = ARRAY['access:inventory', 'access:inventory_all', 'access:team_chat', 'access:docs', 'access:self_hr']
        WHERE organization_id = org_id AND title = 'Stock Keeper';
        
    END IF;
END $$;
