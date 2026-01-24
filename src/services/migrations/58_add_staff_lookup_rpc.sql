-- SECURE PUBLIC LOOKUP FUNCTION
-- Reason: "employees" table is RLS protected (private). Anonymous users cannot search it.
-- Solution: A "Security Definer" function that runs with admin privileges to return ONLY the email.

CREATE OR REPLACE FUNCTION public.get_email_by_staff_id(lookup_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as Creator (Admin), ignoring RLS
AS $$
DECLARE
    found_email text;
BEGIN
    SELECT email INTO found_email
    FROM public.employees
    WHERE staff_id ILIKE lookup_id
    LIMIT 1;
    
    RETURN found_email;
END;
$$;

-- Grant access to public (anonymous users) for login flow
GRANT EXECUTE ON FUNCTION public.get_email_by_staff_id(text) TO anon, authenticated, service_role;

SELECT 'Secure Lookup Function Created' as status;
