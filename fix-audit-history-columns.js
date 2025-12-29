/**
 * Script to rename audit_history columns from snake_case to camelCase
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

async function fixAuditHistoryColumns() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // List of column renames needed
    const columnRenames = [
      { from: 'warranty_id', to: 'warrantyId' },
      { from: 'inspection_id', to: 'inspectionId' },
      { from: 'action_type', to: 'actionType' },
      { from: 'record_type', to: 'recordType' },
      { from: 'version_number', to: 'versionNumber' },
      { from: 'status_before', to: 'statusBefore' },
      { from: 'status_after', to: 'statusAfter' },
      { from: 'performed_by', to: 'performedBy' },
      { from: 'performed_at', to: 'performedAt' },
      { from: 'submission_data', to: 'submissionData' },
      { from: 'sms_sent_to', to: 'smsSentTo' },
      { from: 'sms_sent_at', to: 'smsSentAt' },
      { from: 'sms_delivery_status', to: 'smsDeliveryStatus' },
      { from: 'verification_token', to: 'verificationToken' },
      { from: 'token_expires_at', to: 'tokenExpiresAt' },
      { from: 'ip_address', to: 'ipAddress' },
      { from: 'user_agent', to: 'userAgent' },
      { from: 'is_current_version', to: 'isCurrentVersion' }
    ];

    console.log('🔧 Renaming columns from snake_case to camelCase...');

    for (const rename of columnRenames) {
      try {
        const renameQuery = `ALTER TABLE audit_history RENAME COLUMN ${rename.from} TO "${rename.to}";`;
        console.log(`📝 Renaming: ${rename.from} → ${rename.to}`);
        
        await client.query(renameQuery);
        console.log(`✅ Successfully renamed ${rename.from} to ${rename.to}`);
        
      } catch (error) {
        if (error.code === '42703') {
          console.log(`⚠️  Column ${rename.from} doesn't exist (already renamed or missing)`);
        } else if (error.code === '42701') {
          console.log(`⚠️  Column ${rename.to} already exists`);
        } else {
          console.error(`❌ Error renaming ${rename.from}:`, error.message);
        }
      }
    }

    // Verify the changes
    console.log('\n🔍 Verifying column renames...');
    const verifyQuery = `
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'audit_history' 
      ORDER BY ordinal_position;
    `;

    const verifyResult = await client.query(verifyQuery);
    console.log('📋 Current column names:');
    verifyResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name}`);
    });

    // Check if we have the expected camelCase columns
    const columnNames = verifyResult.rows.map(row => row.column_name);
    const hasWarrantyId = columnNames.includes('warrantyId');
    const hasActionType = columnNames.includes('actionType');
    
    if (hasWarrantyId && hasActionType) {
      console.log('\n✅ Column rename successful! TypeORM should now work correctly.');
    } else {
      console.log('\n❌ Some columns may not have been renamed correctly.');
    }

  } catch (error) {
    console.error('❌ Error fixing audit_history columns:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixAuditHistoryColumns();