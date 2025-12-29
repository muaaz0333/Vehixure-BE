# ERPS Partner Account Email Notification System

## Overview

The ERPS Partner Portal automatically sends email notifications when ERPS Admin creates new partner accounts and users. This ensures that new partners receive their login credentials and important onboarding information immediately.

## Email Types

### 1. Partner Account Creation Email

**Triggered When:** ERPS Admin creates a new partner account

**Sent To:** The admin user email specified during partner account creation

**Email Content:**
- Welcome message with business name
- Partner account information (business name, contact person, status)
- Admin user login credentials (email, password, role)
- Getting started steps and next actions
- Portal access link
- Security reminders
- Support contact information

**Template:** Professional green-themed email with ERPS branding

### 2. Partner User Creation Email

**Triggered When:** ERPS Admin or Account Admin creates a new partner user

**Sent To:** The new user's email address

**Email Content:**
- Welcome message with user's name
- User account details (email, password, role, business name)
- Login credentials and portal access link
- Security reminders about password changes
- Next steps for getting started
- Support contact information

**Template:** Professional blue-themed email with ERPS branding

## Implementation Details

### Email Service Architecture

```typescript
// Email service with multiple templates
export class EmailService {
  // Partner account creation email
  static async sendPartnerAccountCreationEmail(options: PartnerAccountCreationEmailOptions)
  
  // Generic user creation email
  static async sendGenericUserCreationEmail(options: UserCreationEmailOptions)
  
  // Reminder emails (existing functionality)
  async sendReminderEmail(options: EmailOptions)
}
```

### Email Templates

Both email types include:
- **HTML Version:** Rich formatting with ERPS branding, colors, and styling
- **Text Version:** Plain text fallback for email clients that don't support HTML
- **Responsive Design:** Mobile-friendly layout
- **Security Notices:** Password change reminders and security best practices

### Configuration

Email settings are configured via environment variables:

```bash
# Email Provider Configuration
EMAIL_PROVIDER=sendgrid          # or 'ses', 'mailgun'
EMAIL_API_KEY=your_api_key_here
FROM_EMAIL=noreply@erps.com.au

# Frontend URL for login links
FRONTEND_URL=https://portal.erps.com.au

# Support Contact Information
SUPPORT_EMAIL=support@erps.com.au
SUPPORT_PHONE=1800 ERPS (1800 3777)
```

## API Endpoints That Trigger Emails

### 1. Create Partner Account
```
POST /api/v1/partner-accounts
Authorization: Bearer <erps_admin_token>

Body:
{
  "businessName": "ABC Auto Services",
  "contactPerson": "John Smith",
  "adminUserEmail": "admin@abcauto.com",
  "adminUserPassword": "securepassword",
  "adminUserFullName": "John Smith",
  // ... other partner account fields
}
```

**Email Sent:** Partner Account Creation Email to `adminUserEmail`

### 2. Create Partner User
```
POST /api/v1/partner-accounts/:accountId/users
Authorization: Bearer <admin_or_account_admin_token>

Body:
{
  "email": "staff@abcauto.com",
  "password": "securepassword",
  "fullName": "Jane Doe",
  "partnerRole": "ACCOUNT_STAFF",
  // ... other user fields
}
```

**Email Sent:** Partner User Creation Email to `email`

## Email Content Examples

### Partner Account Creation Email Subject
```
Welcome to ERPS Partner Portal - [Business Name] Account Created
```

### Partner User Creation Email Subject
```
Welcome to ERPS Partner Portal - Your Account is Ready
```

### Key Information Included

**Security Information:**
- Temporary passwords (users must change on first login)
- Security best practices
- Account protection guidelines

**Getting Started:**
- Step-by-step onboarding instructions
- Portal access links
- Feature overview

**Support Information:**
- Contact details for technical support
- Business hours
- Portal URL and resources

## Testing the Email System

### 1. Manual Testing

Use the provided test script:

```bash
# Update the admin credentials in the test file
node test-partner-account-email.js
```

### 2. API Testing

Use Postman or similar tool to test the endpoints directly:

