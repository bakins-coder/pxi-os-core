-- DIAGNOSTIC 52 (Visible Version)
-- Run this and look at the "Table" output below (not just messages).

SELECT 
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email as employee_email,
    e.staff_id,
    CASE 
        WHEN p.id IS NOT NULL THEN 'YES - Registered' 
        ELSE 'NO - Not Registered' 
    END as account_status,
    p.id as profile_id
FROM public.employees e
LEFT JOIN public.profiles p ON lower(p.email) = lower(e.email)
WHERE e.staff_id ILIKE 'XQ-0001' 
   OR e.email ILIKE 'xq-0001%'
   OR e.email ILIKE '%akinbee%';
