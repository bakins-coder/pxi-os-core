-- SEED TEST LEAVE REQUEST (Constraint Safe)
-- Logic: Procedure to ensure Test Employee exists, then add request.

DO $$
DECLARE
    test_email text := 'test.staff@xquisite.com';
    test_id uuid;
    org_id uuid;
BEGIN
    -- 1. Get Org
    SELECT id INTO org_id FROM public.organizations LIMIT 1;

    -- 2. Ensure Test Employee
    SELECT id INTO test_id FROM public.employees WHERE email = test_email LIMIT 1;

    IF test_id IS NULL THEN
        INSERT INTO public.employees (
            organization_id, first_name, last_name, email, role, status, salary_cents, gender, dob, staff_id
        )
        VALUES (
            org_id, 'Test', 'Employee', test_email, 'Employee', 'active', 5000000, 'Male', '1990-01-01', 'XQ-TEST1'
        )
        RETURNING id INTO test_id;
        RAISE NOTICE 'Created Test Employee';
    ELSE
        RAISE NOTICE 'Test Employee Exists';
    END IF;

    -- 3. Ensure Pending Leave Request
    IF NOT EXISTS (SELECT 1 FROM public.leave_requests WHERE employee_id = test_id AND status = 'Pending') THEN
        INSERT INTO public.leave_requests (
            employee_id, type, start_date, end_date, reason, status
        )
        VALUES (
            test_id, 'Annual', CURRENT_DATE + 5, CURRENT_DATE + 10, 'Req: Testing CEO Approval Workflow', 'Pending'
        );
        RAISE NOTICE 'Created Leave Request';
    ELSE
         RAISE NOTICE 'Leave Request Already Exists';
    END IF;

END $$;
