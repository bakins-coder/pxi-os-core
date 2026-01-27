-- Migration: UPDATE existing products with correct category_id
-- Run this in the Supabase SQL Editor

-- Fetch category IDs and update products by name
DO $$
DECLARE
    cat_hors_doeuvre UUID;
    cat_starters UUID;
    cat_salads UUID;
    cat_nigerian UUID;
    cat_oriental UUID;
    cat_continental UUID;
    cat_hot_plates UUID;
    cat_dessert UUID;
    org_id UUID;
BEGIN
    -- Get organization ID
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    -- Fetch category IDs
    SELECT id INTO cat_hors_doeuvre FROM categories WHERE name = 'Hors D''Oeuvre' LIMIT 1;
    SELECT id INTO cat_starters FROM categories WHERE name = 'Starters' LIMIT 1;
    SELECT id INTO cat_salads FROM categories WHERE name = 'Salads' LIMIT 1;
    SELECT id INTO cat_nigerian FROM categories WHERE name = 'Nigerian Cuisine' LIMIT 1;
    SELECT id INTO cat_oriental FROM categories WHERE name = 'Oriental' LIMIT 1;
    SELECT id INTO cat_continental FROM categories WHERE name = 'Continental' LIMIT 1;
    SELECT id INTO cat_hot_plates FROM categories WHERE name = 'Hot Plates' LIMIT 1;
    SELECT id INTO cat_dessert FROM categories WHERE name = 'Dessert' LIMIT 1;

    -- =============================================
    -- HORS D'OEUVRE
    -- =============================================
    UPDATE products SET category_id = cat_hors_doeuvre WHERE organization_id = org_id AND (
        name ILIKE '%Spanish Ham%' OR
        name ILIKE '%Shrimp Cocktail%' OR
        name ILIKE '%Wrapped Noodle%' OR
        name ILIKE '%Mixed Appetizers%' OR
        name ILIKE '%Finger Foods%' OR
        name ILIKE '%Snails%'
    );

    -- =============================================
    -- STARTERS (Soups)
    -- =============================================
    UPDATE products SET category_id = cat_starters WHERE organization_id = org_id AND (
        name ILIKE '%Pepper Soup%' OR
        name ILIKE '%Corn Soup%' OR
        name ILIKE '%Vegetable Soup%' OR
        name ILIKE '%Noodles Soup%' OR
        name ILIKE '%Mushroom Soup%' OR
        name ILIKE '%Thai Shrimps Soup%'
    );

    -- =============================================
    -- SALADS
    -- =============================================
    UPDATE products SET category_id = cat_salads WHERE organization_id = org_id AND (
        name ILIKE '%Coleslaw%' OR
        name ILIKE '%Salad%'
    ) AND name NOT ILIKE '%Fruit Salad%';

    -- =============================================
    -- NIGERIAN CUISINE
    -- =============================================
    UPDATE products SET category_id = cat_nigerian WHERE organization_id = org_id AND (
        name ILIKE '%Jollof%' OR
        name ILIKE '%Efo Riro%' OR
        name ILIKE '%Elegusi%' OR
        name ILIKE '%Ofada%' OR
        name ILIKE '%Yam Pottage%' OR
        name ILIKE '%Amala%' OR
        name ILIKE '%Ewa agoyin%' OR
        name ILIKE '%Nigerian Option%'
    );

    -- =============================================
    -- ORIENTAL
    -- =============================================
    UPDATE products SET category_id = cat_oriental WHERE organization_id = org_id AND (
        name ILIKE '%Chinese Fried%' OR
        name ILIKE '%Stir Fry%' OR
        name ILIKE '%Braised Lamb in Oyster%' OR
        name ILIKE '%Shredded Spicy Beef%' OR
        name ILIKE '%Prawns in Coconut%' OR
        name ILIKE '%Sweet Oriental%' OR
        name ILIKE '%Thai Sticky%' OR
        name ILIKE '%Thai Chicken%'
    );

    -- =============================================
    -- CONTINENTAL
    -- =============================================
    UPDATE products SET category_id = cat_continental WHERE organization_id = org_id AND (
        name ILIKE '%Fettuccine%' OR
        name ILIKE '%Mushroom Sauce%' OR
        name ILIKE '%Lamb Steak%' OR
        name ILIKE '%Oxtail%' OR
        name ILIKE '%Lamb Chops%' OR
        name ILIKE '%Salmon Steak%' OR
        name ILIKE '%Calamari in Batter%' OR
        name ILIKE '%potato gratin%'
    );

    -- =============================================
    -- HOT PLATES
    -- =============================================
    UPDATE products SET category_id = cat_hot_plates WHERE organization_id = org_id AND (
        name ILIKE '%Hot Plate%' OR
        name ILIKE '%Sizzling%'
    );

    -- =============================================
    -- DESSERT
    -- =============================================
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

    RAISE NOTICE 'Successfully updated product categories!';
END $$;

-- Verify the update
SELECT name, category_id, (SELECT name FROM categories WHERE id = products.category_id) as category_name 
FROM products 
WHERE category_id IS NOT NULL 
ORDER BY category_name, name;
