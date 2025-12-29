/**
 * Test Real Email Sending via Partner Account Creation
 * This tests the email functionality through the actual API
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5050/api/v1';

// Test configuration
const TEST_CONFIG = {
  // Use existing admin credentials
  adminEmail: 'admin@erps.com',
  adminPassword: 'admin123', // Try common password first
  
  // Test partner account that will trigger email
  testPartnerAccount: {
    businessName: 'SMTP Email Test Business ' + Date.now(),
    contactPerson: 'SMTP Test User',
    streetAddress: '123 SMTP Test Street',
    city: 'Test City',
    state: 'Test State',
    postcode: '12345',
    phone: '+1234567890',
    email: 'smtp-test@business.com',
    adminUserEmail: 'muaaz.test.' + Date.now() + '@gmail.com', // Unique test email
    adminUserPassword: 'TestPass123!',
    adminUserFullName: 'SMTP Test Admin User'
  }
};

async function testRealEmailSending() {
  try {
    console.log('🔍 Testing Real Email Sending via API...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });

    if (!loginResponse.data.success) {
      console.error('❌ Admin login failed:', loginResponse.data.message);
      console.log('💡 Make sure your server is running and admin credentials are correct');
      return;
    }

    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Create partner account (this should send real email via SMTP)
    console.log('\n2. Creating partner account (should send REAL email via SMTP)...');
    console.log('📧 Email will be sent to:', TEST_CONFIG.testPartnerAccount.adminUserEmail);
    console.log('📧 Using SMTP server:', process.env.MAIL_HOST || 'smtp.eu.mailgun.org');

    const createResponse = await axios.post(
      `${BASE_URL}/admin/partner-accounts`,
      TEST_CONFIG.testPartnerAccount,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (createResponse.data.success) {
      console.log('✅ Partner account created successfully!');
      console.log('📧 SMTP email should have been sent!');
      console.log('📧 Check your email inbox:', TEST_CONFIG.testPartnerAccount.adminUserEmail);
      console.log('📧 Also check spam/junk folder');
      
      // Clean up - delete the test account
      const accountId = createResponse.data.data.partnerAccount.id;
      console.log('\n3. Cleaning up test account...');
      
      await axios.delete(`${BASE_URL}/admin/partner-accounts/${accountId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      console.log('✅ Test account cleaned up');
    } else {
      console.error('❌ Partner account creation failed:', createResponse.data.message);
    }

    console.log('\n🎉 Real Email Test Completed!');
    console.log('\n📋 What to check:');
    console.log('1. Check server console logs for SMTP sending details');
    console.log('2. Check email inbox:', TEST_CONFIG.testPartnerAccount.adminUserEmail);
    console.log('3. Check spam/junk folder');
    console.log('4. Look for email with subject: "Welcome to ERPS Partner Portal - [Business Name] Account Created"');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - Is your server running?');
      console.log('💡 Start your server with: npm run dev');
    } else {
      console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
  }
}

// Run the test
console.log('🚀 Starting Real Email Test...');
console.log('📧 SMTP Configuration:');
console.log(`   Host: ${process.env.MAIL_HOST || 'smtp.eu.mailgun.org'}`);
console.log(`   Port: ${process.env.MAIL_PORT || '587'}`);
console.log(`   Username: ${process.env.MAIL_USERNAME || 'no-reply@dotgod.nl'}`);
console.log(`   From: ${process.env.MAIL_FROM || 'no-reply@dotgod.nl'}`);
console.log('');

testRealEmailSending();