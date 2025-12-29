/**
 * Script to check current role values in database
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

async function checkRoles() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check current role values
    const rolesQuery = `
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC;
    `;

    const rolesResult = await client.query(rolesQuery);
    console.log('\n📋 Current role values in users table:');
    console.table(rolesResult.rows);

    // Check current enum definition
    const enumQuery = `
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'users_role_enum'
      );
    `;

    const enumResult = await client.query(enumQuery);
    console.log('\n📋 Current enum values:');
    console.table(enumResult.rows);

    // Check partner role values
    const partnerRolesQuery = `
      SELECT "partnerRole", COUNT(*) as count 
      FROM users 
      WHERE "partnerRole" IS NOT NULL
      GROUP BY "partnerRole" 
      ORDER BY count DESC;
    `;

    const partnerRolesResult = await client.query(partnerRolesQuery);
    console.log('\n📋 Current partner role values:');
    console.table(partnerRolesResult.rows);

  } catch (error) {
    console.error('❌ Role check failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkRoles();