-- MIGRATION: 13 Generate & List Staff IDs
-- Purpose: Ensure every employee has a Staff ID, then list them for distribution.

DO $$
DECLARE
    emp RECORD;
    -- Start counter high enough to avoid conflicts, or max existing
    max_id INT := 1000;
BEGIN
    -- OPTIONAL: Find max existing if any (e.g. XQ-1050 -> 1050)
    -- Simplified for robustness: just loop and fill nulls
    
    FOR emp IN SELECT id FROM public.employees WHERE staff_id IS NULL LOOP
        max_id := max_id + 1;
        UPDATE public.employees
        SET staff_id = 'XQ-' || max_id
        WHERE id = emp.id;
    END LOOP;
END $$;

SELECT 
    name, 
    staff_id, 
    role as job_title,
    status
FROM public.employees
ORDER BY staff_id ASC;
