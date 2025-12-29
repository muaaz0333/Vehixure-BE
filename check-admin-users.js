/**
 * Check what admin users exist in the database
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

async function checkAdminUsers() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check admin users
    const adminQuery = `
      SELECT id, email, "fullName", role, "isVerified", "accountStatus"
      FROM users 
      WHERE role = 'ERPS_ADMIN' 
      AND "isDeleted" = false
      ORDER BY created DESC;
    `;

    const adminResult = await client.query(adminQuery);
    console.log('\n📋 ERPS Admin Users:');
    
    if (adminResult.rows.length === 0) {
      console.log('❌ No ERPS Admin users found!');
      console.log('💡 You need to create an admin user first');
    } else {
      console.table(adminResult.rows);
    }

    // Check all users with their roles
    const allUsersQuery = `
      SELECT email, role, "partnerRole", "accountStatus", "isVerified"
      FROM users 
      WHERE "isDeleted" = false
      ORDER BY role, email;
    `;

    const allUsersResult = await client.query(allUsersQuery);
    console.log('\n📋 All Users:');
    console.table(allUsersResult.rows);

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkAdminUsers();