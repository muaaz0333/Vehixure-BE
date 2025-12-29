/**
 * Migration Script: Add Customer Activation Fields
 * Run this script to add the new customer activation columns to the warranties table
 * 
 * Usage: node run-customer-activation-migration.mjs
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Start transaction
    await client.query('BEGIN');

    console.log('📦 Running customer activation migration...');

    // 1. Add new enum values to verificationStatus
    console.log('  → Updating verificationStatus enum...');
    try {
      await client.query(`
        ALTER TYPE warranties_verificationstatus_enum ADD VALUE IF NOT EXISTS 'PENDING_CUSTOMER_ACTIVATION'
      `);
      console.log('    ✓ Added PENDING_CUSTOMER_ACTIVATION to verificationStatus enum');
    } catch (err) {
      if (err.code === '42710') {
        console.log('    ⚠ PENDING_CUSTOMER_ACTIVATION already exists in verificationStatus enum');
      } else {
        console.log('    ⚠ Could not modify verificationStatus enum:', err.message);
      }
    }

    try {
      await client.query(`
        ALTER TYPE warranties_verificationstatus_enum ADD VALUE IF NOT EXISTS 'ACTIVE'
      `);
      console.log('    ✓ Added ACTIVE to verificationStatus enum');
    } catch (err) {
      if (err.code === '42710') {
        console.log('    ⚠ ACTIVE already exists in verificationStatus enum');
      } else {
        console.log('    ⚠ Could not modify verificationStatus enum:', err.message);
      }
    }

    // 2. Add new enum values to status
    console.log('  → Updating status enum...');
    try {
      await client.query(`
        ALTER TYPE warranties_status_enum ADD VALUE IF NOT EXISTS 'PENDING_CUSTOMER_ACTIVATION'
      `);
      console.log('    ✓ Added PENDING_CUSTOMER_ACTIVATION to status enum');
    } catch (err) {
      if (err.code === '42710') {
        console.log('    ⚠ PENDING_CUSTOMER_ACTIVATION already exists in status enum');
      } else {
        console.log('    ⚠ Could not modify status enum:', err.message);
      }
    }

    // Commit enum changes (required before using new enum values)
    await client.query('COMMIT');
    await client.query('BEGIN');

    // 3. Add new columns
    console.log('  → Adding customer activation columns...');
    
    const columns = [
      { name: 'customer_activation_token', type: 'TEXT' },
      { name: 'customer_activation_token_expires', type: 'TIMESTAMP' },
      { name: 'customer_terms_accepted_at', type: 'TIMESTAMP' },
      { name: 'customer_terms_accepted_ip', type: 'TEXT' },
      { name: 'activated_at', type: 'TIMESTAMP' },
      { name: 'activated_by', type: 'UUID' },
      { name: 'inspection_due_date', type: 'DATE' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const col of columns) {
      try {
        await client.query(`
          ALTER TABLE warranties 
          ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}
        `);
        console.log(`    ✓ Added column: ${col.name}`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`    ⚠ Column ${col.name} already exists`);
        } else {
          throw err;
        }
      }
    }

    // 4. Create indexes
    console.log('  → Creating indexes...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_warranties_customer_activation_token 
        ON warranties(customer_activation_token) 
        WHERE customer_activation_token IS NOT NULL
      `);
      console.log('    ✓ Created index: idx_warranties_customer_activation_token');
    } catch (err) {
      console.log('    ⚠ Index creation note:', err.message);
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_warranties_is_active 
        ON warranties(is_active) 
        WHERE is_active = TRUE
      `);
      console.log('    ✓ Created index: idx_warranties_is_active');
    } catch (err) {
      console.log('    ⚠ Index creation note:', err.message);
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');

    // Verify columns
    console.log('\n📋 Verifying new columns:');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'warranties' 
      AND column_name IN (
        'customer_activation_token',
        'customer_activation_token_expires',
        'customer_terms_accepted_at',
        'customer_terms_accepted_ip',
        'activated_at',
        'activated_by',
        'inspection_due_date',
        'is_active'
      )
      ORDER BY column_name
    `);
    
    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('  No new columns found - they may already exist with different names');
    }

    // Show current warranties table structure
    console.log('\n📊 Current warranties table columns:');
    const allColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'warranties'
      ORDER BY ordinal_position
    `);
    console.log(`  Total columns: ${allColumns.rows.length}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration().catch(console.error);
