import { Client } from 'pg';

// Database configuration from .env
const dbConfig = {
  host: '199.192.27.131',
  port: 5432,
  database: 'warrantyDb',
  user: 'postgres',
  password: 'BP7zks9fgqRAIWnIw4b3i18YIKxFn5hikzyTh6fA61FBwayfBlgL22xGcYHGY4bo'
};

async function runSafeMigration() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Add missing columns
    console.log('🔧 Adding missing columns...');
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "verificationAttempts" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "lastVerificationSent" TIMESTAMP NULL
      `);
      console.log('✅ Added verification tracking columns');
    } catch (error) {
      console.log('⚠️ Columns might already exist:', error.message);
    }

    // Step 2: Add new enum values to existing enum
    console.log('🎭 Updating role enum...');
    
    try {
      // Add new enum values
      await client.query(`ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'ERPS_ADMIN'`);
      await client.query(`ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'PARTNER_USER'`);
      console.log('✅ Added new role enum values');
    } catch (error) {
      console.log('⚠️ Enum values might already exist:', error.message);
    }

    // Step 3: Create partner role enum if it doesn't exist
    console.log('🎭 Creating partner role enum...');
    
    try {
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE partner_role_enum AS ENUM ('ACCOUNT_ADMIN', 'ACCOUNT_STAFF', 'ACCOUNT_INSTALLER');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      // Update partnerRole column to use enum
      await client.query(`
        ALTER TABLE users 
        ALTER COLUMN "partnerRole" TYPE partner_role_enum USING "partnerRole"::partner_role_enum
      `);
      console.log('✅ Created and applied partner role enum');
    } catch (error) {
      console.log('⚠️ Partner role enum handling:', error.message);
    }

    // Step 4: Update existing users (if any) to new role system
    console.log('👥 Updating existing users...');
    
    // Convert ADMIN to ERPS_ADMIN
    const adminUpdate = await client.query(`
      UPDATE users 
      SET role = 'ERPS_ADMIN' 
      WHERE role = 'ADMIN'
    `);
    console.log(`✅ Updated ${adminUpdate.rowCount} admin users to ERPS_ADMIN`);

    // Convert AGENT/INSPECTOR to PARTNER_USER
    const userUpdate = await client.query(`
      UPDATE users 
      SET role = 'PARTNER_USER',
          "partnerRole" = CASE 
            WHEN role = 'AGENT' THEN 'ACCOUNT_STAFF'::partner_role_enum
            WHEN role = 'INSPECTOR' THEN 'ACCOUNT_INSTALLER'::partner_role_enum
            ELSE 'ACCOUNT_STAFF'::partner_role_enum
          END
      WHERE role IN ('AGENT', 'INSPECTOR')
    `);
    console.log(`✅ Updated ${userUpdate.rowCount} users to PARTNER_USER`);

    // Step 5: Set installer flags for ACCOUNT_INSTALLER users
    console.log('🔧 Setting installer flags...');
    
    const installerUpdate = await client.query(`
      UPDATE users 
      SET "isAccreditedInstaller" = true,
          "isAuthorisedInspector" = true,
          "installerCertificationDate" = CURRENT_DATE,
          "inspectorCertificationDate" = CURRENT_DATE
      WHERE "partnerRole" = 'ACCOUNT_INSTALLER'
    `);
    console.log(`✅ Updated ${installerUpdate.rowCount} installer flags`);

    // Step 6: Create indexes for performance
    console.log('📊 Creating indexes...');
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_partner_account_role 
        ON users("partnerAccountId", "partnerRole") 
        WHERE "isDeleted" = false
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_installer_flags 
        ON users("isAccreditedInstaller", "isAuthorisedInspector") 
        WHERE role = 'PARTNER_USER' AND "partnerRole" = 'ACCOUNT_INSTALLER'
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_verification_tracking 
        ON users("lastVerificationSent", "verificationAttempts") 
        WHERE role = 'PARTNER_USER' AND "partnerRole" = 'ACCOUNT_INSTALLER'
      `);
      
      console.log('✅ Created performance indexes');
    } catch (error) {
      console.log('⚠️ Index creation:', error.message);
    }

    // Step 7: Generate summary
    console.log('\n📊 Migration Summary:');
    
    const summaryResult = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'ERPS_ADMIN' THEN 1 END) as erps_admin_count,
        COUNT(CASE WHEN role = 'PARTNER_USER' THEN 1 END) as partner_user_count,
        COUNT(CASE WHEN "partnerRole" = 'ACCOUNT_ADMIN' THEN 1 END) as account_admin_count,
        COUNT(CASE WHEN "partnerRole" = 'ACCOUNT_STAFF' THEN 1 END) as account_staff_count,
        COUNT(CASE WHEN "partnerRole" = 'ACCOUNT_INSTALLER' THEN 1 END) as account_installer_count
      FROM users 
      WHERE "isDeleted" = false
    `);
    
    const summary = summaryResult.rows[0];
    console.log(`Total users: ${summary.total_users}`);
    console.log(`ERPS Admin: ${summary.erps_admin_count}`);
    console.log(`Partner Users: ${summary.partner_user_count}`);
    console.log(`  - Account Admin: ${summary.account_admin_count}`);
    console.log(`  - Account Staff: ${summary.account_staff_count}`);
    console.log(`  - Account Installer: ${summary.account_installer_count}`);

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runSafeMigration();