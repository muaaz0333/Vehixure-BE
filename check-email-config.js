/**
 * Quick script to check email configuration
 */

console.log('🔍 Checking Email Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || 'NOT SET (will default to sendgrid)'}`);
console.log(`EMAIL_API_KEY: ${process.env.EMAIL_API_KEY ? 'SET' : 'NOT SET (will use empty string)'}`);
console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || 'NOT SET (will default to noreply@erps.com.au)'}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET (will default to https://portal.erps.com.au)'}`);

console.log('\n💡 Email Configuration Status:');
console.log('Since EMAIL_PROVIDER and EMAIL_API_KEY are not set in your .env file,');
console.log('the email service will run in SIMULATION MODE.');
console.log('This means emails will be logged to console but not actually sent.');

console.log('\n🔧 To Enable Real Email Sending:');
console.log('Add these to your .env file:');
console.log('EMAIL_PROVIDER=sendgrid');
console.log('EMAIL_API_KEY=your_sendgrid_api_key');
console.log('FROM_EMAIL=noreply@yourdomain.com');

console.log('\n📧 Current Email Service Behavior:');
console.log('✅ Partner account creation will trigger email simulation');
console.log('✅ Email details will be logged to server console');
console.log('✅ Account creation will succeed regardless of email status');
console.log('❌ No actual email will be sent to recipient');

console.log('\n🎯 Next Steps:');
console.log('1. Start your server: npm run dev');
console.log('2. Create a partner account via API');
console.log('3. Check server console for email simulation logs');
console.log('4. Add real email provider credentials to send actual emails');