/**
 * Simple script to clean up users table
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || '199.192.27.131',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'warrantyDb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'BP7zks9fgqRAIWnIw4b3i18YIKxFn5hikzyTh6fA61FBwayfBlgL22xGcYHGY4bo'
};

async function runCleanup() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the cleanup SQL file
    const cleanupPath = path.join(__dirname, 'simple-cleanup-users-table.sql');
    const cleanupSQL = fs.readFileSync(cleanupPath, 'utf8');

    console.log('🧹 Running users table cleanup...');
    await client.query(cleanupSQL);

    console.log('✅ Users table cleanup completed!');

    // Show current table structure
    const structureQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;

    const result = await client.query(structureQuery);
    console.log('\n📋 Current users table structure:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runCleanup();