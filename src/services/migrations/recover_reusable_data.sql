-- DATA RECOVERY SCRIPT: RESTORE LEGACY REUSABLES
-- Consolidate Schema Fix + Data Recovery
-- Source Table: inventory_deprecated (confirmed schema)
-- Destination Table: reusable_items

DO $$
DECLARE
    org_id UUID;
    r RECORD;
    img_url TEXT;
    cat_id UUID;
    clean_name TEXT; 
    found_filename TEXT; -- To store the exact file found in bucket
    base_url TEXT := 'https://qbfhntvjqciardkjpfpy.supabase.co/storage/v1/object/public/asset_inventory/';
BEGIN
    -- 0. SCHEMA FIX: Ensure columns exist (Polymorphic safety)
    -- This handles the error "column category does not exist" by creating it if missing.
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'category') THEN
        ALTER TABLE reusable_items ADD COLUMN category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'stock_quantity') THEN
        ALTER TABLE reusable_items ADD COLUMN stock_quantity INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'stock_level') THEN
        ALTER TABLE reusable_items ADD COLUMN stock_level INT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'price_cents') THEN
        ALTER TABLE reusable_items ADD COLUMN price_cents BIGINT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'image') THEN
        ALTER TABLE reusable_items ADD COLUMN image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reusable_items' AND column_name = 'description') THEN
        ALTER TABLE reusable_items ADD COLUMN description TEXT;
    END IF;


    -- 1. Get the Organization ID
    SELECT id INTO org_id FROM organizations LIMIT 1;

    -- 2. Iterate through deprecated inventory items
    FOR r IN 
        SELECT * FROM inventory_deprecated 
        WHERE category IN ('Chargers', 'Crockery', 'Cutlery', 'Glassware')
    LOOP
        -- 3. Construct Smart Image URL via Lookup
        -- Goal: Find the ACTUAL filename in the bucket
        
        found_filename := NULL;
        
        -- PRIORITY 1: Check if the legacy table already has the filename!
        -- If r.image holds "Deep black round plate.jpeg" OR a full URL, we should use it.
        IF r.image IS NOT NULL AND LENGTH(r.image) > 4 THEN
             -- Extract filename if it's a URL (take everything after the last slash)
             -- If it's just a filename, this regex still works or we can use specific logic.
             -- Postgres way to get last part of path:
             DECLARE
                legacy_filename TEXT;
             BEGIN
                legacy_filename := substring(r.image from '[^/]+$'); -- Extracts "file.jpg" from matches
                
                -- Decode %20 back to spaces for storage lookup if needed? 
                -- Storage usually stores "file name.jpg". URL has "file%20name.jpg".
                legacy_filename := REPLACE(legacy_filename, '%20', ' ');
                
                SELECT name INTO found_filename 
                FROM storage.objects 
                WHERE bucket_id = 'asset_inventory' 
                AND (LOWER(name) = LOWER(legacy_filename))
                LIMIT 1;
             EXCEPTION WHEN OTHERS THEN found_filename := NULL; END;
        END IF;

        IF found_filename IS NULL THEN
            -- PRIORITY 2: Guess from Name (Smart Lookup)
            
            -- A. Clean the item name
            clean_name := LOWER(r.name);
            clean_name := REGEXP_REPLACE(clean_name, '\s*\(.*\)', ''); 
            clean_name := TRIM(clean_name);
            
            -- Remove trailing 's' for search (to match singular files)
            IF RIGHT(clean_name, 1) = 's' AND clean_name NOT LIKE '%ss' THEN 
                 clean_name := LEFT(clean_name, LENGTH(clean_name) - 1);
            END IF;
    
            -- B. Search Attempt 1: Try Exact Clean Name 
            BEGIN
                SELECT name INTO found_filename 
                FROM storage.objects 
                WHERE bucket_id = 'asset_inventory' 
                AND LOWER(name) LIKE clean_name || '.%' 
                LIMIT 1;
            EXCEPTION WHEN OTHERS THEN found_filename := NULL; END;
    
            -- C. Search Attempt 2: Try Singular Name 
            IF found_filename IS NULL AND RIGHT(clean_name, 1) = 's' THEN 
                BEGIN
                    SELECT name INTO found_filename 
                    FROM storage.objects 
                    WHERE bucket_id = 'asset_inventory' 
                    AND LOWER(name) LIKE LEFT(clean_name, LENGTH(clean_name) - 1) || '.%' 
                    LIMIT 1;
                EXCEPTION WHEN OTHERS THEN found_filename := NULL; END;
            END IF;
    
            -- D. Search Attempt 3: Try Plural Name
            IF found_filename IS NULL AND RIGHT(clean_name, 1) <> 's' THEN 
                BEGIN
                    SELECT name INTO found_filename 
                    FROM storage.objects 
                    WHERE bucket_id = 'asset_inventory' 
                    AND LOWER(name) LIKE clean_name || 's.%' 
                    LIMIT 1;
                EXCEPTION WHEN OTHERS THEN found_filename := NULL; END;
            END IF;
    
            -- E. Attempts 4 & 5 (Underscores/Hyphens)
            IF found_filename IS NULL THEN 
                BEGIN
                    SELECT name INTO found_filename 
                    FROM storage.objects 
                    WHERE bucket_id = 'asset_inventory' 
                    AND LOWER(name) LIKE REPLACE(clean_name, ' ', '_') || '.%' 
                    LIMIT 1;
                EXCEPTION WHEN OTHERS THEN found_filename := NULL; END;
            END IF;
            IF found_filename IS NULL THEN 
                BEGIN
                    SELECT name INTO found_filename 
                    FROM storage.objects 
                    WHERE bucket_id = 'asset_inventory' 
                    AND LOWER(name) LIKE REPLACE(clean_name, ' ', '-') || '.%' 
                    LIMIT 1;
                EXCEPTION WHEN OTHERS THEN found_filename := NULL; END;
            END IF;
        END IF;

        -- FINAL: Construct URL
        IF found_filename IS NOT NULL THEN
            img_url := base_url || REPLACE(found_filename, ' ', '%20');
        ELSE
            -- Fallback
             clean_name := LOWER(r.name); -- Reset for fallback
             IF RIGHT(clean_name, 1) = 's' THEN clean_name := LEFT(clean_name, LENGTH(clean_name)-1); END IF;
             img_url := base_url || REPLACE(clean_name, ' ', '%20') || '.jpeg';
        END IF; 

        -- 4. Try to resolve Category ID 
        SELECT id INTO cat_id FROM categories WHERE name = r.category AND organization_id = org_id LIMIT 1;

        -- Auto-create Category if missing
        -- Schema requires: organization_id, name, category_type (enum: asset, etc.)
        IF cat_id IS NULL AND r.category IS NOT NULL THEN
             INSERT INTO categories (organization_id, name, category_type)
             VALUES (org_id, r.category, 'asset') -- 'asset' matches reusable logic
             RETURNING id INTO cat_id;
        END IF;

        -- 5. Upsert into reusable_items
        -- Logic: If it exists, update it. If not, insert it.
        -- SOURCE: r.company_id (from inventory_deprecated)
        -- DEST: organization_id (reusable_items)

        -- Check existence
        IF NOT EXISTS (SELECT 1 FROM reusable_items WHERE name = r.name AND organization_id = COALESCE(r.company_id, org_id)) THEN
             INSERT INTO reusable_items (
                organization_id,
                name,
                category,
                category_id, 
                stock_quantity,
                stock_level, 
                price_cents,
                image,
                description
            ) VALUES (
                COALESCE(r.company_id, org_id),
                r.name,
                r.category,
                cat_id, 
                COALESCE(r.stock_quantity, 0), -- Source has stock_quantity
                COALESCE(r.stock_quantity, 0),
                COALESCE(r.price_cents, 0),
                img_url,
                'Restored from legacy inventory'
            );
        ELSE
            -- Update existing with recovered stock/image regardless of current state
            -- This ensures we fix broken images/categories from previous partial runs
             UPDATE reusable_items 
             SET stock_quantity = COALESCE(r.stock_quantity, 0),
                 stock_level = COALESCE(r.stock_quantity, 0),
                 category = r.category, -- Explicitly update text category
                 category_id = COALESCE(category_id, cat_id), 
                 image = img_url
             WHERE name = r.name 
               AND organization_id = COALESCE(r.company_id, org_id);
        END IF;

    END LOOP;
END $$;
