-- DIAGNOSTIC: Check if Super Admin Users Exist
-- Purpose: Verify existence of the 4 requested emails in auth.users or public.profiles.

SELECT 
    au.email as "Auth Email",
    p.id as "Profile ID",
    p.first_name,
    p.last_name,
    CASE WHEN p.id IS NOT NULL THEN '✅ Ready' ELSE '❌ Missing Profile' END as "Status"
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email IN (
    'akinbee@gmail.com',
    'akinb@hotmail.com',
    'tomiwab@hotmail.com',
    'oreoluwatomiwab@gmail.com'
);
