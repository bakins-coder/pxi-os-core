-- CHECK FOR EXISTING DATA TO MIGRATE
-- The user wants to migrate "previously captured" data.
-- We check if there are rows in key tables that might belong to Xquisite but aren't linked correctly.

SELECT 'employees' as table_name, count(*) as total_rows, 
       count(*) filter (where company_id IS NULL) as null_company,
       count(*) filter (where company_id = (SELECT id FROM organizations WHERE name = 'Xquisite Celebrations Limited')) as linked_correctly
FROM public.employees;

SELECT 'inventory' as table_name, count(*) as total_rows, 
       count(*) filter (where company_id IS NULL) as null_company
FROM public.inventory;

SELECT 'ledger_transactions' as table_name, count(*) as total_rows, 
       count(*) filter (where tenant_id IS NULL) as null_company
FROM public.ledger_transactions;

-- LIST sample rows to see if we can identify them by name
SELECT * FROM public.employees LIMIT 5;
SELECT * FROM public.inventory LIMIT 5;
