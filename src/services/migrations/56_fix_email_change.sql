-- ATTEMPT FIX: Backfill NULL email_change
-- Supabase AI suggests this column should be '' (empty string) but is NULL.
-- Since we are running this in the SQL Editor (Superuser), it might bypass the restrictions.

UPDATE auth.users 
SET email_change = '' 
WHERE email_change IS NULL;

-- Also ensure our target user is clean
UPDATE auth.users
SET email_change = ''
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

SELECT 'Fixed NULL email_change entries' as status;
