-- URGENT SCHEMA FIX: REUSABLE ITEMS
-- This script adds missing columns to the reusable_items table to ensure it can function independently
-- and store stock/price data directly, bypassing the broken reusable_stock table.

DO $$
BEGIN
    -- 1. Ensure 'name' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'name') THEN
        ALTER TABLE reusable_items ADD COLUMN name TEXT;
    END IF;

    -- 2. Ensure 'category' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'category') THEN
        ALTER TABLE reusable_items ADD COLUMN category TEXT;
    END IF;

    -- 3. Ensure 'stock_quantity' exists (Primary Stock Column)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'stock_quantity') THEN
        ALTER TABLE reusable_items ADD COLUMN stock_quantity INT DEFAULT 0;
    END IF;

    -- 4. Ensure 'stock_level' exists (Legacy/Alternate Stock Column - aligning with codebase findings)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'stock_level') THEN
        ALTER TABLE reusable_items ADD COLUMN stock_level INT DEFAULT 0;
    END IF;

    -- 5. Ensure 'price_cents' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'price_cents') THEN
        ALTER TABLE reusable_items ADD COLUMN price_cents BIGINT DEFAULT 0;
    END IF;

    -- 6. Ensure 'image' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'image') THEN
        ALTER TABLE reusable_items ADD COLUMN image TEXT;
    END IF;

     -- 7. Ensure 'description' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'description') THEN
        ALTER TABLE reusable_items ADD COLUMN description TEXT;
    END IF;

END $$;

-- 8. Sync stock_quantity and stock_level to be safe (if one has data)
UPDATE reusable_items SET stock_quantity = stock_level WHERE stock_quantity = 0 AND stock_level > 0;
UPDATE reusable_items SET stock_level = stock_quantity WHERE stock_level = 0 AND stock_quantity > 0;

-- 9. Force Refresh Schema Cache (Supabase Specific Helper if available, otherwise innocuous)
NOTIFY pgrst, 'reload schema';
