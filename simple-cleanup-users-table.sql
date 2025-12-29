-- Simple cleanup of users table - remove unnecessary columns
-- This keeps the existing structure but removes duplicate/unnecessary fields

-- =====================================================
-- 1. REMOVE UNNECESSARY COLUMNS FROM USERS TABLE
-- =====================================================

-- Remove duplicate business information (this should be in partner_accounts table only)
ALTER TABLE users DROP COLUMN IF EXISTS "businessName" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "contact" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "streetAddress" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "city" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "state" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "postcode" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "faxNumber" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "installerId" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "productsSold" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "buyPrice" CASCADE;

-- Remove social/profile columns not needed for business system
ALTER TABLE users DROP COLUMN IF EXISTS "gender" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "bio" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "imageUrl" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "coverImageUrl" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "googleAccessToken" CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS "deviceId" CASCADE;

-- Remove legacy agent type (replaced by partnerRole)
ALTER TABLE users DROP COLUMN IF EXISTS "agentType" CASCADE;

-- Remove username if not needed
ALTER TABLE users DROP COLUMN IF EXISTS "username" CASCADE;

-- =====================================================
-- 2. ENSURE PROPER CONSTRAINTS
-- =====================================================

-- Make sure mobileNumber is unique for SMS verification
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobileNumber_key;
ALTER TABLE users ADD CONSTRAINT users_mobileNumber_unique 
    UNIQUE("mobileNumber") DEFERRABLE INITIALLY DEFERRED;

-- Remove unique constraint on phone (business phone, not personal)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Ensure partner account foreign key exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_partner_account_fk;
ALTER TABLE users ADD CONSTRAINT users_partner_account_fk 
    FOREIGN KEY ("partnerAccountId") REFERENCES partner_accounts(id) ON DELETE SET NULL;

-- =====================================================
-- 3. ADD USEFUL INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_partner_account 
    ON users("partnerAccountId") WHERE "partnerAccountId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_partner_role 
    ON users("partnerRole") WHERE "partnerRole" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_mobile_number 
    ON users("mobileNumber") WHERE "mobileNumber" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_active 
    ON users(role) WHERE "isDeleted" = false;

-- =====================================================
-- 4. CLEAN UP DATA
-- =====================================================

-- Set default values for verification attempts
UPDATE users SET "verificationAttempts" = 0 WHERE "verificationAttempts" IS NULL;

-- Ensure boolean fields have proper defaults
UPDATE users SET "isAccreditedInstaller" = false WHERE "isAccreditedInstaller" IS NULL;
UPDATE users SET "isAuthorisedInspector" = false WHERE "isAuthorisedInspector" IS NULL;

-- =====================================================
-- 5. VERIFY CLEANUP
-- =====================================================

-- Show final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

COMMIT;