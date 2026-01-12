-- MANUAL PASSWORD RESET
-- Since the email flow is blocked, we will manually update the user's password in the database.
-- 1. Check if the user exists and is confirmed
SELECT id, email, encrypted_password, email_confirmed_at, raw_app_meta_data 
FROM auth.users 
WHERE email = 'toxsyyb@yahoo.co.uk';

-- 2. Force confirm the user (if email_confirmed_at is NULL)
UPDATE auth.users 
SET email_confirmed_at = now(), updated_at = now()
WHERE email = 'toxsyyb@yahoo.co.uk';

-- 3. Reset password again (ensure pgcrypto is enabled first)
-- Make sure to run: create extension if not exists pgcrypto;
UPDATE auth.users 
SET encrypted_password = crypt('Secur3rPassw0rd!', gen_salt('bf')) 
WHERE email = 'toxsyyb@yahoo.co.uk';
