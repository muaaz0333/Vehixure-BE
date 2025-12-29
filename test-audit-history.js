/**
 * Script to test audit history logging
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

async function testAuditHistory() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Test inserting a record into audit_history
    console.log('🧪 Testing audit history insert...');
    
    const testWarrantyId = '5889f522-fad5-4d8d-89e7-d8fdf0986f05'; // From your log
    const testUserId = 'ba9618f3-fb86-48a9-a431-2e959a2b2e51'; // From your log
    
    const insertQuery = `
      INSERT INTO audit_history (
        "warrantyId",
        "actionType", 
        "recordType",
        "versionNumber",
        "performedBy",
        "isCurrentVersion",
        created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, "warrantyId", "actionType", "recordType", created;
    `;

    const insertResult = await client.query(insertQuery, [
      testWarrantyId,
      'SUBMITTED',
      'WARRANTY',
      1,
      testUserId,
      true,
      new Date()
    ]);

    console.log('✅ Successfully inserted audit history record:');
    console.table(insertResult.rows);

    // Check if the record exists
    console.log('\n🔍 Verifying audit history records...');
    const selectQuery = `
      SELECT 
        id,
        "warrantyId",
        "inspectionId",
        "actionType",
        "recordType",
        "performedBy",
        created
      FROM audit_history 
      ORDER BY created DESC 
      LIMIT 5;
    `;

    const selectResult = await client.query(selectQuery);
    console.log('📋 Recent audit history records:');
    console.table(selectResult.rows);

    console.log('\n✅ Audit history table is working correctly!');

  } catch (error) {
    console.error('❌ Error testing audit history:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

testAuditHistory();