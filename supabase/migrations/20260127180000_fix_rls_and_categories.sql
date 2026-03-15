-- FIX: Update products with correct category_id
-- Organization ID from your database: 31ef4cda-7dd2-4ada-a6fd-a3da33c38896
-- Run this in Supabase SQL Editor

-- Step 1: Enable RLS access for products table (if blocked)
-- This grants SELECT to authenticated users
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read products" ON products;
CREATE POLICY "Allow authenticated read products" ON products
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;
CREATE POLICY "Allow authenticated insert products" ON products
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update products" ON products;  
CREATE POLICY "Allow authenticated update products" ON products
    FOR UPDATE TO authenticated
    USING (true);

-- Step 2: Similarly fix categories table RLS
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read categories" ON categories;
CREATE POLICY "Allow authenticated read categories" ON categories
    FOR SELECT TO authenticated
    USING (true);

-- Step 3: Update products with category_id
-- Using the actual organization_id from your database

DO $$
DECLARE
    org_id UUID := '31ef4cda-7dd2-4ada-a6fd-a3da33c38896';
    cat_hors_doeuvre UUID;
    cat_starters UUID;
    cat_salads UUID;
    cat_nigerian UUID;
    cat_oriental UUID;
    cat_continental UUID;
    cat_hot_plates UUID;
    cat_dessert UUID;
