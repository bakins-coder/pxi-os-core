-- Add Set Price and Discount columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS manual_set_price_cents BIGINT,
ADD COLUMN IF NOT EXISTS discount_cents BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS standard_total_cents BIGINT;

-- Comment on columns for clarity
COMMENT ON COLUMN invoices.manual_set_price_cents IS 'The fixed price set by the user (overrides calculated total)';
COMMENT ON COLUMN invoices.discount_cents IS 'The difference between standard_total_cents and manual_set_price_cents';
COMMENT ON COLUMN invoices.standard_total_cents IS 'The calculated total (Subtotal + SC + VAT) before any set price override';
