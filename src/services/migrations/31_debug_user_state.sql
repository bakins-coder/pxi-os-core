-- DIAGNOSTIC: Check User-Profile-Employee Link
-- Purpose: Verify if the sync scripts actually worked and if RLS is allowing visibility.

SELECT 
    au.email as auth_email,
    au.id as auth_id,
    p.organization_id as profile_org_id,
    p.role as profile_role,
    e.organization_id as emp_org_id,
    e.staff_id as emp_staff_id,
    o.name as org_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.employees e ON e.email = au.email
LEFT JOIN public.organizations o ON o.id = p.organization_id
WHERE au.email IN ('toxsyyb@yahoo.co.uk', 'tomiwab@hotmail.com', 'victoria@xquisite.com');
