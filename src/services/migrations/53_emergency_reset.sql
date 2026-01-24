-- EMERGENCY RESET: DELETE STUCK USER
-- This will delete the user from Authentication so you can "Sign Up" again with a new password.

-- 1. Delete from public.employees (to free up staff ID 'XQ-0001' if bound)
DELETE FROM public.employees 
WHERE email ILIKE 'toxsyyb@yahoo.co.uk' 
   OR staff_id = 'XQ-0001';

-- 2. Delete from public.profiles (if any partial record exists)
DELETE FROM public.profiles 
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

-- 3. Delete from auth.users (The Core Identity)
-- NOTE: You must run this in the Supabase Dashboard SQL Editor directly. 
-- It requires higher privileges than standard app connections usually have.
DELETE FROM auth.users 
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

SELECT 'User deleted. You can now Sign Up again.' as result;
