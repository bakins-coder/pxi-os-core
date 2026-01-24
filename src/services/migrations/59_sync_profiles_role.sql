-- FORCE ADMIN ROLE
-- Targeted fix for 'toxsyyb@yahoo.co.uk' to ensure they see all tabs.

UPDATE public.profiles
SET role = 'Admin'
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

-- Double check employees table too
UPDATE public.employees
SET role = 'Admin'
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

SELECT email, role FROM public.profiles WHERE email ILIKE 'toxsyyb@yahoo.co.uk';
