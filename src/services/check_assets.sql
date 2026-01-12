-- Check inventory items that look like assets but might be misclassified
SELECT id, name, category, is_asset, stock_quantity 
FROM inventory 
WHERE 
  name ILIKE '%Charger%' OR 
  name ILIKE '%Knife%' OR 
  name ILIKE '%Cup%' OR 
  name ILIKE '%Glass%' OR 
  name ILIKE '%Spoon%' OR
  name ILIKE '%Fork%' OR
  category IN ('Components', 'Human Resources', 'Hardware', 'Crockery');
