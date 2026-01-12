
SELECT id, name, category, type, stock_quantity, price_cents 
FROM inventory 
WHERE type = 'product' 
ORDER BY category;
