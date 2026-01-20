-- MIGRATION: 19 Fix Duplicate IDs & Set Credentials (Robust)
-- Purpose: Forcefully clear conflicts for XQ-0001/0002 and assign correctly.

DO $$
BEGIN
    -- 1. Unconditionally rename ANYONE who holds XQ-0002 to free the slot.
    -- We append the record's UUID to ensure the temporary ID is unique.
    UPDATE public.employees
    SET staff_id = 'OLD-' || substring(id::text, 1, 8) || '-0002'
    WHERE staff_id = 'XQ-0002';

    -- 2. Unconditionally rename ANYONE who holds XQ-0001 to free the slot.
    UPDATE public.employees
    SET staff_id = 'OLD-' || substring(id::text, 1, 8) || '-0001'
    WHERE staff_id = 'XQ-0001';

    -- 3. Now the slots are guaranteed empty. Assign correct IDs.
    UPDATE public.employees
    SET staff_id = 'XQ-0002'
    WHERE email = 'tomiwab@hotmail.com';

    UPDATE public.employees
    SET staff_id = 'XQ-0001'
    WHERE role = 'Chief Executive Officer';

    -- 4. Log the changes
    RAISE NOTICE 'Fixed permissions for XQ-0001 and XQ-0002';
END $$;
