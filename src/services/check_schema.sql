-- CHECK PUBLIC SCHEMA TABLES
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public';

-- Check if specific 'profiles' table exists and has data for the user
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'toxsyyb@yahoo.co.uk');

-- If profiles table doesn't exist, check 'users' table in public
SELECT * FROM public.users WHERE id = (SELECT id FROM auth.users WHERE email = 'toxsyyb@yahoo.co.uk');
