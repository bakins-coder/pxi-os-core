-- VERIFICATION: Check Profile Org ID
SELECT 
    p.id, 
    u.email, 
    p.organization_id, 
    p.full_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('toxsyyb@yahoo.co.uk', 'tomiwab@hotmail.com');
