-- List all employees to identify names for ID assignment
SELECT id, first_name, last_name, email, role, staff_id, created_at
FROM public.employees
ORDER BY created_at ASC;
