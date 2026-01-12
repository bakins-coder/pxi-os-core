-- FIX SCHEMA: CHART OF ACCOUNTS
-- The table exists but is missing columns (likely created by an old script).
-- We verify and add the columns required for migration.

DO $$
BEGIN
    -- 1. Ensure 'type' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = 'type') THEN
        ALTER TABLE chart_of_accounts ADD COLUMN type TEXT;
        RAISE NOTICE 'Added column: type';
    END IF;

    -- 2. Ensure 'subtype' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = 'subtype') THEN
        ALTER TABLE chart_of_accounts ADD COLUMN subtype TEXT;
        RAISE NOTICE 'Added column: subtype';
    END IF;

    -- 3. Ensure 'balance_cents' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = 'balance_cents') THEN
        ALTER TABLE chart_of_accounts ADD COLUMN balance_cents BIGINT DEFAULT 0;
        RAISE NOTICE 'Added column: balance_cents';
    END IF;
    
    -- 4. Ensure 'code' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = 'code') THEN
        ALTER TABLE chart_of_accounts ADD COLUMN code TEXT;
        RAISE NOTICE 'Added column: code';
    END IF;

END $$;
