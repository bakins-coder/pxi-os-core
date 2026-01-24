-- FIX RPC: ALIGN WITH FRONTEND (p_staff_id)
-- Reason: Using 'staff_id' causes ambiguity or name collision.
-- We switch to 'p_staff_id' and update frontend to match.

-- 1. Drop existing functions (clean up both names just in case)
DROP FUNCTION IF EXISTS get_employee_email_by_staff_id(text);

-- 2. Create with SAFE parameter name 'p_staff_id'
CREATE OR REPLACE FUNCTION get_employee_email_by_staff_id(p_staff_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_email text;
BEGIN
    SELECT email INTO found_email
    FROM public.employees
    WHERE staff_id = p_staff_id -- No ambiguity here
    LIMIT 1;
    
    RETURN found_email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_employee_email_by_staff_id(text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload config';

SELECT 'RPC Updated to use p_staff_id' as status;
