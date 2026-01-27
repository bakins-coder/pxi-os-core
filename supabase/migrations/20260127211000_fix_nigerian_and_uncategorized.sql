-- FIX: Update Nigerian Cuisine products and remaining uncategorized products
-- Xquisite org ID: 10959119-72e4-4e57-ba54-923e36bba6a6

DO $$
DECLARE
    xquisite_org UUID := '10959119-72e4-4e57-ba54-923e36bba6a6';
    cat_hors UUID;
    cat_nigerian UUID;
    cat_oriental UUID;
    cat_continental UUID;
BEGIN
    -- Get Xquisite category IDs
    SELECT id INTO cat_hors FROM categories WHERE organization_id = xquisite_org AND name = 'Hors D''Oeuvre' LIMIT 1;
    SELECT id INTO cat_nigerian FROM categories WHERE organization_id = xquisite_org AND name = 'Nigerian Cuisine' LIMIT 1;
    SELECT id INTO cat_oriental FROM categories WHERE organization_id = xquisite_org AND name = 'Oriental' LIMIT 1;
    SELECT id INTO cat_continental FROM categories WHERE organization_id = xquisite_org AND name = 'Continental' LIMIT 1;

    RAISE NOTICE 'Categories - Nigerian: %, Hors: %, Oriental: %, Continental: %', cat_nigerian, cat_hors, cat_oriental, cat_continental;

    -- Nigerian Cuisine (these have names starting with "Nigerian")
    UPDATE products SET category_id = cat_nigerian 
    WHERE organization_id = xquisite_org 
      AND (name ILIKE 'Nigerian%' OR name ILIKE '%Slow Roasted Nigerian%' OR name ILIKE '%Succulent Nigerian%');

    -- Continental (uncategorized items)
    UPDATE products SET category_id = cat_continental 
    WHERE organization_id = xquisite_org 
      AND category_id IS NULL
      AND (name ILIKE '%Succulent Lamb in Oyster%' OR name ILIKE '%Mixed Grill%' OR name ILIKE '%Lamb with%');

    -- Oriental (uncategorized)
    UPDATE products SET category_id = cat_oriental 
    WHERE organization_id = xquisite_org 
      AND category_id IS NULL
      AND (name ILIKE '%Chinese Menu%' OR name ILIKE '%Sticky Rice%');

    -- Hors D'Oeuvre 
    UPDATE products SET category_id = cat_hors 
    WHERE organization_id = xquisite_org 
      AND category_id IS NULL
      AND (name ILIKE '%Grilled Jumbo Prawns%');

    RAISE NOTICE 'Nigerian and remaining products updated!';
END $$;

-- Verify final counts
SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
WHERE c.organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
GROUP BY c.name
ORDER BY c.name;

-- Show any remaining uncategorized
SELECT name FROM products 
WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
  AND category_id IS NULL;
