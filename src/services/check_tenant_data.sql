-- check_tenant_data.sql
-- Run this in your Supabase SQL Editor to see what organization your data belongs to.

-- 1. Check all employees and their Organizations
SELECT 
    e.first_name, 
    e.last_name, 
    e.company_id, 
    o.name as organization_name 
FROM employees e
LEFT JOIN organizations o ON e.company_id = o.id
WHERE e.company_id = '10959119-72e4-4e57-ba54-923e36bba6a6'; -- Check for Default/Mock bucket

-- 2. Check for Mariam or Olaboye specifically across ALL organizations
SELECT * FROM employees 
WHERE first_name ILIKE '%Mariam%' OR last_name ILIKE '%Olaboye%';
