/**
 * Script to check the actual audit_history table schema
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

async function checkAuditHistorySchema() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if audit_history table exists
    console.log('🔍 Checking if audit_history table exists...');
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_history'
      );
    `;

    const tableExistsResult = await client.query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    console.log(`📋 Table exists: ${tableExists}`);

    if (tableExists) {
      // Check current column structure
      console.log('🔍 Checking current audit_history table structure...');
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'audit_history' 
        ORDER BY ordinal_position;
      `;

      const columnsResult = await client.query(columnsQuery);
      console.log('📋 Current audit_history columns:');
      console.table(columnsResult.rows);

      // Check for specific columns we need
      const columnNames = columnsResult.rows.map(row => row.column_name);
      const hasWarrantyId = columnNames.includes('warrantyId');
      const hasWarranty_id = columnNames.includes('warranty_id');
      
      console.log(`\n🔍 Column analysis:`);
      console.log(`- Has 'warrantyId': ${hasWarrantyId}`);
      console.log(`- Has 'warranty_id': ${hasWarranty_id}`);

      if (hasWarranty_id && !hasWarrantyId) {
        console.log('\n🔧 Need to rename columns from snake_case to camelCase');
        
        // Show the rename commands needed
        console.log('\n📝 SQL commands needed:');
        console.log('ALTER TABLE audit_history RENAME COLUMN warranty_id TO "warrantyId";');
        console.log('ALTER TABLE audit_history RENAME COLUMN inspection_id TO "inspectionId";');
        console.log('ALTER TABLE audit_history RENAME COLUMN action_type TO "actionType";');
        console.log('ALTER TABLE audit_history RENAME COLUMN record_type TO "recordType";');
        console.log('ALTER TABLE audit_history RENAME COLUMN version_number TO "versionNumber";');
        console.log('ALTER TABLE audit_history RENAME COLUMN status_before TO "statusBefore";');
        console.log('ALTER TABLE audit_history RENAME COLUMN status_after TO "statusAfter";');
        console.log('ALTER TABLE audit_history RENAME COLUMN performed_by TO "performedBy";');
        console.log('ALTER TABLE audit_history RENAME COLUMN performed_at TO "performedAt";');
        console.log('ALTER TABLE audit_history RENAME COLUMN submission_data TO "submissionData";');
        console.log('ALTER TABLE audit_history RENAME COLUMN sms_sent_to TO "smsSentTo";');
        console.log('ALTER TABLE audit_history RENAME COLUMN sms_sent_at TO "smsSentAt";');
        console.log('ALTER TABLE audit_history RENAME COLUMN sms_delivery_status TO "smsDeliveryStatus";');
        console.log('ALTER TABLE audit_history RENAME COLUMN verification_token TO "verificationToken";');
        console.log('ALTER TABLE audit_history RENAME COLUMN token_expires_at TO "tokenExpiresAt";');
        console.log('ALTER TABLE audit_history RENAME COLUMN ip_address TO "ipAddress";');
        console.log('ALTER TABLE audit_history RENAME COLUMN user_agent TO "userAgent";');
        console.log('ALTER TABLE audit_history RENAME COLUMN is_current_version TO "isCurrentVersion";');
      }

    } else {
      console.log('❌ audit_history table does not exist');
      console.log('📝 Need to create the table first');
    }

  } catch (error) {
    console.error('❌ Error checking audit_history schema:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkAuditHistorySchema();