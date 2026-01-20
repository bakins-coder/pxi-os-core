-- MIGRATION: 22 Assign Sequential IDs
-- Purpose: Assign specific IDs (0003, 0004, 0005) and ensure 0001/0002 are correct.

DO $$
BEGIN
    -- ---------------------------------------------------------
    -- 1. PRE-CLEANUP: Rename any IDs blocking our target slots
    -- ---------------------------------------------------------
    
    -- Blockers for XQ-0003
    UPDATE public.employees SET staff_id = 'OLD-' || id || '-0003' 
    WHERE staff_id = 'XQ-0003';

    -- Blockers for XQ-0004
    UPDATE public.employees SET staff_id = 'OLD-' || id || '-0004' 
    WHERE staff_id = 'XQ-0004';

    -- Blockers for XQ-0005
    UPDATE public.employees SET staff_id = 'OLD-' || id || '-0005' 
    WHERE staff_id = 'XQ-0005';

    -- ---------------------------------------------------------
    -- 2. ASSIGN SPECIFIC IDs
    -- ---------------------------------------------------------

    -- XQ-0001: CEO (Tokunbo)
    UPDATE public.employees 
    SET staff_id = 'XQ-0001' 
    WHERE email = 'toxsyyb@yahoo.co.uk';

    -- XQ-0002: Tomiwa
    UPDATE public.employees 
    SET staff_id = 'XQ-0002' 
    WHERE email = 'tomiwab@hotmail.com';

    -- XQ-0003: Mrs Olaboye Turayo
    UPDATE public.employees 
    SET staff_id = 'XQ-0003' 
    WHERE first_name = 'Mrs olaboye' AND last_name = 'Turayo';

    -- XQ-0004: Victoria Emmanuel
    UPDATE public.employees 
    SET staff_id = 'XQ-0004' 
    WHERE email = 'victoria@xquisite.com';

    -- XQ-0005: Mariam Hassan
    UPDATE public.employees 
    SET staff_id = 'XQ-0005' 
    WHERE email = 'meekaylarh@gmail.com';

    -- ---------------------------------------------------------
    -- 3. AUTO-ASSIGN REMAINDER (Start from XQ-0006)
    -- ---------------------------------------------------------
    -- This block assigns IDs to anyone who still matches the random 'XQ-1%' pattern
    -- or has NULL/OLD IDs, excluding the ones we just set.
    
    DECLARE
        emp RECORD;
        counter INT := 6; -- Start at 6
    BEGIN
        FOR emp IN 
            SELECT id FROM public.employees 
            WHERE staff_id NOT IN ('XQ-0001', 'XQ-0002', 'XQ-0003', 'XQ-0004', 'XQ-0005')
            ORDER BY created_at ASC
        LOOP
            -- Loop until we find a free slot (in case we skipped some manually)
            WHILE EXISTS (SELECT 1 FROM public.employees WHERE staff_id = 'XQ-' || LPAD(counter::text, 4, '0')) LOOP
                counter := counter + 1;
            END LOOP;

            UPDATE public.employees
            SET staff_id = 'XQ-' || LPAD(counter::text, 4, '0')
            WHERE id = emp.id;
            
            counter := counter + 1;
        END LOOP;
    END;

    RAISE NOTICE 'Sequential IDs assigned successfully.';
END $$;
