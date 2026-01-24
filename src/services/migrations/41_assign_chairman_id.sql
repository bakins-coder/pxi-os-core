-- MIGRATION: 41 Assign Chairman Staff ID
-- Purpose: Assign "XQ-0000" to the Chairman (Rank 0).

DO $$
BEGIN
    -- Check if XQ-0000 is taken by someone else
    IF EXISTS (SELECT 1 FROM public.employees WHERE staff_id = 'XQ-0000' AND email != 'akinbee@gmail.com') THEN
        RAISE NOTICE '⚠️ XQ-0000 is taken by someone else! Overwriting...';
        UPDATE public.employees SET staff_id = 'OLD-' || id || '-0000' WHERE staff_id = 'XQ-0000';
    END IF;

    -- Assign XQ-0000 to Chairman (Case insensitive check)
    UPDATE public.employees 
    SET staff_id = 'XQ-0000' 
    WHERE email ILIKE 'akinbee@gmail.com';

    IF FOUND THEN
        RAISE NOTICE '✅ Chairman Akin Braithwaite assigned Staff ID: XQ-0000';
    ELSE
        -- Diagnostic: Check if he exists at all
        DECLARE
            v_count INT;
        BEGIN
            SELECT COUNT(*) INTO v_count FROM public.employees WHERE email ILIKE 'akinbee@gmail.com';
            RAISE WARNING '❌ Update failed. Found % records for akinbee@gmail.com.', v_count;
        END;
    END IF;

END $$;
