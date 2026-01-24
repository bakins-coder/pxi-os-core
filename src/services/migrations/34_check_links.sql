-- DIAGNOSTIC: Check Employee Linking Status
SELECT 
    count(*) as total_employees,
    count(user_id) as linked_employees,
    count(*) - count(user_id) as unlinked_employees
FROM public.employees;

-- List Employees who are LINKED but NOT in the exclusion list
-- These are the ones we might need to reset if they have 'password issues'
SELECT 
    e.first_name, 
    e.last_name, 
    e.email, 
    e.staff_id, 
    u.email as auth_email, 
    u.last_sign_in_at
FROM public.employees e
JOIN auth.users u ON e.user_id = u.id
WHERE u.email NOT IN ('tomiwab@hotmail.com', 'toxsyyb@yahoo.co.uk');
