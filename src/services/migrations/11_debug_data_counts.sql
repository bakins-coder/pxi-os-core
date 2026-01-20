-- DIAGNOSTIC: 11 Debug Data Counts (Table Output)
-- Purpose: Verify if data exists (Visible Row vs Unlinked vs Deleted)

WITH target_org AS (
    SELECT id, name FROM public.organizations LIMIT 1
)
SELECT
    o.name as target_org_name,
    o.id as target_org_id,
    
    -- 1. Profiles (Users)
    (SELECT COUNT(*) FROM public.profiles WHERE organization_id = o.id) as linked_profiles_count,
    
    -- 2. Employees (HR Data)
    (SELECT COUNT(*) FROM public.employees WHERE organization_id = o.id) as linked_employees_count,
    (SELECT COUNT(*) FROM public.employees) as total_employees_in_table, -- If this is > 0 but linked is 0, data is Unlinked.
    
    -- 3. Departments
    (SELECT COUNT(*) FROM public.departments WHERE organization_id = o.id) as departments_count,
    
    -- 4. Job Roles
    (SELECT COUNT(*) FROM public.job_roles WHERE organization_id = o.id) as job_roles_count

FROM target_org o;
