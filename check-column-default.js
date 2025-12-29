/**
 * Script to check the current column default for isAccreditedInstaller
 */

import pkg from 'pg';
const { Client } = pkg;

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || '199.192.27.131',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'warrantyDb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'BP7zks9fgqRAIWnIw4b3i18YIKxFn5hikzyTh6fA61FBwayfBlgL22xGcYHGY4bo'
};

async function checkColumnDefault() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check current column defaults for installer-related fields
    console.log('🔍 Checking column defaults for installer fields...');
    const columnQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('isAccreditedInstaller', 'isAuthorisedInspector')
      ORDER BY column_name;
    `;

    const columnResult = await client.query(columnQuery);
    console.log('📋 Current column definitions:');
    console.table(columnResult.rows);

    // Update the column default if it's still false
    const currentDefault = columnResult.rows.find(row => row.column_name === 'isAccreditedInstaller')?.column_default;
    
    if (currentDefault === 'false') {
      console.log('🔧 Updating column default from false to true...');
      
      const updateDefaultQuery = `
        ALTER TABLE users 
        ALTER COLUMN "isAccreditedInstaller" SET DEFAULT true;
      `;
      
      await client.query(updateDefaultQuery);
      console.log('✅ Column default updated successfully');
      
      // Verify the change
      const verifyResult = await client.query(columnQuery);
      console.log('📋 Updated column definitions:');
      console.table(verifyResult.rows);
    } else {
      console.log('✅ Column default is already set correctly');
    }

    // Test creating a new user to verify default behavior
    console.log('\n🧪 Testing default behavior with a test user...');
    
    // Create a test user (we'll delete it immediately)
    const testUserQuery = `
      INSERT INTO users (email, "fullName", role, "partnerRole") 
      VALUES ('test-default@example.com', 'Test Default User', 'PARTNER_USER', 'ACCOUNT_INSTALLER')
      RETURNING id, email, "isAccreditedInstaller";
    `;
    
    const testResult = await client.query(testUserQuery);
    console.log('📋 Test user created with default values:');
    console.table(testResult.rows);
    
    // Clean up test user
    const deleteTestQuery = `DELETE FROM users WHERE email = 'test-default@example.com'`;
    await client.query(deleteTestQuery);
    console.log('🗑️ Test user cleaned up');

  } catch (error) {
    console.error('❌ Error checking column default:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkColumnDefault();