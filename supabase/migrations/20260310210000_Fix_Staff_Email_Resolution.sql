-- ====================================================================
-- FIX: Dynamic Staff ID Resolution
-- ====================================================================

-- Issue: The previous get_email_by_staff_id RPC hardcoded XQ- IDs to 
--        always return .local emails, even when staff had real emails 
--        attached to their profile (like XQ-0014). This prevented them 
--        from using Forgot Password or logging in with their real emails 
--        if their Auth identity was synced.
-- Action: Remove the hardcoded ILIKE 'XQ-%' override so it accurately
--         pulls the staff's registered email from the employees table.

CREATE OR REPLACE FUNCTION get_email_by_staff_id(lookup_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Dynamically resolve the email from the employees table.
    -- If they have a real email (e.g. hussainitolani@gmail.com), it returns that.
    -- If they still use a .local email (e.g. xq-0011@xquisite.local), it returns that.
    RETURN (
        SELECT email 
        FROM public.employees 
        WHERE TRIM(staff_id) ILIKE TRIM(lookup_id) 
        LIMIT 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_staff_id(text) TO anon, authenticated, service_role;
