
-- MIGRATION: Support Staff ID Based Authentication
-- Purpose: Allow linking auth users to employees via a unique 'Staff ID' instead of email.

-- 1. Add `staff_id` column to `employees` table
-- This must be unique to prevent collisions when used as a login identifier.
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS staff_id TEXT UNIQUE;

-- 2. Update the Linking Trigger Function
-- We modify the function to check for Staff ID matches if the email follows the system pattern.

CREATE OR REPLACE FUNCTION public.handle_new_user_linking() 
RETURNS TRIGGER AS $$
DECLARE
    matched_employee_id UUID;
    matched_org_id UUID;
    matched_role TEXT;
    matched_first_name TEXT;
    matched_last_name TEXT;
    
    is_system_id BOOLEAN;
    extracted_id TEXT;
BEGIN
    -- INIT
    matched_employee_id := NULL;
    is_system_id := (NEW.email LIKE '%@xquisite.local');

    IF is_system_id THEN
        -- Extract the ID (everything before @xquisite.local)
        extracted_id := split_part(NEW.email, '@', 1);
        
        RAISE LOG 'Attempting Staff ID Link for: %', extracted_id;

        SELECT id, organization_id, role, first_name, last_name 
        INTO matched_employee_id, matched_org_id, matched_role, matched_first_name, matched_last_name
        FROM public.employees 
        WHERE staff_id ILIKE extracted_id 
        LIMIT 1;
    ELSE
        -- Standard Email Link
        SELECT id, organization_id, role, first_name, last_name 
        INTO matched_employee_id, matched_org_id, matched_role, matched_first_name, matched_last_name
        FROM public.employees 
        WHERE email = NEW.email 
        LIMIT 1;
    END IF;

    -- If a match is found
    IF matched_employee_id IS NOT NULL THEN
        -- Link Profile
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

        -- Link Employee Record
        UPDATE public.employees
        SET user_id = NEW.id
        WHERE id = matched_employee_id;
        
        RAISE LOG 'Auto-linked User % to Employee % (Org: %)', NEW.email, matched_employee_id, matched_org_id;

    ELSE
        -- Default Profile Creation (Guest/New Org Owner)
        INSERT INTO public.profiles (id, organization_id, email, role, first_name, last_name, avatar_url)
        VALUES (
            NEW.id,
            (NEW.raw_user_meta_data->>'company_id')::uuid, 
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'role', 'Guest'),
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'System User'),
            '',
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- 3. Backfill Existing Employees
-- We need to ensure all current staff have an ID so they can login.
-- We will use a sequence-like approach to generate IDs like XQ-1001, XQ-1002, etc.

DO $$
DECLARE
    emp RECORD;
    counter INT := 1000;
BEGIN
    FOR emp IN SELECT id FROM public.employees WHERE staff_id IS NULL LOOP
        counter := counter + 1;
        UPDATE public.employees
        SET staff_id = 'XQ-' || counter
        WHERE id = emp.id;
    END LOOP;
END $$;
