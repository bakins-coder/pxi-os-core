-- MIGRATION: 08 Department Matrix Schema
-- Purpose: Move hardcoded department/role configuration to DB for flexibility.

-- 1. Create Departments Table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Job Roles Table
CREATE TABLE public.job_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id), -- Denormalized for easier RLS
    title TEXT NOT NULL,
    band INT NOT NULL CHECK (band BETWEEN 1 AND 5),
    salary_min BIGINT NOT NULL, -- Stored in Cents
    salary_mid BIGINT NOT NULL,
    salary_max BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Departments
CREATE POLICY "Tenant Isolation for Departments" ON public.departments
FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Job Roles
CREATE POLICY "Tenant Isolation for Job Roles" ON public.job_roles
FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);


-- 5. Seed Initial Data (Xquisite Default)
-- We use a DO block to dynamically find the Org ID if possible, or insert for 'Platform' context
DO $$
DECLARE
    org_id UUID;
    dept_kitchen UUID;
    dept_service UUID;
    dept_logistics UUID;
BEGIN
    -- Attempt to find the main Xquisite Org (Modify this query if multiple orgs exist)
    -- This assumes we are seeding for the first/main organization found.
    SELECT id INTO org_id FROM public.organizations LIMIT 1;

    IF org_id IS NOT NULL THEN
        
        -- KITCHEN
        INSERT INTO public.departments (organization_id, name) VALUES (org_id, 'Kitchen') RETURNING id INTO dept_kitchen;
        
        INSERT INTO public.job_roles (organization_id, department_id, title, band, salary_min, salary_mid, salary_max) VALUES
        (org_id, dept_kitchen, 'Executive Chef', 5, 50000000, 60000000, 70000000),
        (org_id, dept_kitchen, 'Kitchen Manager', 4, 35000000, 40000000, 45000000),
        (org_id, dept_kitchen, 'Sous Chef', 4, 30000000, 35000000, 40000000),
        (org_id, dept_kitchen, 'Chef', 3, 20000000, 25000000, 30000000),
        (org_id, dept_kitchen, 'Line Cook', 2, 13000000, 15000000, 17000000),
        (org_id, dept_kitchen, 'Kitchen Assistant', 1, 8000000, 10000000, 12000000);

        -- SERVICE
        INSERT INTO public.departments (organization_id, name) VALUES (org_id, 'Service') RETURNING id INTO dept_service;

        INSERT INTO public.job_roles (organization_id, department_id, title, band, salary_min, salary_mid, salary_max) VALUES
        (org_id, dept_service, 'Banquet Manager', 5, 50000000, 60000000, 70000000),
        (org_id, dept_service, 'Event Coordinator', 4, 30000000, 35000000, 40000000),
        (org_id, dept_service, 'Head Waiter', 3, 20000000, 23000000, 26000000),
        (org_id, dept_service, 'Waiter/Server', 2, 13000000, 15000000, 17000000),
        (org_id, dept_service, 'Cleaner', 1, 7000000, 8500000, 10000000),
        (org_id, dept_service, 'Runner/Busser', 1, 8000000, 10000000, 12000000);

        -- LOGISTICS
        INSERT INTO public.departments (organization_id, name) VALUES (org_id, 'Logistics') RETURNING id INTO dept_logistics;

        INSERT INTO public.job_roles (organization_id, department_id, title, band, salary_min, salary_mid, salary_max) VALUES
        (org_id, dept_logistics, 'Logistics Manager', 4, 30000000, 35000000, 40000000),
        (org_id, dept_logistics, 'Logistics Officer', 3, 20000000, 25000000, 30000000),
        (org_id, dept_logistics, 'Stock Keeper', 3, 18000000, 22000000, 26000000),
        (org_id, dept_logistics, 'Driver', 2, 10000000, 12000000, 14000000);

    END IF;
END $$;
