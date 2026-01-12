-- SIMPLER RESET (To rule out special character issues)
-- Password will be exactly: welcome123

UPDATE auth.users 
SET encrypted_password = crypt('welcome123', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'toxsyyb@yahoo.co.uk';

-- Check the result
SELECT email, email_confirmed_at, updated_at FROM auth.users WHERE email = 'toxsyyb@yahoo.co.uk';
