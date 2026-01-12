-- DEBUG VISIBILITY AS USER
-- The data exists (verified), but the UI can't see it.
-- This checks if RLS or Org ID mismatch is the cause.

-- 1. Get the Target User's Details
SELECT 
    id as user_id, 
    email, 
    (raw_user_meta_data->>'company_id')::uuid as claim_company_id 
FROM auth.users 
WHERE email = 'tomiwab@hotmail.com';

-- 2. Get the Actual Organization Details
SELECT id as org_id, name FROM organizations WHERE name LIKE 'Xquisite%';

-- 3. Check Inventory items and WHICH Org they belong to
SELECT 
    name, 
    company_id, 
    (SELECT name FROM organizations WHERE id = inventory.company_id) as assigned_org_name
FROM inventory 
LIMIT 5;

-- 4. SIMULATE RLS (If possible, otherwise we infer from above)
-- If the 'claim_company_id' from step 1 matches 'company_id' from step 3, it SHOULD work.
-- If they differ, that's the bug.
