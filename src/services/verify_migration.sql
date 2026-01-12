-- VERIFY MIGRATION (SIMPLE CHECK)
-- Run this to see if the data is there.

SELECT 'Inventory Count' as type, count(*) FROM inventory;
SELECT 'Employee Count' as type, count(*) FROM employees;
SELECT 'Ledger Count' as type, count(*) FROM chart_of_accounts;

-- VERIFY SPECIFIC ITEMS
-- User wants to confirm these specific items exist:
SELECT name, stock_quantity 
FROM inventory 
WHERE name IN ('Black Chargers', 'Crystal Gold Chargers', 'Chinese plates');

-- Also correct total count?
SELECT count(*) as total_assets FROM inventory;
