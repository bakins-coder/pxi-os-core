-- DANGEROUS: Disable Row Level Security (RLS) for Development/Testing
-- Running this script will make your database PUBLICLY WRITABLE if you have the API keys.
-- Use this ONLY for testing if you are using "Mock Auth" in the app.

-- Organizations & Users
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Core Business Data
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeping DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Operations
ALTER TABLE catering_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions DISABLE ROW LEVEL SECURITY;

-- Financials
ALTER TABLE chart_of_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions DISABLE ROW LEVEL SECURITY;

-- NOTE: To re-enable security later, run the same commands but replace "DISABLE" with "ENABLE".
