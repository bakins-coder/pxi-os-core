-- Update existing bank account names to generic placeholders
-- Only for the organization currently being rebranded (ID: 10959119-72e4-4e57-ba54-923e36bba6a6)

UPDATE public.bank_accounts
SET bank_name = 'Bank Account',
    account_number = 'XXXXXXXXXX',
    last_updated = NOW()
WHERE company_id = '10959119-72e4-4e57-ba54-923e36bba6a6';
