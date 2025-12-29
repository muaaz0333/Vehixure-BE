-- Migration to clean up User table schema and remove duplicate columns
-- This migration removes legacy columns that are now handled by the PartnerAccount entity

-- =====================================================
-- 1. BACKUP IMPORTANT DATA FIRST
-- =====================================================

-- Create temporary table to backup any important legacy data
CREATE TABLE IF NOT EXISTS user_legacy_backup AS
SELECT 
    id,
    email,
    businessName,
    contact,
    streetAddress,
    city,
    state,
    postcode,
    faxNumber,
    installerId,
    agentType,
    productsSold,
    buyPrice,
    username,
    created
FROM users 
WHERE businessName IS NOT NULL 
   OR contact IS NOT NULL 
   OR streetAddress IS NOT NULL;

-- Log how many records we're backing up
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
SELECT 
    'user_legacy_backup_count', 
    COUNT(*)::TEXT, 
    'INTEGER', 
    'Number of user records backed up before schema cleanup'
FROM user_legacy_backup;

-- =====================================================
-- 2. REMOVE DUPLICATE/UNNECESSARY COLUMNS FROM USERS TABLE
-- =====================================================

-- Remove legacy business information columns (now in partner_accounts table)
ALTER TABLE users DROP COLUMN IF EXISTS businessName CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS contact CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS streetAddress CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS city CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS state CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS postcode CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS faxNumber CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS installerId CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS productsSold CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS buyPrice CASCADE;

-- Remove legacy agent type (replaced by partnerRole)
ALTER TABLE users DROP COLUMN IF EXISTS agentType CASCADE;

-- Remove username (not needed for partner system)
ALTER TABLE users DROP COLUMN IF EXISTS username CASCADE;

-- Remove unnecessary social/profile columns for business system
ALTER TABLE users DROP COLUMN IF EXISTS gender CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS bio CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS imageUrl CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS coverImageUrl CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS googleAccessToken CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS deviceId CASCADE;

-- =====================================================
-- 3. CLEAN UP PHONE NUMBER FIELDS
-- =====================================================

-- Remove the unique constraint on phone (business phone, not personal)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Rename phone to businessPhone for clarity (optional)
-- ALTER TABLE users RENAME COLUMN phone TO businessPhone;

-- Keep mobileNumber as unique for SMS verification
ALTER TABLE users ADD CONSTRAINT users_mobile_number_unique 
    UNIQUE(mobileNumber) DEFERRABLE INITIALLY DEFERRED;

-- =====================================================
-- 4. ENSURE REQUIRED PARTNER SYSTEM FIELDS
-- =====================================================

