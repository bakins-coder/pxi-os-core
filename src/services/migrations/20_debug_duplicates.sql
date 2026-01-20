-- MIGRATION: 20 Debug Duplicates
-- Purpose: Check for duplicate emails and hidden staff IDs

DO $$
DECLARE
    tomiwa_count INT;
    xq0002_count INT;
    ceo_count INT;
BEGIN
    -- Check how many rows have Tomiwa's email
    SELECT COUNT(*) INTO tomiwa_count FROM public.employees WHERE email = 'tomiwab@hotmail.com';
    RAISE NOTICE 'Count of tomiwab@hotmail.com: %', tomiwa_count;

    -- Check if XQ-0002 exists (even with whitespace)
    SELECT COUNT(*) INTO xq0002_count FROM public.employees WHERE TRIM(staff_id) = 'XQ-0002';
    RAISE NOTICE 'Count of XQ-0002 (trimmed): %', xq0002_count;

    -- Check CEO count
    SELECT COUNT(*) INTO ceo_count FROM public.employees WHERE role = 'Chief Executive Officer';
    RAISE NOTICE 'Count of CEOs: %', ceo_count;
END $$;

-- Check duplicate emails generally
SELECT email, COUNT(*)
FROM public.employees
GROUP BY email
HAVING COUNT(*) > 1;

-- List all info for Tomiwa to decide which to keep
SELECT id, email, role, staff_id, created_at 
FROM public.employees 
WHERE email = 'tomiwab@hotmail.com';
