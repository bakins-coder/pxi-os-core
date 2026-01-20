-- MIGRATION: 17 Add Employee Title
-- Purpose: Add 'title' column to employees table (Mr, Mrs, etc.)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'title') THEN
        ALTER TABLE public.employees ADD COLUMN title TEXT;
        RAISE NOTICE 'Added title column to employees table.';
    END IF;
END $$;
