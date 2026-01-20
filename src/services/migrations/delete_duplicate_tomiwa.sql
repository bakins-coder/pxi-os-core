-- SAFE DELETION SCRIPT
-- Purpose: Keep the oldest record for 'tomiwab@hotmail.com' and delete the newer duplicates.

DELETE FROM public.employees
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as r_num
        FROM public.employees
        WHERE email = 'tomiwab@hotmail.com'
    ) t
    WHERE t.r_num > 1
);
