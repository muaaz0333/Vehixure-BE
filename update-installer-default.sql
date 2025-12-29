-- Update default value for isAccreditedInstaller to true
-- This migration changes the default from false to true

-- First, update the column default value
ALTER TABLE users 
ALTER COLUMN "isAccreditedInstaller" SET DEFAULT true;

-- Update existing users who have isAccreditedInstaller = false to true
-- (Optional: You may want to be selective about which users to update)
UPDATE users 
SET "isAccreditedInstaller" = true 
WHERE "isAccreditedInstaller" = false 
  AND "partnerRole" = 'ACCOUNT_INSTALLER';

-- Show the results
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN "isAccreditedInstaller" = true THEN 1 END) as accredited_installers,
  COUNT(CASE WHEN "partnerRole" = 'ACCOUNT_INSTALLER' THEN 1 END) as installer_role_users
FROM users 
WHERE "isDeleted" = false;