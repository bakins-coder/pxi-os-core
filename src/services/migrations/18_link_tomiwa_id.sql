-- MIGRATION: 18 Link Tomiwa ID
-- Purpose: Set specific Staff ID for requested user as XQ-0002

UPDATE public.employees
SET staff_id = 'XQ-0002'
WHERE email = 'tomiwab@hotmail.com';

-- Ensure CEO is definitely XQ-0001 (just in case)
UPDATE public.employees
SET staff_id = 'XQ-0001'
WHERE role = 'Chief Executive Officer';
