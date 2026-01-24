-- 1. Upsert Profile to ensure it exists
-- Using first_name and last_name since 'name' column does not exist
INSERT INTO public.profiles (id, email, role, organization_id, first_name, last_name, is_super_admin)
SELECT 
  id, 
  email, 
  'ADMIN', -- Default role
  (SELECT id FROM organizations LIMIT 1), -- Attach to valid org
  'Tomiwa', -- First Name
  'B',      -- Last Name
  true      -- Force Super Admin
FROM auth.users
WHERE email ILIKE 'tomiwab@hotmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  is_super_admin = true; 

-- 2. Verify Result
SELECT 
    p.email, 
    p.role, 
    p.first_name,
    p.last_name,
    p.is_super_admin as "IS_SUPER_ADMIN_FLAG", 
    u.id as "AUTH_ID"
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email ILIKE 'tomiwab@hotmail.com';
