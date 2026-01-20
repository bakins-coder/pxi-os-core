-- MIGRATION: 23 Deduplicate & Assign Sequential IDs (Final Fix)
-- Purpose: Remove duplicate employees for target users, then cleanly assign IDs 0001-0005.

DO $$
DECLARE
    -- Targets
    v_ceo_email TEXT := 'toxsyyb@yahoo.co.uk';
    v_victoria_email TEXT := 'victoria@xquisite.com';
    v_mariam_email TEXT := 'meekaylarh@gmail.com';
    -- Olaboye is hard to target by email from screenshot, so we use name/pattern if possible or just assume name is unique enough for dedupe
    
BEGIN
    -- ---------------------------------------------------------
    -- 1. DEDUPLICATE TARGET USERS
    -- ---------------------------------------------------------
    
    -- Specific removal requested by user: Remove 'Xquisite Admin'
    DELETE FROM public.employees 
    WHERE email = v_ceo_email 
      AND first_name ILIKE 'Xquisite' 
      AND last_name ILIKE 'Admin';

    -- Keep oldest (min created_at) for CEO if any other duplicates remain
    DELETE FROM public.employees WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as r_num 
            FROM public.employees WHERE email = v_ceo_email
        ) t WHERE t.r_num > 1
    );

    -- Victoria
    DELETE FROM public.employees WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as r_num 
            FROM public.employees WHERE email = v_victoria_email
        ) t WHERE t.r_num > 1
    );

    -- Mariam
    DELETE FROM public.employees WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as r_num 
            FROM public.employees WHERE email = v_mariam_email
        ) t WHERE t.r_num > 1
    );
    
    -- Mrs Olaboye (ByName)
    DELETE FROM public.employees WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY first_name, last_name ORDER BY created_at ASC) as r_num 
            FROM public.employees WHERE first_name = 'Mrs olaboye' AND last_name = 'Turayo'
        ) t WHERE t.r_num > 1
    );


    -- ---------------------------------------------------------
    -- 2. CLEAR BLOCKED IDs (0001 - 0005)
    -- ---------------------------------------------------------
    -- Unconditionally move anyone holding these IDs to OLD-
    
    UPDATE public.employees SET staff_id = 'OLD-' || substring(id::text, 1, 8) || '-0001' WHERE staff_id = 'XQ-0001';
    UPDATE public.employees SET staff_id = 'OLD-' || substring(id::text, 1, 8) || '-0002' WHERE staff_id = 'XQ-0002';
    UPDATE public.employees SET staff_id = 'OLD-' || substring(id::text, 1, 8) || '-0003' WHERE staff_id = 'XQ-0003';
    UPDATE public.employees SET staff_id = 'OLD-' || substring(id::text, 1, 8) || '-0004' WHERE staff_id = 'XQ-0004';
    UPDATE public.employees SET staff_id = 'OLD-' || substring(id::text, 1, 8) || '-0005' WHERE staff_id = 'XQ-0005';


    -- ---------------------------------------------------------
    -- 3. ASSIGN SPECIFIC IDs
    -- ---------------------------------------------------------

    -- XQ-0001: CEO
    UPDATE public.employees SET staff_id = 'XQ-0001' WHERE email = v_ceo_email;

    -- XQ-0002: Tomiwa (Assuming dedupe already done)
    UPDATE public.employees SET staff_id = 'XQ-0002' WHERE email = 'tomiwab@hotmail.com';

    -- XQ-0003: Mrs Olaboye
    UPDATE public.employees SET staff_id = 'XQ-0003' WHERE first_name = 'Mrs olaboye' AND last_name = 'Turayo';

    -- XQ-0004: Victoria
    UPDATE public.employees SET staff_id = 'XQ-0004' WHERE email = v_victoria_email;

    -- XQ-0005: Mariam
    UPDATE public.employees SET staff_id = 'XQ-0005' WHERE email = v_mariam_email;


    -- ---------------------------------------------------------
    -- 4. AUTO-ASSIGN REMAINDER (Start from XQ-0006)
    -- ---------------------------------------------------------
    DECLARE
        emp RECORD;
        counter INT := 6;
    BEGIN
        FOR emp IN 
            SELECT id FROM public.employees 
            WHERE staff_id NOT IN ('XQ-0001', 'XQ-0002', 'XQ-0003', 'XQ-0004', 'XQ-0005')
              OR staff_id IS NULL
            ORDER BY created_at ASC
        LOOP
            -- Check availability
            WHILE EXISTS (SELECT 1 FROM public.employees WHERE staff_id = 'XQ-' || LPAD(counter::text, 4, '0')) LOOP
                counter := counter + 1;
            END LOOP;

            -- Update
            UPDATE public.employees
            SET staff_id = 'XQ-' || LPAD(counter::text, 4, '0')
            WHERE id = emp.id;
            
            counter := counter + 1;
        END LOOP;
    END;

    RAISE NOTICE 'Deduplication and Sequential Assignment Complete.';
END $$;
