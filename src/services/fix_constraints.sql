-- SQL Fix for "No Unique Constraint" Error
-- Run this script in the Supabase SQL Editor.
-- It ensures all tables used in the sync process have a PRIMARY KEY on 'id'.

-- 1. Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    ALTER TABLE projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;

-- 2. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID,
    title TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    ALTER TABLE tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;

-- 3. Requisitions
CREATE TABLE IF NOT EXISTS requisitions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID,
    item_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    ALTER TABLE requisitions ADD CONSTRAINT requisitions_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;

-- 4. Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID,
    code TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    ALTER TABLE chart_of_accounts ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;

-- 5. Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;

-- 6. Employees API (Handling the mismatch)
-- If employees_api exists (was created without constraint), we fix it.
-- If it doesn't exist, we create it.
CREATE TABLE IF NOT EXISTS employees_api (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
    ALTER TABLE employees_api ADD CONSTRAINT employees_api_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;

-- 7. Ensure Standard Tables also have PK (Just in case)
DO $$ BEGIN
    ALTER TABLE invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE bookkeeping ADD CONSTRAINT bookkeeping_pkey PRIMARY KEY (id);
EXCEPTION WHEN invalid_table_definition OR duplicate_object THEN NULL; END $$;
