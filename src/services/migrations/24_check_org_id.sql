-- DIAGNOSTIC: Check Organization IDs
-- Purpose: Verify if employees and profiles have valid organization_id links.

SELECT 
    e.email, 
    e.first_name, 
    e.staff_id, 
    e.organization_id as emp_org_id,
    p.organization_id as profile_org_id,
    u.email as auth_email
FROM public.employees e
LEFT JOIN auth.users u ON u.email = e.email
LEFT JOIN public.profiles p ON p.id = u.id
WHERE e.email IN ('tomiwab@hotmail.com', 'toxsyyb@yahoo.co.uk', 'victoria@xquisite.com', 'meekaylarh@gmail.com');
