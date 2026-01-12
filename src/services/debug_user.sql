-- CHECK EXISTENCE AND REPORT
-- Run this entire block.

DO $$
DECLARE
    target_email TEXT := 'toxsyyb@yahoo.co.uk';
    user_record auth.users%ROWTYPE;
BEGIN
    SELECT * INTO user_record FROM auth.users WHERE email = target_email;
    
    IF FOUND THEN
        RAISE NOTICE 'SUCCESS: User % exists with ID %', target_email, user_record.id;
        RAISE NOTICE 'Confirmed At: %', user_record.email_confirmed_at;
        RAISE NOTICE 'Banned Until: %', user_record.banned_until;
    ELSE
        RAISE NOTICE 'CRITICAL FAILURE: User % DOES NOT EXIST in this database (Project: qbfhntvjqciardkjpfpy).', target_email;
        RAISE NOTICE 'The UPDATE password commands were doing nothing because there was no row to update.';
    END IF;
END $$;
