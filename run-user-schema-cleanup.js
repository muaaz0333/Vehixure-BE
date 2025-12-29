/**
 * Script to run User Schema Cleanup Migration
 * 
 * This script:
 * 1. Backs up legacy data
 * 2. Removes duplicate columns from users table
 * 3. Cleans up the schema for the partner system
 * 4. Adds proper constraints and indexes
 */

const fs = require('fs');
const path = require('path');

// Database configuration - update these with your actual database credentials
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'erps_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

async function runMigration() {
  const { Client } = require('pg');
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migration-cleanup-user-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Running User Schema Cleanup Migration...');
    console.log('⚠️  This will remove duplicate columns from the users table');
    console.log('⚠️  Legacy data will be backed up to user_legacy_backup table');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ User Schema Cleanup Migration completed successfully!');

    // Verify the results
    console.log('\n📊 Verification Results:');
    
    const verificationQuery = `
      SELECT 
        'Schema Cleanup Verification' as check_type,
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'ERPS_ADMIN' THEN 1 END) as erps_admins,
        COUNT(CASE WHEN role = 'PARTNER_USER' THEN 1 END) as partner_users,
        COUNT(CASE WHEN partner_role = 'ACCOUNT_ADMIN' THEN 1 END) as account_admins,
        COUNT(CASE WHEN partner_role = 'ACCOUNT_STAFF' THEN 1 END) as account_staff,
        COUNT(CASE WHEN partner_role = 'ACCOUNT_INSTALLER' THEN 1 END) as account_installers,
        COUNT(CASE WHEN is_accredited_installer = true THEN 1 END) as accredited_installers
      FROM users 
      WHERE is_deleted = false;
    `;

    const result = await client.query(verificationQuery);
    console.table(result.rows);

    // Check for data integrity issues
    const integrityQuery = `
      SELECT 
        'Data Integrity Check' as check_type,
        COUNT(CASE WHEN role = 'PARTNER_USER' AND partner_account_id IS NULL THEN 1 END) as partner_users_without_account,
        COUNT(CASE WHEN role = 'PARTNER_USER' AND partner_role IS NULL THEN 1 END) as partner_users_without_role,
        COUNT(CASE WHEN partner_role = 'ACCOUNT_INSTALLER' AND mobile_number IS NULL THEN 1 END) as installers_without_mobile
      FROM users 
      WHERE is_deleted = false;
    `;

    const integrityResult = await client.query(integrityQuery);
    console.table(integrityResult.rows);

    // Check backup table
    const backupQuery = `
      SELECT COUNT(*) as backed_up_records 
      FROM user_legacy_backup;
    `;

    const backupResult = await client.query(backupQuery);
    console.log(`📦 Legacy data backup: ${backupResult.rows[0].backed_up_records} records saved`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Update your User entity in TypeScript to remove deleted columns');
    console.log('2. Test the partner account creation functionality');
    console.log('3. Verify email sending is working');
    console.log('4. Check that all partner system features work correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
console.log('🚀 Starting User Schema Cleanup Migration...');
console.log('Database:', DB_CONFIG.database);
console.log('Host:', DB_CONFIG.host);
console.log('Port:', DB_CONFIG.port);
console.log('User:', DB_CONFIG.user);
console.log('');

runMigration();