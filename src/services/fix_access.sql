-- FIX ACCESS & OWNERSHIP
-- 1. Make tomiwab@hotmail.com the OWNER of the organization (satisfies org_select_by_owner)
-- 2. Ensure Profiles are visible to their owners.

DO $$
DECLARE
    target_email TEXT := 'tomiwab@hotmail.com';
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- 1. SET OWNERSHIP
    UPDATE public.organizations
    SET owner_id = user_id
    WHERE name = 'Xquisite Celebrations Limited';
    
    RAISE NOTICE 'Ownership of Xquisite Celebrations Limited transferred to %', target_email;

END $$;

-- 2. ENSURE PROFILE VISIBILITY
-- (If RLS is on, we need this. If off, it does nothing harmful)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. BROADEN ORGANIZATION VISIBILITY (Optional but recommended)
-- Allow users to view the organization they belong to (via profile link)
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
CREATE POLICY "Members can view their organization"
ON public.organizations FOR SELECT
USING (
    id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
