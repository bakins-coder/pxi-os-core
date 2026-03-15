-- Migration to add cuisine_details and migrate data from banquet_details
ALTER TABLE catering_events ADD COLUMN IF NOT EXISTS cuisine_details JSONB;

-- Migrate existing Cuisine data
-- If order_type is Cuisine and banquet_details is not empty, move it to cuisine_details
UPDATE catering_events
SET cuisine_details = banquet_details,
    banquet_details = '{}'::jsonb
WHERE order_type = 'Cuisine' 
AND banquet_details IS NOT NULL 
AND banquet_details != '{}'::jsonb;

-- Ensure both are never null
UPDATE catering_events SET banquet_details = '{}'::jsonb WHERE banquet_details IS NULL;
UPDATE catering_events SET cuisine_details = '{}'::jsonb WHERE cuisine_details IS NULL;
