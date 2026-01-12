-- DEBUG MIGRATION
-- Why is the seed script not inserting?

-- 1. Check what Organizations actually exist
SELECT id, name, created_at FROM organizations;

-- 2. Check if we can start finding them with LIKE
SELECT id, name FROM organizations WHERE name LIKE 'Xquisite%';

-- 3. Check if data ALREADY exists (maybe it worked before?)
SELECT 'Inventory Count' as check, count(*) FROM inventory;
SELECT 'Employee Count' as check, count(*) FROM employees;
SELECT 'CoA Count' as check, count(*) FROM chart_of_accounts;

-- 4. Check RLS status (Are we blocked from seeing the org?)
SELECT * FROM pg_policies WHERE tablename = 'organizations';
