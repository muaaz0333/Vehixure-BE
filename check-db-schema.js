/**
 * Script to check current database schema
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

async function checkSchema() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check current users table structure
    const structureQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;

    const result = await client.query(structureQuery);
    console.log('\n📋 Current users table structure:');
    console.table(result.rows);

    // Check if partner_accounts table exists
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'partner_accounts');
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log('\n📋 Available tables:');
    console.table(tablesResult.rows);

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkSchema();