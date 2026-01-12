-- SYNCHRONIZATION SCRIPT
-- Run this in your Supabase SQL Editor to ensure all tables have the required columns.

-- 1. Organizations Table Expansion
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_color TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS firs_tin TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS annual_turnover_cents BIGINT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enabled_modules TEXT[];
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_person JSONB;

-- 2. CRM / Contacts Table Expansion (Company Data Requirements)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sentiment_score FLOAT DEFAULT 0.5;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Individual';
