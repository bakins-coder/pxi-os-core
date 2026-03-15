-- SYNC: Copy product_category_id values to category_id
-- This ensures both columns have the same category reference

-- Step 1: Sync the columns
UPDATE products 
SET category_id = product_category_id 
WHERE product_category_id IS NOT NULL 
  AND (category_id IS NULL OR category_id != product_category_id);

-- Step 2: Verify the sync
SELECT 
    p.name as product_name,
    p.category_id,
    p.product_category_id,
    c.name as category_name,
    c.category_type
FROM products p
LEFT JOIN categories c ON c.id = COALESCE(p.category_id, p.product_category_id)
WHERE p.organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
ORDER BY c.name, p.name;
