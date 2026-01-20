-- MIGRATION: 25 Sync Profiles to Employees
-- Purpose: Force-update public.profiles to match public.employees organization_id.
-- This fixes the "Create Workspace" loop by ensuring the user profile knows its Organization.

DO $$
DECLARE
    updated_count INT;
BEGIN
    -- Update profiles where:
    -- 1. Email matches an employee
    -- 2. Organization ID is missing or different
    
    WITH updates AS (
        UPDATE public.profiles p
        SET organization_id = e.organization_id,
            role = e.role,
            full_name = TRIM(e.first_name || ' ' || e.last_name) -- Use correct column 'full_name'
        FROM auth.users u
        JOIN public.employees e ON e.email = u.email
        WHERE p.id = u.id
          AND (p.organization_id IS DISTINCT FROM e.organization_id OR p.role IS DISTINCT FROM e.role)
        RETURNING p.id
    )
    SELECT COUNT(*) INTO updated_count FROM updates;

    RAISE NOTICE 'Synced % profiles to their employee records.', updated_count;
    
    -- Also, strictly for the CEO and key staff, ensure they are linked if profile was missing entirely
    INSERT INTO public.profiles (id, organization_id, role, full_name)
    SELECT 
        u.id, 
        e.organization_id, 
        e.role, 
        TRIM(e.first_name || ' ' || e.last_name)
    FROM public.employees e
    JOIN auth.users u ON u.email = e.email
    ON CONFLICT (id) DO NOTHING;
    
END $$;
