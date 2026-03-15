-- MIGRATION: 70 Grant Catering Access to Logistics Officers
-- Purpose: Enable Logistics Officers (Joseph Ozero, Opeyemi Olamilekan) to view Catering Ops.

DO $$
DECLARE
    org_id UUID;
    count_updated INT;
BEGIN
    -- 1. Get Xquisite Org ID (Standard for this tenancy)
    SELECT id INTO org_id FROM public.organizations WHERE name ILIKE 'Xquisite%' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE WARNING '❌ Xquisite Org NOT FOUND. Aborting.';
        RETURN;
    END IF;

    RAISE NOTICE '--- UPDATING LOGISTICS OFFICER PERMISSIONS FOR ORG: % ---', org_id;

    -- 2. Update Logistics Officer Role
    -- We append 'access:catering' if it's not already there. 
    -- Actually, to be safe and clean, we can just set the array to the desired state 
    -- based on the previous standard + the new permission.
    -- Previous standard (from 50_standardize_xquisite.sql): 
    -- ARRAY['access:inventory', 'access:projects', 'access:team_chat']
    -- New standard:
    -- ARRAY['access:inventory', 'access:catering', 'access:projects', 'access:team_chat']
    
    WITH updated_rows AS (
        UPDATE public.job_roles 
        SET permissions = ARRAY['access:inventory', 'access:catering', 'access:projects', 'access:team_chat']
        WHERE organization_id = org_id 
          AND title = 'Logistics Officer'
        RETURNING 1
    )
    SELECT COUNT(*) INTO count_updated FROM updated_rows;

    IF count_updated > 0 THEN
        RAISE NOTICE '✅ Successfully updated Logistics Officer role with access:catering';
    ELSE
        RAISE WARNING '⚠️ No "Logistics Officer" role found to update!';
    END IF;

END $$;
