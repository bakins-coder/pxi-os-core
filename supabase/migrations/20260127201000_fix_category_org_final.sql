-- FINAL FIX: Move ALL categories from old org to correct org
-- (Remove the category_type filter that was causing the issue)

-- Products org (CORRECT): 31ef4cda-7dd2-4ada-a6fd-a3da33c38896
-- Categories org (WRONG):  10959119-72e4-4e57-ba54-923e36bba6a6

UPDATE categories 
SET organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
WHERE organization_id = '10959119-72e4-4e57-ba54-923e36bba6a6';

-- Verify: Show all categories now in correct org
SELECT id, name, category_type, organization_id 
FROM categories 
WHERE organization_id = '31ef4cda-7dd2-4ada-a6fd-a3da33c38896'
ORDER BY category_type, name;
