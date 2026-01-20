
-- MIGRATION: Link Auth Users to Employees Table
-- Purpose: Automatically link a new Auth User to an existing Employee record if emails match.

-- 1. Ensure `profiles` table exists (if not already created)
-- This table is critical for RLS. If it exists, this handles it gracefully.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    email TEXT,
    role TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Add `user_id` column to `employees` table (Back-link)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Create Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_linking() 
RETURNS TRIGGER AS $$
DECLARE
    matched_employee_id UUID;
    matched_org_id UUID;
    matched_role TEXT;
    matched_first_name TEXT;
    matched_last_name TEXT;
BEGIN
    -- Search for an existing employee with the same email
    -- We assume email in `employees` is unique per organization, but we take the first match if multiple.
    SELECT id, organization_id, role, first_name, last_name 
    INTO matched_employee_id, matched_org_id, matched_role, matched_first_name, matched_last_name
    FROM public.employees 
    WHERE email = NEW.email 
    LIMIT 1;

    -- If a match is found
    IF matched_employee_id IS NOT NULL THEN
        -- A. Create the Profile for the new user, using the Employee's Org & Role
        INSERT INTO public.profiles (id, organization_id, email, role, first_name, last_name, avatar_url)
        VALUES (
            NEW.id,
            matched_org_id,
            NEW.email,
            matched_role,
            matched_first_name,
            matched_last_name,
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            organization_id = EXCLUDED.organization_id,
            role = EXCLUDED.role;

        -- B. Update the Employee record to link to this Auth User
        UPDATE public.employees
        SET user_id = NEW.id
        WHERE id = matched_employee_id;
        
        RAISE LOG 'Auto-linked User % to Employee % (Org: %)', NEW.email, matched_employee_id, matched_org_id;

    ELSE
        -- If NO match found, create a basic profile (or let another trigger handle it).
        -- Here we create a default profile but WITHOUT an org_id if not found, 
        -- OR we respect the metadata passed during signup if any (e.g. from Setup Wizard).
        INSERT INTO public.profiles (id, organization_id, email, role, first_name, last_name, avatar_url)
        VALUES (
            NEW.id,
            (NEW.raw_user_meta_data->>'company_id')::uuid, -- Fallback to metadata
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'role', 'Guest'),
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), -- Simplified name fallback
            '',
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- 4. Attach Trigger to `auth.users`
DROP TRIGGER IF EXISTS on_auth_user_created_link_employee ON auth.users;
CREATE TRIGGER on_auth_user_created_link_employee
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_linking();

-- 5. Backfill/Maintenance (Optional): Link existing users if they aren't linked
-- This is just a query you can run manually if needed, not part of the trigger flow.
-- UPDATE employees e
-- SET user_id = u.id
-- FROM auth.users u
-- WHERE e.email = u.email AND e.user_id IS NULL;
