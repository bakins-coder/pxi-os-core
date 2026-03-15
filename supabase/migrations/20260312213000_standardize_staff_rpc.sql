
-- Standardize staff email resolution RPC
-- Supports both lookup_id (for consistency with schema) and p_staff_id (for backward compatibility)

CREATE OR REPLACE FUNCTION public.get_email_by_staff_id(
  lookup_id text DEFAULT NULL,
  p_staff_id text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  target_id text;
  result_email text;
BEGIN
  -- Use whichever ID is provided
  target_id := COALESCE(lookup_id, p_staff_id);
  
  IF target_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO result_email
  FROM public.employees
  WHERE UPPER(staff_id) = UPPER(target_id)
  LIMIT 1;

  RETURN result_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anonymous/authenticated users for login flow
GRANT EXECUTE ON FUNCTION public.get_email_by_staff_id(text, text) TO anon, authenticated;