BEGIN
    -- Fetch category IDs for this organization
    SELECT id INTO cat_hors_doeuvre FROM categories WHERE name ILIKE '%Hors%Oeuvre%' AND organization_id = org_id LIMIT 1;
    SELECT id INTO cat_starters FROM categories WHERE name ILIKE '%Starter%' AND organization_id = org_id LIMIT 1;
    SELECT id INTO cat_salads FROM categories WHERE name ILIKE '%Salad%' AND organization_id = org_id LIMIT 1;
    SELECT id INTO cat_nigerian FROM categories WHERE name ILIKE '%Nigerian%' AND organization_id = org_id LIMIT 1;
    SELECT id INTO cat_oriental FROM categories WHERE name ILIKE '%Oriental%' AND organization_id = org_id LIMIT 1;
    SELECT id INTO cat_continental FROM categories WHERE name ILIKE '%Continental%' AND organization_id = org_id LIMIT 1;
    SELECT id INTO cat_hot_plates FROM categories WHERE name ILIKE '%Hot%Plate%' AND organization_id = org_id LIMIT 1;
    SELECT id INTO cat_dessert FROM categories WHERE name ILIKE '%Dessert%' AND organization_id = org_id LIMIT 1;

    -- Log found categories
    RAISE NOTICE 'Found Categories - Hors: %, Starters: %, Salads: %, Nigerian: %, Oriental: %, Continental: %, Hot Plates: %, Dessert: %',
        cat_hors_doeuvre, cat_starters, cat_salads, cat_nigerian, cat_oriental, cat_continental, cat_hot_plates, cat_dessert;

    -- HORS D'OEUVRE
    IF cat_hors_doeuvre IS NOT NULL THEN
        UPDATE products SET category_id = cat_hors_doeuvre WHERE organization_id = org_id AND (
            name ILIKE '%Spanish Ham%' OR
            name ILIKE '%Shrimp Cocktail%' OR
            name ILIKE '%Wrapped Noodle%' OR
            name ILIKE '%Mixed Appetizers%' OR
            name ILIKE '%Finger Foods%' OR
            name ILIKE '%Snails%' OR
            name ILIKE '%Asian Fusion%'
        );
        RAISE NOTICE 'Updated Hors dOeuvre items';
    END IF;

    -- STARTERS (Soups)
    IF cat_starters IS NOT NULL THEN
        UPDATE products SET category_id = cat_starters WHERE organization_id = org_id AND (
            name ILIKE '%Pepper Soup%' OR
            name ILIKE '%Corn Soup%' OR
            name ILIKE '%Vegetable Soup%' OR
            name ILIKE '%Noodles Soup%' OR
            name ILIKE '%Noodle Soup%' OR
            name ILIKE '%Mushroom Soup%' OR
            name ILIKE '%Thai Shrimps Soup%' OR
            name ILIKE '%Shrimp Soup%'
        );
        RAISE NOTICE 'Updated Starters items';
    END IF;

    -- SALADS
    IF cat_salads IS NOT NULL THEN
        UPDATE products SET category_id = cat_salads WHERE organization_id = org_id AND (
            name ILIKE '%Coleslaw%' OR
            (name ILIKE '%Salad%' AND name NOT ILIKE '%Fruit Salad%')
        );
        RAISE NOTICE 'Updated Salads items';
    END IF;

    -- NIGERIAN CUISINE
    IF cat_nigerian IS NOT NULL THEN
        UPDATE products SET category_id = cat_nigerian WHERE organization_id = org_id AND (
            name ILIKE '%Jollof%' OR
            name ILIKE '%Efo Riro%' OR
            name ILIKE '%Elegusi%' OR
            name ILIKE '%Ofada%' OR
            name ILIKE '%Yam Pottage%' OR
            name ILIKE '%Amala%' OR
            name ILIKE '%Ewa agoyin%' OR
            name ILIKE '%Nigerian Option%' OR
            name ILIKE '%Nigerian Menu%'
        );
        RAISE NOTICE 'Updated Nigerian Cuisine items';
    END IF;

    -- ORIENTAL
    IF cat_oriental IS NOT NULL THEN
        UPDATE products SET category_id = cat_oriental WHERE organization_id = org_id AND (
            name ILIKE '%Chinese Fried%' OR
            name ILIKE '%Stir Fry%' OR
            name ILIKE '%Braised Lamb in Oyster%' OR
            name ILIKE '%Shredded Spicy Beef%' OR
            name ILIKE '%Prawns in Coconut%' OR
            name ILIKE '%Sweet Oriental%' OR
            name ILIKE '%Thai Sticky%' OR
            name ILIKE '%Thai Chicken%' OR
            name ILIKE '%Crispy Fish%Oriental%'
        );
        RAISE NOTICE 'Updated Oriental items';
    END IF;

    -- CONTINENTAL
    IF cat_continental IS NOT NULL THEN
        UPDATE products SET category_id = cat_continental WHERE organization_id = org_id AND (
            name ILIKE '%Fettuccine%' OR
            name ILIKE '%Mushroom Sauce%' OR
            name ILIKE '%Lamb Steak%' OR
            name ILIKE '%Oxtail%' OR
            name ILIKE '%Lamb Chops%' OR
            name ILIKE '%Salmon Steak%' OR
            name ILIKE '%Calamari in Batter%' OR
            name ILIKE '%Grilled Spicy Prawns%' OR
            name ILIKE '%Succulent Lamb in Oyster%'
        );
        RAISE NOTICE 'Updated Continental items';
    END IF;

    -- HOT PLATES
    IF cat_hot_plates IS NOT NULL THEN
        UPDATE products SET category_id = cat_hot_plates WHERE organization_id = org_id AND (
            name ILIKE '%Hot Plate%' OR
            name ILIKE '%Sizzling%'
        );
        RAISE NOTICE 'Updated Hot Plates items';
    END IF;

    -- DESSERT
    IF cat_dessert IS NOT NULL THEN
        UPDATE products SET category_id = cat_dessert WHERE organization_id = org_id AND (
            name ILIKE '%Apple Pie%' OR
            name ILIKE '%Crumble%' OR
            name ILIKE '%Fruit Salad%' OR
            name ILIKE '%Trifle%' OR
            name ILIKE '%Pancakes%' OR
            name ILIKE '%Waffles%' OR
            name ILIKE '%Pineapple Upside%' OR
            name ILIKE '%Roulade%' OR
            name ILIKE '%Mousse%' OR
            name ILIKE '%Caramel%' OR
            name ILIKE '%Gateau%' OR
            name ILIKE '%Cheesecake%'
        );
        RAISE NOTICE 'Updated Dessert items';
    END IF;

    RAISE NOTICE 'Category update complete!';
END $$;

-- Step 4: Verify the update
SELECT 
    p.name as product_name, 
    c.name as category_name,
    p.category_id
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
ORDER BY c.name NULLS LAST, p.name;
