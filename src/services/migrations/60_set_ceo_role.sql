-- SET USER TO CEO ROLE
-- The user explicitly stated this is the CEO account.
-- We must update the DB to match the Code changes (Role.CEO).

UPDATE public.profiles
SET role = 'Chief Executive Officer'
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

UPDATE public.employees
SET role = 'Chief Executive Officer'
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

SELECT email, role FROM public.profiles WHERE email ILIKE 'toxsyyb@yahoo.co.uk';
