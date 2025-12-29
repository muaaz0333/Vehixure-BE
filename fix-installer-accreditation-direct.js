/**
 * Script to fix installer accreditation
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

async function fixInstallerAccreditation() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    const installerId = '4183f64b-b9c4-4361-a234-6420c013dbbc';

    // Check current installer status
    console.log('📋 Checking current installer status...');
    const checkQuery = `
      SELECT 
        id, 
        email, 
        "fullName", 
        "partnerRole", 
        "isAccreditedInstaller", 
        "mobileNumber",
        "accountStatus"
      FROM users 
      WHERE id = $1;
    `;

    const checkResult = await client.query(checkQuery, [installerId]);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Installer not found with ID:', installerId);
      return;
    }

    const installer = checkResult.rows[0];
    console.log('\n📋 Current installer details:');
    console.table([installer]);

    if (installer.isAccreditedInstaller) {
      console.log('✅ Installer is already accredited');
      return;
    }

    // Update the installer to be accredited
    console.log('🔧 Updating installer accreditation...');
    const updateQuery = `
      UPDATE users 
      SET "isAccreditedInstaller" = true 
      WHERE id = $1
      RETURNING id, email, "fullName", "isAccreditedInstaller";
    `;

    const updateResult = await client.query(updateQuery, [installerId]);
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Successfully updated installer accreditation');
      console.log('\n📋 Updated installer details:');
      console.table(updateResult.rows);
    } else {
      console.log('❌ Failed to update installer');
    }

  } catch (error) {
    console.error('❌ Error fixing installer accreditation:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixInstallerAccreditation();