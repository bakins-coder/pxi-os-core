-- FIX: Create menu categories in Xquisite organization
-- Xquisite org ID: 10959119-72e4-4e57-ba54-923e36bba6a6

-- Step 1: Create the menu categories for Xquisite
INSERT INTO categories (id, organization_id, name, category_type)
VALUES 
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Hors D''Oeuvre', 'menu'),
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Starters', 'menu'),
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Salads', 'menu'),
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Nigerian Cuisine', 'menu'),
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Oriental', 'menu'),
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Continental', 'menu'),
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Hot Plates', 'menu'),
    (gen_random_uuid(), '10959119-72e4-4e57-ba54-923e36bba6a6', 'Dessert', 'menu')
ON CONFLICT DO NOTHING;

-- Step 2: Update Xquisite products to point to the new categories
-- First get the new category IDs
DO $$
DECLARE
    xquisite_org UUID := '10959119-72e4-4e57-ba54-923e36bba6a6';
    cat_hors UUID;
    cat_starters UUID;
    cat_salads UUID;
    cat_nigerian UUID;
    cat_oriental UUID;
    cat_continental UUID;
    cat_hot_plates UUID;
    cat_dessert UUID;
BEGIN
    -- Get the newly created category IDs
    SELECT id INTO cat_hors FROM categories WHERE organization_id = xquisite_org AND name = 'Hors D''Oeuvre' LIMIT 1;
    SELECT id INTO cat_starters FROM categories WHERE organization_id = xquisite_org AND name = 'Starters' LIMIT 1;
    SELECT id INTO cat_salads FROM categories WHERE organization_id = xquisite_org AND name = 'Salads' LIMIT 1;
    SELECT id INTO cat_nigerian FROM categories WHERE organization_id = xquisite_org AND name = 'Nigerian Cuisine' LIMIT 1;
    SELECT id INTO cat_oriental FROM categories WHERE organization_id = xquisite_org AND name = 'Oriental' LIMIT 1;
    SELECT id INTO cat_continental FROM categories WHERE organization_id = xquisite_org AND name = 'Continental' LIMIT 1;
    SELECT id INTO cat_hot_plates FROM categories WHERE organization_id = xquisite_org AND name = 'Hot Plates' LIMIT 1;
    SELECT id INTO cat_dessert FROM categories WHERE organization_id = xquisite_org AND name = 'Dessert' LIMIT 1;

    RAISE NOTICE 'New category IDs - Hors: %, Starters: %, Salads: %, Nigerian: %, Oriental: %, Continental: %, Hot Plates: %, Dessert: %',
        cat_hors, cat_starters, cat_salads, cat_nigerian, cat_oriental, cat_continental, cat_hot_plates, cat_dessert;

    -- Update Xquisite products with correct category_id
    -- HORS D'OEUVRE
    UPDATE products SET category_id = cat_hors WHERE organization_id = xquisite_org AND (
        name ILIKE '%Spanish Ham%' OR name ILIKE '%Shrimp Cocktail%' OR name ILIKE '%Wrapped Noodle%' OR
        name ILIKE '%Mixed Appetizers%' OR name ILIKE '%Finger Foods%' OR name ILIKE '%Snails%'
    );

    -- STARTERS
    UPDATE products SET category_id = cat_starters WHERE organization_id = xquisite_org AND (
        name ILIKE '%Pepper Soup%' OR name ILIKE '%Corn Soup%' OR name ILIKE '%Vegetable Soup%' OR
        name ILIKE '%Noodles Soup%' OR name ILIKE '%Noodle Soup%' OR name ILIKE '%Mushroom Soup%' OR
        name ILIKE '%Shrimps Soup%' OR name ILIKE '%Shrimp Soup%'
    );

    -- SALADS
    UPDATE products SET category_id = cat_salads WHERE organization_id = xquisite_org AND (
        name ILIKE '%Coleslaw%' OR (name ILIKE '%Salad%' AND name NOT ILIKE '%Fruit Salad%')
    );

    -- NIGERIAN CUISINE
    UPDATE products SET category_id = cat_nigerian WHERE organization_id = xquisite_org AND (
        name ILIKE '%Jollof%' OR name ILIKE '%Efo Riro%' OR name ILIKE '%Ofada%' OR
        name ILIKE '%Yam Pottage%' OR name ILIKE '%Amala%' OR name ILIKE '%Nigerian Option%'
    );

    -- ORIENTAL
    UPDATE products SET category_id = cat_oriental WHERE organization_id = xquisite_org AND (
        name ILIKE '%Chinese Fried%' OR name ILIKE '%Stir Fry%' OR name ILIKE '%Braised Lamb in Oyster%' OR
        name ILIKE '%Shredded Spicy Beef%' OR name ILIKE '%Prawns in Coconut%' OR name ILIKE '%Thai%' OR
        name ILIKE '%Sweet Oriental%'
    );

    -- CONTINENTAL
    UPDATE products SET category_id = cat_continental WHERE organization_id = xquisite_org AND (
        name ILIKE '%Fettuccine%' OR name ILIKE '%Mushroom Sauce%' OR name ILIKE '%Lamb Steak%' OR
        name ILIKE '%Oxtail%' OR name ILIKE '%Lamb Chops%' OR name ILIKE '%Salmon%' OR
        name ILIKE '%Calamari%' OR name ILIKE '%Grilled Spicy Prawns%'
    );

    -- HOT PLATES
    UPDATE products SET category_id = cat_hot_plates WHERE organization_id = xquisite_org AND (
        name ILIKE '%Hot Plate%' OR name ILIKE '%Sizzling%'
    );

    -- DESSERT
    UPDATE products SET category_id = cat_dessert WHERE organization_id = xquisite_org AND (
        name ILIKE '%Apple Pie%' OR name ILIKE '%Crumble%' OR name ILIKE '%Fruit Salad%' OR
        name ILIKE '%Trifle%' OR name ILIKE '%Pancakes%' OR name ILIKE '%Waffles%' OR
        name ILIKE '%Pineapple%' OR name ILIKE '%Roulade%' OR name ILIKE '%Mousse%' OR
        name ILIKE '%Caramel%' OR name ILIKE '%Gateau%' OR name ILIKE '%Cheesecake%'
    );

    RAISE NOTICE 'Category assignments complete!';
END $$;

-- Step 3: Verify
SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
WHERE c.organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
GROUP BY c.name
ORDER BY c.name;
