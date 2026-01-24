-- DIAGNOSTIC: Check Role Permissions (Table Output)
-- Purpose: Returns a visible table showing which employee roles have valid permissions.

SELECT 
    e.role as "Employee Role",
    count(e.id) as "Staff Count",
    CASE 
        WHEN jr.title IS NOT NULL THEN '✅ Linked' 
        ELSE '❌ Missing in Job Roles' 
    END as "Status",
    COALESCE(array_length(jr.permissions, 1), 0) as "Permission Tags",
    COALESCE(jr.permissions::text, '[]') as "Assigned Permissions"
FROM public.employees e
LEFT JOIN public.job_roles jr ON jr.title ILIKE e.role
GROUP BY e.role, jr.title, jr.permissions
ORDER BY "Status" ASC, "Staff Count" DESC;
