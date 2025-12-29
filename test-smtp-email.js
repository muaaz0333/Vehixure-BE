/**
 * Test SMTP Email Functionality
 * This script tests the updated email service with SMTP
 */

import { EmailService } from './src/services/email-service.js';

async function testSMTPEmail() {
  try {
    console.log('🔍 Testing SMTP Email Service...\n');

    // Create email service instance
    const emailService = new EmailService();

    // Check service status
    console.log('📋 Email Service Status:');
    const status = emailService.getServiceStatus();
    console.log(`   Provider: ${status.provider}`);
    console.log(`   Configured: ${status.configured}`);
    console.log(`   From Email: ${status.fromEmail}`);

    // Test SMTP connection
    console.log('\n🔗 Testing SMTP Connection...');
    const connectionTest = await emailService.testConnection();
    
    if (!connectionTest) {
      console.log('❌ SMTP connection failed. Check your credentials.');
      return;
    }

    // Test sending a simple email
    console.log('\n📧 Testing Email Sending...');
    const testEmail = 'muaazahmad.cs@gmail.com'; // Your email
    
    console.log(`   Sending test email to: ${testEmail}`);
    const emailSent = await emailService.sendTestEmail(testEmail);
    
    if (emailSent) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Check your email inbox (and spam folder)');
    } else {
      console.log('❌ Test email failed to send');
    }

    // Test partner account creation email
    console.log('\n📧 Testing Partner Account Creation Email...');
    const partnerEmailSent = await EmailService.sendPartnerAccountCreationEmail({
      businessName: 'Test Business SMTP',
      contactPerson: 'Test Contact',
      adminEmail: testEmail,
      adminPassword: 'TestPassword123!',
      adminFullName: 'Test Admin User',
      loginUrl: 'https://portal.erps.com.au'
    });

    if (partnerEmailSent) {
      console.log('✅ Partner account creation email sent successfully!');
      console.log('📧 Check your email inbox for the welcome email');
    } else {
      console.log('❌ Partner account creation email failed to send');
    }

    console.log('\n🎉 SMTP Email Test Completed!');
    console.log('\n📋 Summary:');
    console.log(`   SMTP Connection: ${connectionTest ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Test Email: ${emailSent ? '✅ Sent' : '❌ Failed'}`);
    console.log(`   Partner Email: ${partnerEmailSent ? '✅ Sent' : '❌ Failed'}`);

  } catch (error) {
    console.error('❌ SMTP Email test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testSMTPEmail();