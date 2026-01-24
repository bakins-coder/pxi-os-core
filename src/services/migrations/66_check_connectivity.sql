-- CHECK DATABASE CONNECTIVITY
-- Simple query to verify schema read access.

DO $$
DECLARE
    emp_count integer;
BEGIN
    SELECT count(*) INTO emp_count FROM public.employees;
    RAISE NOTICE 'Database Connection OK. Found % employees.', emp_count;
END $$;

SELECT 'Connection Successful' as status;
