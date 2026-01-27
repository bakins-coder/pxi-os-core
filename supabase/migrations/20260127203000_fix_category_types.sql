-- FIX: Update menu categories to have correct category_type = 'menu'
-- These are food/menu categories, not catering_equipment

UPDATE categories 
SET category_type = 'menu'
WHERE organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
  AND name IN (
    'Continental', 
    'Dessert', 
    'Hors D''Oeuvre', 
    'Hot Plates', 
    'Nigerian Cuisine', 
    'Oriental', 
    'Salads', 
    'Starters'
  );

-- Verify the fix
SELECT name, category_type, COUNT(*) as count
FROM categories 
WHERE organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
GROUP BY name, category_type
ORDER BY name;
