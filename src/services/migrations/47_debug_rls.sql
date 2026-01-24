-- 1. Check existing policies on profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 2. Check the specific user's flags
SELECT id, email, role, is_super_admin 
FROM public.profiles 
WHERE email ILIKE 'tomiwab@hotmail.com';

-- 3. Check auth.users for the same email to ensure ID match
SELECT id, email 
FROM auth.users 
WHERE email ILIKE 'tomiwab@hotmail.com';

-- 4. FORCE UPDATE just in case
UPDATE public.profiles
SET is_super_admin = true
WHERE email ILIKE 'tomiwab@hotmail.com';

-- 5. Ensure "Users can read own profile" policy exists
-- We drop and recreate it to be absolutely sure.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 6. Ensure "Super Admins can view all" policy exists
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Super Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_super_admin = true);

-- 7. Grant access explicitly? (Usually RLS handles it, but good to check grants)
GRANT SELECT ON public.profiles TO authenticated;
