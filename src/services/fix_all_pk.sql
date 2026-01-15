-- COMPREHENSIVE FIX FOR SYNC ERRORS
-- Run this script in the Supabase SQL Editor.
-- It ensures EVERY table used in sync has a Primary Key on 'id'.
-- This is required for the 'ON CONFLICT' upsert to work.

-- 1. Projects
CREATE TABLE IF NOT EXISTS projects (id UUID DEFAULT gen_random_uuid(), company_id UUID, name TEXT);
DO $$ BEGIN ALTER TABLE projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Tasks
CREATE TABLE IF NOT EXISTS tasks (id UUID DEFAULT gen_random_uuid(), company_id UUID, title TEXT, status TEXT);
DO $$ BEGIN ALTER TABLE tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Requisitions
CREATE TABLE IF NOT EXISTS requisitions (id UUID DEFAULT gen_random_uuid(), company_id UUID, item_name TEXT);
DO $$ BEGIN ALTER TABLE requisitions ADD CONSTRAINT requisitions_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (id UUID DEFAULT gen_random_uuid(), company_id UUID, code TEXT, name TEXT);
DO $$ BEGIN ALTER TABLE chart_of_accounts ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 5. Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (id UUID DEFAULT gen_random_uuid(), company_id UUID);
DO $$ BEGIN ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Employees (The specific table we are now syncing to)
CREATE TABLE IF NOT EXISTS employees (id UUID DEFAULT gen_random_uuid(), company_id UUID, first_name TEXT, last_name TEXT, role TEXT);
DO $$ BEGIN ALTER TABLE employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. Catering Events
CREATE TABLE IF NOT EXISTS catering_events (id UUID DEFAULT gen_random_uuid(), company_id UUID);
DO $$ BEGIN ALTER TABLE catering_events ADD CONSTRAINT catering_events_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. Bookkeeping
CREATE TABLE IF NOT EXISTS bookkeeping (id UUID DEFAULT gen_random_uuid(), company_id UUID);
DO $$ BEGIN ALTER TABLE bookkeeping ADD CONSTRAINT bookkeeping_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 9. Invoices
CREATE TABLE IF NOT EXISTS invoices (id UUID DEFAULT gen_random_uuid(), company_id UUID);
DO $$ BEGIN ALTER TABLE invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 10. Contacts
CREATE TABLE IF NOT EXISTS contacts (id UUID DEFAULT gen_random_uuid(), company_id UUID);
DO $$ BEGIN ALTER TABLE contacts ADD CONSTRAINT contacts_pkey PRIMARY KEY (id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
