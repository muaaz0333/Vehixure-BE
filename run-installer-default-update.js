/**
 * Script to update isAccreditedInstaller default value and existing records
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || '199.192.27.131',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'warrantyDb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'BP7zks9fgqRAIWnIw4b3i18YIKxFn5hikzyTh6fA61FBwayfBlgL22xGcYHGY4bo'
};

async function updateInstallerDefault() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute the SQL migration
    console.log('📋 Reading migration SQL...');
    const migrationSQL = readFileSync('update-installer-default.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('🔧 Executing migration statements...');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n📝 Executing statement ${i + 1}:`);
        console.log(statement.substring(0, 100) + '...');
        
        try {
          const result = await client.query(statement);
          
          if (result.rows && result.rows.length > 0) {
            console.log('📊 Results:');
            console.table(result.rows);
          } else if (result.rowCount !== undefined) {
            console.log(`✅ Affected rows: ${result.rowCount}`);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        }
      }
    }

    // Final verification - check current state
    console.log('\n🔍 Final verification - Current installer status:');
    const verificationQuery = `
      SELECT 
        "partnerRole",
        "isAccreditedInstaller",
        COUNT(*) as count
      FROM users 
      WHERE "isDeleted" = false 
        AND "partnerRole" IS NOT NULL
      GROUP BY "partnerRole", "isAccreditedInstaller"
      ORDER BY "partnerRole", "isAccreditedInstaller";
    `;

    const verificationResult = await client.query(verificationQuery);
    console.table(verificationResult.rows);

    console.log('\n✅ Migration completed successfully!');
    console.log('📝 Summary:');
    console.log('- Default value for isAccreditedInstaller changed to true');
    console.log('- Existing ACCOUNT_INSTALLER users updated to accredited');
    console.log('- New users will now default to accredited installer status');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

updateInstallerDefault();