/**
 * Email Debug Test Script
 * This script tests the email functionality to see why emails aren't being sent
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5050/api/v1';

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@erps.com.au', // Update with your admin email
  adminPassword: 'admin123', // Update with your admin password
  
  testPartnerAccount: {
    businessName: 'Email Test Business',
    contactPerson: 'Test User',
    streetAddress: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    postcode: '12345',
    phone: '+1234567890',
    email: 'test@business.com',
    adminUserEmail: 'muaazahmad.cs@gmail.com', // This should receive the email
    adminUserPassword: 'TestPass123!',
    adminUserFullName: 'Test Admin User'
  }
};

async function testEmailFunctionality() {
  try {
    console.log('🔍 Testing Email Functionality...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });

    if (!loginResponse.data.success) {
      console.error('❌ Admin login failed:', loginResponse.data.message);
      return;
    }

    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Create partner account (this should trigger email)
    console.log('\n2. Creating partner account (should send email)...');
    console.log('📧 Email should be sent to:', TEST_CONFIG.testPartnerAccount.adminUserEmail);

    const createResponse = await axios.post(
      `${BASE_URL}/partner-accounts`,
      TEST_CONFIG.testPartnerAccount,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (createResponse.data.success) {
      console.log('✅ Partner account created successfully');
      console.log('📧 Check the server logs for email sending details');
      console.log('📧 Check email inbox:', TEST_CONFIG.testPartnerAccount.adminUserEmail);
      
      // Clean up - delete the test account
      const accountId = createResponse.data.data.partnerAccount.id;
      console.log('\n3. Cleaning up test account...');
      
      await axios.delete(`${BASE_URL}/partner-accounts/${accountId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      console.log('✅ Test account cleaned up');
    } else {
      console.error('❌ Partner account creation failed:', createResponse.data.message);
    }

    console.log('\n📋 Email Debug Checklist:');
    console.log('1. Check server console logs for email sending messages');
    console.log('2. Verify EMAIL_PROVIDER environment variable is set');
    console.log('3. Check EMAIL_API_KEY if using real email provider');
    console.log('4. Verify FROM_EMAIL environment variable');
    console.log('5. Check spam/junk folder in email inbox');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testEmailFunctionality();