1. Login as ERPS Admin to get JWT token
2. Create partner account (check email inbox)
3. Create partner user (check email inbox)

### 3. Email Verification

Check the following email addresses for notifications:
- Partner account admin email (from partner account creation)
- Individual user emails (from user creation)

## Error Handling

### Email Delivery Failures

- **Non-blocking:** Account/user creation succeeds even if email fails
- **Logging:** All email attempts are logged with success/failure status
- **Retry Logic:** Can be implemented at the provider level
- **Fallback:** Text version sent if HTML fails

### Common Issues

1. **Invalid Email Addresses:** Validated during account creation
2. **Email Provider Limits:** Rate limiting handled by provider
3. **Spam Filters:** Professional templates reduce spam likelihood
4. **Configuration Errors:** Logged with detailed error messages

## Email Provider Integration

### Supported Providers

1. **SendGrid** (recommended)
2. **Amazon SES**
3. **Mailgun**
4. **Development Mode** (console logging)

### Provider Configuration

Each provider requires specific API keys and configuration:

```typescript
// Example SendGrid integration
private async sendViaSendGrid(emailData: any): Promise<boolean> {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(this.apiKey);
  const result = await sgMail.send(emailData);
  return result[0].statusCode === 202;
}
```

## Security Considerations

### Password Handling

- **Temporary Passwords:** Generated securely and sent once
- **Plain Text in Email:** Necessary for initial access (industry standard)
- **Forced Change:** Users must change password on first login
- **No Storage:** Plain passwords not stored after hashing

### Email Security

- **HTTPS Links:** All portal links use HTTPS
- **Token Expiry:** Login tokens have reasonable expiry times
- **Audit Trail:** All email sending attempts are logged
- **Data Protection:** Minimal personal data in emails

## Monitoring and Analytics

### Email Metrics

Track the following metrics:
- Email delivery success rate
- Email open rates (if provider supports)
- Click-through rates on portal links
- Failed delivery reasons

### Logging

All email operations are logged:
```
✅ Partner account creation email sent to: admin@example.com
❌ Failed to send welcome email: Invalid email address
📧 Email sent successfully to: user@example.com
```

## Customization Options

### Template Customization

- **Branding:** Update colors, logos, and styling
- **Content:** Modify welcome messages and instructions
- **Languages:** Add multi-language support
- **Personalization:** Include more business-specific details

### Business Rules

- **Email Timing:** Send immediately or schedule for business hours
- **Recipient Lists:** CC additional stakeholders
- **Content Variations:** Different templates for different partner types
- **Follow-up Emails:** Automated onboarding sequences

## Troubleshooting

### Common Issues and Solutions

1. **Emails Not Received**
   - Check spam/junk folders
   - Verify email address spelling
   - Check email provider logs
   - Verify API key configuration

2. **HTML Not Displaying**
   - Email client doesn't support HTML
   - Text version will be used automatically
   - Check email client settings

3. **Links Not Working**
   - Verify FRONTEND_URL environment variable
   - Check portal accessibility
   - Ensure HTTPS configuration

4. **Authentication Errors**
   - Verify email provider API key
   - Check provider account status
   - Review rate limits and quotas

## Support and Maintenance

### Regular Maintenance

- **Monitor Delivery Rates:** Check email provider dashboards
- **Update Templates:** Keep content current and accurate
- **Test Regularly:** Verify email functionality works
- **Review Logs:** Check for patterns in failures

### Support Contacts

For email system issues:
- **Technical Support:** Check email service logs
- **Provider Support:** Contact email provider directly
- **System Admin:** Review environment configuration
- **Business Users:** Provide alternative contact methods

---

## Summary

The ERPS Partner Portal email notification system ensures that:

1. **ERPS Admin** can create partner accounts with automatic email notifications
2. **New Partners** receive comprehensive onboarding information
3. **Partner Users** get their login credentials immediately
4. **Security** is maintained with proper password handling
5. **Support** information is readily available

The system is designed to be reliable, secure, and user-friendly, providing a professional onboarding experience for new ERPS partners.