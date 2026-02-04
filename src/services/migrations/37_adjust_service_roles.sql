-- MIGRATION: 37 Adjust Service Roles Hierarchy
-- Purpose: Make Banquet Manager lower than Event Coordinator

DO $$
BEGIN
    -- 1. Promote Event Coordinator to Band 5 (Top Tier Service Role)
    UPDATE public.job_roles
    SET 
        band = 5,
        salary_min = 50000000,
        salary_mid = 60000000,
        salary_max = 70000000
    WHERE title = 'Event Coordinator';

    -- 2. Demote Banquet Manager to Band 4 (Mid-Management)
    UPDATE public.job_roles
    SET 
        band = 4,
        salary_min = 35000000,
        salary_mid = 40000000,
        salary_max = 45000000
    WHERE title = 'Banquet Manager';
    
END $$;
