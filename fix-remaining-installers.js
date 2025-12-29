/**
 * Script to fix remaining installer users who still have isAccreditedInstaller = false
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

async function fixRemainingInstallers() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Find all ACCOUNT_INSTALLER users who are not accredited
    console.log('🔍 Finding non-accredited installer users...');
    const findQuery = `
      SELECT 
        id, 
        email, 
        "fullName", 
        "partnerRole", 
        "isAccreditedInstaller"
      FROM users 
      WHERE "partnerRole" = 'ACCOUNT_INSTALLER' 
        AND "isAccreditedInstaller" = false
        AND "isDeleted" = false;
    `;

    const findResult = await client.query(findQuery);
    
    if (findResult.rows.length === 0) {
      console.log('✅ All installer users are already accredited!');
      return;
    }

    console.log(`📋 Found ${findResult.rows.length} non-accredited installer(s):`);
    console.table(findResult.rows);

    // Update all non-accredited installers
    console.log('🔧 Updating all non-accredited installers...');
    const updateQuery = `
      UPDATE users 
      SET "isAccreditedInstaller" = true 
      WHERE "partnerRole" = 'ACCOUNT_INSTALLER' 
        AND "isAccreditedInstaller" = false
        AND "isDeleted" = false
      RETURNING id, email, "fullName", "isAccreditedInstaller";
    `;

    const updateResult = await client.query(updateQuery);
    
    console.log(`✅ Successfully updated ${updateResult.rowCount} installer(s):`);
    if (updateResult.rows.length > 0) {
      console.table(updateResult.rows);
    }

    // Final verification
    console.log('\n🔍 Final verification - All installer users:');
    const verifyQuery = `
      SELECT 
        id,
        email,
        "fullName",
        "partnerRole",
        "isAccreditedInstaller"
      FROM users 
      WHERE "partnerRole" = 'ACCOUNT_INSTALLER' 
        AND "isDeleted" = false
      ORDER BY "isAccreditedInstaller", email;
    `;

    const verifyResult = await client.query(verifyQuery);
    console.table(verifyResult.rows);

    // Summary stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_installers,
        COUNT(CASE WHEN "isAccreditedInstaller" = true THEN 1 END) as accredited_installers,
        COUNT(CASE WHEN "isAccreditedInstaller" = false THEN 1 END) as non_accredited_installers
      FROM users 
      WHERE "partnerRole" = 'ACCOUNT_INSTALLER' 
        AND "isDeleted" = false;
    `;

    const statsResult = await client.query(statsQuery);
    console.log('\n📊 Summary Statistics:');
    console.table(statsResult.rows);

  } catch (error) {
    console.error('❌ Error fixing installers:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixRemainingInstallers();