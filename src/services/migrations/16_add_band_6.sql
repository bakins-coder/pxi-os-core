-- MIGRATION: 16 Enable Band 6 and Update CEO
-- Purpose: Allow Band 6 in schema and upgrade CEO role.

DO $$
DECLARE
    ceo_role_id UUID;
BEGIN
    -- 1. Modify Schema to allow Band 6
    -- We need to drop the existing check constraint and add a new one.
    -- Constraint name is usually 'job_roles_band_check' but we'll try to catch it dynamically or just DROP CONSTRAINT IF EXISTS
    
    BEGIN
        ALTER TABLE public.job_roles DROP CONSTRAINT IF EXISTS job_roles_band_check;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Constraint drop failed or not found: %', SQLERRM;
    END;

    -- Add new constraint
    ALTER TABLE public.job_roles ADD CONSTRAINT job_roles_band_check CHECK (band BETWEEN 1 AND 6);

    -- 2. Update CEO Role
    -- Find the ID
    SELECT id INTO ceo_role_id FROM public.job_roles WHERE title = 'Chief Executive Officer' LIMIT 1;

    IF ceo_role_id IS NOT NULL THEN
        UPDATE public.job_roles
        SET 
            band = 6,
            -- Update Salary to be significantly higher (5M - 10M NGN)
            -- 5,000,000 * 100 = 500,000,000
            salary_min = 500000000, 
            salary_mid = 750000000,
            salary_max = 1000000000
        WHERE id = ceo_role_id;
        
        RAISE NOTICE 'CEO Role updated to Band 6 with new salary range.';
    ELSE
        RAISE NOTICE 'CEO Role not found. Please run Migration 15 first.';
    END IF;

END $$;