-- Make sure partnerAccountId has proper foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_partner_account_fk;
ALTER TABLE users ADD CONSTRAINT users_partner_account_fk 
    FOREIGN KEY (partnerAccountId) REFERENCES partner_accounts(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_partner_account_id 
    ON users(partnerAccountId) WHERE partnerAccountId IS NOT NULL;

-- Add index for partner role
CREATE INDEX IF NOT EXISTS idx_users_partner_role 
    ON users(partnerRole) WHERE partnerRole IS NOT NULL;

-- =====================================================
-- 5. UPDATE DATA CONSISTENCY
-- =====================================================

-- Ensure all PARTNER_USER roles have proper partner account association
UPDATE users 
SET role = 'PARTNER_USER'
WHERE role IN ('AGENT', 'INSPECTOR') 
   OR partnerAccountId IS NOT NULL;

-- Set default partner role for users without one
UPDATE users 
SET partnerRole = 'ACCOUNT_ADMIN'
WHERE role = 'PARTNER_USER' 
  AND partnerRole IS NULL 
  AND partnerAccountId IS NOT NULL;

-- =====================================================
-- 6. CLEAN UP VERIFICATION FIELDS
-- =====================================================

-- Ensure verification tracking fields have proper defaults
UPDATE users 
SET verificationAttempts = 0 
WHERE verificationAttempts IS NULL;

UPDATE users 
SET isAccreditedInstaller = false 
WHERE isAccreditedInstaller IS NULL;

UPDATE users 
SET isAuthorisedInspector = false 
WHERE isAuthorisedInspector IS NULL;

-- =====================================================
-- 7. ADD CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Ensure PARTNER_USER roles have partner account
ALTER TABLE users ADD CONSTRAINT check_partner_user_has_account 
    CHECK (
        (role = 'PARTNER_USER' AND partnerAccountId IS NOT NULL AND partnerRole IS NOT NULL) 
        OR 
        (role = 'ERPS_ADMIN' AND partnerAccountId IS NULL AND partnerRole IS NULL)
    );

-- Ensure ACCOUNT_INSTALLER has mobile number for SMS verification
ALTER TABLE users ADD CONSTRAINT check_installer_has_mobile 
    CHECK (
        (partnerRole = 'ACCOUNT_INSTALLER' AND mobileNumber IS NOT NULL) 
        OR 
        (partnerRole != 'ACCOUNT_INSTALLER' OR partnerRole IS NULL)
    );

-- =====================================================
-- 8. UPDATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Remove old indexes that might reference deleted columns
DROP INDEX IF EXISTS idx_users_business_name;
DROP INDEX IF EXISTS idx_users_agent_type;
DROP INDEX IF EXISTS idx_users_username;

-- Add new indexes for partner system
CREATE INDEX IF NOT EXISTS idx_users_role_partner 
    ON users(role, partnerRole) WHERE role = 'PARTNER_USER';

CREATE INDEX IF NOT EXISTS idx_users_installer_status 
    ON users(isAccreditedInstaller) WHERE isAccreditedInstaller = true;

CREATE INDEX IF NOT EXISTS idx_users_inspector_status 
    ON users(isAuthorisedInspector) WHERE isAuthorisedInspector = true;

CREATE INDEX IF NOT EXISTS idx_users_mobile_verification 
    ON users(mobileNumber) WHERE mobileNumber IS NOT NULL;

-- =====================================================
-- 9. LOG MIGRATION COMPLETION
-- =====================================================

-- Log successful migration
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('migration_user_schema_cleanup_completed', CURRENT_TIMESTAMP::TEXT, 'STRING', 'Timestamp when user schema cleanup migration was completed')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = CURRENT_TIMESTAMP::TEXT,
    modified = CURRENT_TIMESTAMP;

-- Log final user count
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
SELECT 
    'users_count_after_cleanup', 
    COUNT(*)::TEXT, 
    'INTEGER', 
    'Number of users after schema cleanup'
FROM users WHERE is_deleted = false;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify the cleanup worked
SELECT 
    'Schema Cleanup Verification' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'ERPS_ADMIN' THEN 1 END) as erps_admins,
    COUNT(CASE WHEN role = 'PARTNER_USER' THEN 1 END) as partner_users,
    COUNT(CASE WHEN partnerRole = 'ACCOUNT_ADMIN' THEN 1 END) as account_admins,
    COUNT(CASE WHEN partnerRole = 'ACCOUNT_STAFF' THEN 1 END) as account_staff,
    COUNT(CASE WHEN partnerRole = 'ACCOUNT_INSTALLER' THEN 1 END) as account_installers,
    COUNT(CASE WHEN isAccreditedInstaller = true THEN 1 END) as accredited_installers
FROM users 
WHERE is_deleted = false;

-- Check for any data integrity issues
SELECT 
    'Data Integrity Check' as check_type,
    COUNT(CASE WHEN role = 'PARTNER_USER' AND partnerAccountId IS NULL THEN 1 END) as partner_users_without_account,
    COUNT(CASE WHEN role = 'PARTNER_USER' AND partnerRole IS NULL THEN 1 END) as partner_users_without_role,
    COUNT(CASE WHEN partnerRole = 'ACCOUNT_INSTALLER' AND mobileNumber IS NULL THEN 1 END) as installers_without_mobile
FROM users 
WHERE is_deleted = false;

COMMIT;

-- =====================================================
-- NOTES FOR DEVELOPERS
-- =====================================================

/*
IMPORTANT: After running this migration, update your User entity in TypeScript to remove the deleted columns:

REMOVED COLUMNS:
- businessName (moved to partner_accounts table)
- contact (moved to partner_accounts table)  
- streetAddress (moved to partner_accounts table)
- city (moved to partner_accounts table)
- state (moved to partner_accounts table)
- postcode (moved to partner_accounts table)
- faxNumber (moved to partner_accounts table)
- installerId (not needed)
- productsSold (moved to partner_accounts table)
- buyPrice (moved to partner_accounts table)
- agentType (replaced by partnerRole)
- username (not needed for business system)
- gender (not needed for business system)
- bio (not needed for business system)
- imageUrl (not needed for business system)
- coverImageUrl (not needed for business system)
- googleAccessToken (not needed for business system)
- deviceId (not needed for business system)

KEPT COLUMNS:
- All core user fields (id, email, password, fullName, etc.)
- Partner system fields (partnerAccountId, partnerRole)
- Installer/inspector fields (mobileNumber, certifications, etc.)
- Verification tracking fields
- Audit fields (created, modified, deleted, etc.)

The User table is now clean and focused on user authentication and partner system roles.
Business information is properly stored in the partner_accounts table.
*/