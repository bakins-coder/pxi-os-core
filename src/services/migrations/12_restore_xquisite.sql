-- MIGRATION: 12 Restore Xquisite Data Context
-- Purpose: Locate the 'Xquisite' organization and force-link all user and employee data to it.

DO $$
DECLARE
    target_org_id UUID;
    target_name TEXT;
    
    count_profiles INT;
    count_employees INT;
BEGIN
    -- 1. Find Xquisite explicitly (Case Insensitive)
    SELECT id, name INTO target_org_id, target_name 
    FROM public.organizations 
    WHERE name ILIKE '%Xquisite%' 
    ORDER BY created_at ASC -- Prefer the oldest/original if duplicates
    LIMIT 1;

    IF target_org_id IS NULL THEN
        -- Fallback: If no 'Xquisite' name found, try to use the specific ID from your screenshot if we knew it, 
        -- but for now rely on name.
        RAISE EXCEPTION 'Could not find an Organization named Xquisite!';
    END IF;

    RAISE NOTICE 'Found Target Organization: % (ID: %)', target_name, target_org_id;

    -- 2. Link ALL Profiles to Xquisite
    UPDATE public.profiles 
    SET organization_id = target_org_id
    WHERE organization_id IS NULL OR organization_id != target_org_id;
    
    GET DIAGNOSTICS count_profiles = ROW_COUNT;
    RAISE NOTICE 'Re-linked % Profiles to Xquisite.', count_profiles;

    -- 3. Link ALL Employees to Xquisite
    UPDATE public.employees 
    SET organization_id = target_org_id
    WHERE organization_id IS NULL OR organization_id != target_org_id;

    GET DIAGNOSTICS count_employees = ROW_COUNT;
    RAISE NOTICE 'Re-linked % Employees to Xquisite.', count_employees;

    -- 4. Link Infrastructure (Departments, Roles, contacts)
    UPDATE public.departments SET organization_id = target_org_id WHERE organization_id != target_org_id;
    UPDATE public.job_roles SET organization_id = target_org_id WHERE organization_id != target_org_id;
    UPDATE public.contacts SET company_id = target_org_id WHERE company_id != target_org_id;

    RAISE NOTICE 'SUCCESS: Application Context Restored to %.', target_name;

END $$;
