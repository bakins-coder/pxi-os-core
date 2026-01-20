-- MIGRATION: ADD MISSING CONTACT FIELDS
-- Aligns database schema with CRM Acquisition Form

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Verify
DO $$
BEGIN
    RAISE NOTICE '✅ Added registration_number, industry, and job_title to contacts table.';
END $$;
