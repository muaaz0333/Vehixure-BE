-- Migration: Add customer activation fields to warranties table
-- Date: 2024-12-29
-- Purpose: Support customer terms acceptance workflow after installer verification

-- Add new verification status values
ALTER TABLE warranties 
DROP CONSTRAINT IF EXISTS warranties_verificationstatus_check;

ALTER TABLE warranties 
ADD CONSTRAINT warranties_verificationstatus_check 
CHECK (verificationstatus IN ('DRAFT', 'SUBMITTED', 'PENDING_CUSTOMER_ACTIVATION', 'VERIFIED', 'REJECTED', 'ACTIVE'));

-- Add new status values
ALTER TABLE warranties 
DROP CONSTRAINT IF EXISTS warranties_status_check;

ALTER TABLE warranties 
ADD CONSTRAINT warranties_status_check 
CHECK (status IN ('DRAFT', 'SUBMITTED', 'PENDING_CUSTOMER_ACTIVATION', 'VERIFIED', 'REJECTED', 'ACTIVE', 'EXPIRED', 'CANCELLED'));

-- Add customer activation columns
ALTER TABLE warranties 
ADD COLUMN IF NOT EXISTS customer_activation_token TEXT,
ADD COLUMN IF NOT EXISTS customer_activation_token_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_terms_accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_terms_accepted_ip TEXT,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS activated_by UUID,
ADD COLUMN IF NOT EXISTS inspection_due_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Create index for customer activation token lookup
CREATE INDEX IF NOT EXISTS idx_warranties_customer_activation_token 
ON warranties(customer_activation_token) 
WHERE customer_activation_token IS NOT NULL;

-- Create index for active warranties
CREATE INDEX IF NOT EXISTS idx_warranties_is_active 
ON warranties(is_active) 
WHERE is_active = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN warranties.customer_activation_token IS 'Token sent to customer for terms acceptance';
COMMENT ON COLUMN warranties.customer_terms_accepted_at IS 'Timestamp when customer accepted warranty terms';
COMMENT ON COLUMN warranties.customer_terms_accepted_ip IS 'IP address of customer when accepting terms';
COMMENT ON COLUMN warranties.activated_at IS 'Timestamp when warranty was fully activated';
COMMENT ON COLUMN warranties.activated_by IS 'User ID who activated (customer via token or admin override)';
COMMENT ON COLUMN warranties.inspection_due_date IS 'Date when first annual inspection is due (12 months from installation)';
COMMENT ON COLUMN warranties.is_active IS 'Whether warranty is currently active (after customer acceptance)';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'warranties' 
AND column_name IN (
    'customer_activation_token',
    'customer_terms_accepted_at',
    'customer_terms_accepted_ip',
    'activated_at',
    'activated_by',
    'inspection_due_date',
    'is_active'
)
ORDER BY column_name;
