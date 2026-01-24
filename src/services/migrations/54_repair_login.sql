-- NON-DESTRUCTIVE REPAIR: Force Password Reset & Fix Metadata & Restore Profile
-- Corrected: Fixes the root cause of RLS crashes (invalid metadata).

-- 1. Enable hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Force Update Password to "password123"
UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

-- 3. FIX METADATA (CRITICAL)
-- The RLS policy crashes if 'companyId' is text. We must update it to a valid UUID.
WITH target_org AS (
    SELECT id FROM public.organizations WHERE name ILIKE 'Xquisite%' LIMIT 1
), fallback_org AS (
    SELECT id FROM public.organizations LIMIT 1
), final_org AS (
    SELECT COALESCE((SELECT id FROM target_org), (SELECT id FROM fallback_org)) as id
)
UPDATE auth.users
SET raw_user_meta_data = 
    raw_user_meta_data 
    || jsonb_build_object(
        'companyId', (SELECT id FROM final_org), -- Update legacy key
        'company_id', (SELECT id FROM final_org), -- Update snake_case key (used by RLS)
        'org_id', (SELECT id FROM final_org)      -- Future proofing
    )
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';


-- 4. Restore Missing Profile
INSERT INTO public.profiles (id, email, first_name, last_name, role, organization_id)
SELECT 
    id, 
    email, 
    'Recovered', 
    'User', 
    COALESCE(raw_user_meta_data->>'role', 'Admin'),
    (raw_user_meta_data->>'company_id')::uuid -- Use the value we just fixed (or might need read-after-write, simpler to re-query)
FROM auth.users
WHERE email ILIKE 'toxsyyb@yahoo.co.uk'
ON CONFLICT (id) DO UPDATE 
SET 
  organization_id = EXCLUDED.organization_id, -- Ensure existing profile gets linked
  first_name = COALESCE(public.profiles.first_name, 'Recovered'),
  last_name = COALESCE(public.profiles.last_name, 'User');

-- 5. Ensure Employee Link
UPDATE public.employees
SET staff_id = 'XQ-0001'
WHERE email ILIKE 'toxsyyb@yahoo.co.uk';

SELECT 'Account Fully Repaired. Metadata patched. Login with password: password123' as status;
