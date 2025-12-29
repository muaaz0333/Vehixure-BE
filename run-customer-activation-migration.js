/**
 * Migration Script: Add Customer Activation Fields
 * Run this script to add the new customer activation columns to the warranties table
 * 
 * Usage: node run-customer-activation-migration.js
 */

const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Start transaction
    await client.query('BEGIN');

    console.log('📦 Running customer activation migration...');

    // 1. Update verification status enum
    console.log('  → Updating verificationStatus enum...');
    await client.query(`
      ALTER TABLE warranties 
      DROP CONSTRAINT IF EXISTS warranties_verificationstatus_check
    `);
    
    // For PostgreSQL enum, we need to add new values
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_CUSTOMER_ACTIVATION' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'warranties_verificationstatus_enum')) THEN
          ALTER TYPE warranties_verificationstatus_enum ADD VALUE IF NOT EXISTS 'PENDING_CUSTOMER_ACTIVATION';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ACTIVE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'warranties_verificationstatus_enum')) THEN
          ALTER TYPE warranties_verificationstatus_enum ADD VALUE IF NOT EXISTS 'ACTIVE';
        END IF;
      EXCEPTION WHEN others THEN
        -- Enum type might not exist or values already exist
        NULL;
      END $$;
    `);

    // 2. Update status enum
    console.log('  → Updating status enum...');
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_CUSTOMER_ACTIVATION' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'warranties_status_enum')) THEN
          ALTER TYPE warranties_status_enum ADD VALUE IF NOT EXISTS 'PENDING_CUSTOMER_ACTIVATION';
        END IF;
      EXCEPTION WHEN others THEN
        NULL;
      END $$;
    `);

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
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_warranties_customer_activation_token 
      ON warranties(customer_activation_token) 
      WHERE customer_activation_token IS NOT NULL
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_warranties_is_active 
      ON warranties(is_active) 
      WHERE is_active = TRUE
    `);

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
        'customer_terms_accepted_at',
        'customer_terms_accepted_ip',
        'activated_at',
        'activated_by',
        'inspection_due_date',
        'is_active'
      )
      ORDER BY column_name
    `);
    
    console.table(result.rows);

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
