-- FIX: Update menu categories to belong to the correct organization
-- Products org: 31ef4cda-7dd2-4ada-a6fd-a3da33c38896
-- Categories currently in: 10959119-72e4-4e57-ba54-923e36bba6a6

-- Option A: Update the categories to match the products' organization
-- (This makes the categories org-specific to your products)

UPDATE categories 
SET organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6'
  AND category_type = 'menu';

-- Verify the fix
SELECT id, name, category_type, organization_id 
FROM categories 
WHERE organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
ORDER BY name;
