-- Migration: Add image_url column to products table
-- Purpose: Enable storing product image URLs directly in the products table

-- Add image_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE products ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to products table';
    ELSE
        RAISE NOTICE 'image_url column already exists in products table';
    END IF;
END $$;

-- Add the same for other inventory tables for consistency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reusable_items' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE reusable_items ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to reusable_items table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rental_items' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE rental_items ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to rental_items table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to ingredients table';
    END IF;
END $$;

-- Grant access
GRANT SELECT, INSERT, UPDATE ON products TO authenticated;
GRANT SELECT, INSERT, UPDATE ON reusable_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rental_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ingredients TO authenticated;
