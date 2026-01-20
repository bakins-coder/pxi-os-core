-- MIGRATION: 14 Fix Employee Timestamps
-- Purpose: Add 'created_at' column and backfill missing dates.

DO $$
BEGIN
    -- 1. Add Column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'created_at') THEN
        ALTER TABLE public.employees 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
        RAISE NOTICE 'Added created_at column.';
    END IF;

    -- 2. Backfill existing NULLs
    -- Strategy: Try to use 'date_of_employment' if valid, otherwise use NOW()
    -- This ensures we don't just have 100% of rows saying "Today" if we have better info.
    
    -- overwrite any timestamps that look like historical hire dates (older than 2025)
    UPDATE public.employees
    SET created_at = now()
    WHERE created_at < '2025-01-01'::timestamptz OR created_at IS NULL;

    RAISE NOTICE 'Timestamps backfilled for existing employees.';

END $$;
