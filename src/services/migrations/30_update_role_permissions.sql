-- MIGRATION: 30 Update Role Permissions
-- Purpose: Implement the exact permission matrix provided by the data sheet.

DO $$
DECLARE
    org_id UUID;
BEGIN
    -- Get Main Org (Assuming single org context for now, or apply to all)
    -- Ideally we apply this to the specific org, but let's apply to the roles logic
    
    -- 1. BASELINE: Everyone gets basic access
    -- NOTE: 'access:self_hr', 'access:team_chat', 'access:docs' are implied for all, but we will add them explicitly
    
    -- 2. CEO & ADMIN (Full Access)
    UPDATE public.job_roles 
    SET permissions = ARRAY['*'] 
    WHERE title IN ('CEO', 'Admin', 'Super Admin', 'Administrator');

    -- 3. FINANCE
    -- Bookkeeper
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:finance', 'access:finance_bookkeeping', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%Bookkeeper%';

    -- CFO / Finance Manager
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:finance', 'access:finance_all', 'access:dashboard', 'access:inventory_reusables', 'access:inventory_fixed_assets', 'access:crm', 'access:reports', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title IN ('CFO', 'Finance Manager');

    -- 4. LOGISTICS & INVENTORY
    -- Logistics Officer
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:inventory', 'access:inventory_reusables', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%Logistics Officer%';

    -- Storekeeper / Stock Keeper
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:inventory', 'access:inventory_all', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%Stock Keeper%' OR title ILIKE '%Storekeeper%';

    -- 5. KITCHEN
    -- Executive Chef, Kitchen Manager
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:inventory', 'access:inventory_ingredients', 'access:inventory_offerings', 'access:catering', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title IN ('Executive Chef', 'Kitchen Manager');

    -- 6. SERVICE / CATERING
    -- Head Waiter
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:catering', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%Head Waiter%';

    -- Banquet Manager
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:catering', 'access:projects', 'access:crm', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%Banquet Manager%';

    -- Event Coordinator
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:projects', 'access:catering', 'access:inventory_reusables', 'access:crm', 'access:reports', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%Event Coordinator%';

    -- 7. HR
    -- HR Manager
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:hr', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%HR Manager%';
    
    -- 8. SALES
    -- Sales Manager
    UPDATE public.job_roles 
    SET permissions = ARRAY['access:crm', 'access:team_chat', 'access:docs', 'access:self_hr'] 
    WHERE title ILIKE '%Sales Manager%';

END $$;
