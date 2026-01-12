-- Check distribution of new 'type' column
SELECT type, category, count(*) 
FROM inventory 
GROUP BY type, category
ORDER BY type;

-- Check specific known assets to see their current state
SELECT name, category, is_asset, type 
FROM inventory 
WHERE name ILIKE '%Glass%' OR name ILIKE '%Bowl%' OR name ILIKE '%Plate%'
LIMIT 10;
