import nodemailer from "nodemailer";
export class EmailService {
  emailProvider;
  fromEmail;
  transporter;
  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || process.env.MAIL_DRIVER || "smtp";
    this.fromEmail = process.env.FROM_EMAIL || process.env.MAIL_FROM || "noreply@erps.com.au";
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.eu.mailgun.org",
      port: parseInt(process.env.MAIL_PORT || "587"),
      secure: false,
      // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USERNAME || "no-reply@dotgod.nl",
        pass: process.env.MAIL_PASSWORD || "17f69ea06be89d7bc42ad74ebea833be-3724298e-15413336"
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  /**
   * Send welcome email to newly created user
   */
  static async sendGenericUserCreationEmail(options) {
    const emailService = new EmailService();
    try {
      console.log(`\u{1F4E7} Sending welcome email to new user: ${options.email}`);
      console.log(`   Using SMTP: ${process.env.MAIL_HOST}`);
      console.log(`   From: ${emailService.fromEmail}`);
      const mailOptions = {
        from: emailService.fromEmail,
        to: options.email,
        subject: `Welcome to ERPS Partner Portal - Your Account is Ready`,
        html: emailService.generateUserCreationHtmlEmail(options),
        text: emailService.generateUserCreationTextEmail(options)
      };
      const result = await emailService.transporter.sendMail(mailOptions);
      if (result.messageId) {
        console.log(`\u2705 Welcome email sent successfully to: ${options.email}`);
        console.log(`   Message ID: ${result.messageId}`);
        return true;
      } else {
        console.log(`\u274C Welcome email failed to send to: ${options.email}`);
        return false;
      }
    } catch (error) {
      console.error("\u274C User creation email service error:", error);
      return false;
    }
  }
  /**
   * Send partner account creation notification email
   */
  static async sendPartnerAccountCreationEmail(options) {
    const emailService = new EmailService();
    try {
      console.log(`\u{1F4E7} Attempting to send partner account creation email...`);
      console.log(`   To: ${options.adminEmail}`);
      console.log(`   Business: ${options.businessName}`);
      console.log(`   Using SMTP: ${process.env.MAIL_HOST}`);
      console.log(`   From: ${emailService.fromEmail}`);
      const mailOptions = {
        from: emailService.fromEmail,
        to: options.adminEmail,
        subject: `Welcome to ERPS Partner Portal - ${options.businessName} Account Created`,
        html: emailService.generatePartnerAccountCreationHtmlEmail(options),
        text: emailService.generatePartnerAccountCreationTextEmail(options)
      };
      console.log(`\u{1F4E7} Sending email via SMTP...`);
      const result = await emailService.transporter.sendMail(mailOptions);
      if (result.messageId) {
        console.log(`\u2705 Partner account creation email sent successfully!`);
        console.log(`   To: ${options.adminEmail}`);
        console.log(`   Message ID: ${result.messageId}`);
        return true;
      } else {
        console.log(`\u274C Partner account creation email failed to send`);
        return false;
      }
    } catch (error) {
      console.error("\u274C Partner account creation email service error:", error);
      console.error("\u274C Error details:", error.message);
      return false;
    }
  }
  async sendReminderEmail(options) {
    try {
      console.log(`\u{1F4E7} Sending reminder email to: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Vehicle: ${options.vehicleDetails.make} ${options.vehicleDetails.model}`);
      const mailOptions = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: this.generateHtmlEmail(options),
        text: options.content
      };
      const result = await this.transporter.sendMail(mailOptions);
      if (result.messageId) {
        console.log(`\u2705 Reminder email sent successfully to: ${options.to}`);
        console.log(`   Message ID: ${result.messageId}`);
        return true;
      } else {
        console.log(`\u274C Reminder email failed to send to: ${options.to}`);
        return false;
      }
    } catch (error) {
      console.error("\u274C Reminder email service error:", error);
      return false;
    }
  }
  /**
   * Generate HTML email template for user creation
   */
  generateUserCreationHtmlEmail(options) {
    const loginUrl = options.loginUrl || process.env.FRONTEND_URL || "http://localhost:3000";
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ERPS Partner Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
        .credentials-box { background-color: #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1e40af; }
        .login-button { display: inline-block; background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .login-button:hover { background-color: #1d4ed8; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ERPS Partner Portal</div>
            <h1>Welcome ${options.fullName}!</h1>
            <p>Your account has been successfully created</p>
        </div>
        
        <div class="content">
            <h2>Account Details</h2>
            <p>Your ERPS Partner Portal account has been created with the following details:</p>
            
            <div class="credentials-box">
                <h3>\u{1F510} Login Credentials</h3>
                <p><strong>Email:</strong> ${options.email}</p>
                <p><strong>Password:</strong> ${options.password}</p>
                <p><strong>Role:</strong> ${options.role}</p>
                ${options.businessName ? `<p><strong>Business:</strong> ${options.businessName}</p>` : ""}
            </div>
            
            <div style="text-align: center;">
                <a href="${loginUrl}" class="login-button">Login to Portal</a>
            </div>
            
            <div class="security-notice">
                <h3>\u{1F512} Security Reminder</h3>
                <p><strong>Important:</strong> Please change your password after your first login for security purposes. Keep your login credentials secure and do not share them with unauthorized personnel.</p>
            </div>
            
            <h3>What's Next?</h3>
            <ul>
                <li>Login to the ERPS Partner Portal using the credentials above</li>
                <li>Complete your profile information</li>
                <li>Familiarize yourself with the warranty registration and inspection processes</li>
                <li>Contact support if you need assistance getting started</li>
            </ul>
            
            <h3>Need Help?</h3>
            <p>If you have any questions or need assistance, please contact our support team:</p>
            <ul>
                <li>Email: support@erps.com.au</li>
                <li>Phone: 1800 ERPS (1800 3777)</li>
                <li>Portal: <a href="${loginUrl}">${loginUrl}</a></li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This email was sent automatically by the ERPS Partner Portal system.</p>
            <p>Please do not reply to this email.</p>
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ERPS - Electronic Rust Protection System</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
  /**
   * Generate text email for user creation
   */
  generateUserCreationTextEmail(options) {
    const loginUrl = options.loginUrl || process.env.FRONTEND_URL || "http://localhost:3000";
    return `
Welcome to ERPS Partner Portal!

Dear ${options.fullName},

Your ERPS Partner Portal account has been successfully created.

LOGIN CREDENTIALS:
Email: ${options.email}
Password: ${options.password}
Role: ${options.role}
${options.businessName ? `Business: ${options.businessName}` : ""}

Login URL: ${loginUrl}

SECURITY REMINDER:
Please change your password after your first login for security purposes. Keep your login credentials secure and do not share them with unauthorized personnel.

WHAT'S NEXT:
1. Login to the ERPS Partner Portal using the credentials above
2. Complete your profile information
3. Familiarize yourself with the warranty registration and inspection processes
4. Contact support if you need assistance getting started

NEED HELP?
If you have any questions or need assistance, please contact our support team:
- Email: support@erps.com.au
- Phone: 1800 ERPS (1800 3777)
- Portal: ${loginUrl}

This email was sent automatically by the ERPS Partner Portal system.
Please do not reply to this email.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ERPS - Electronic Rust Protection System
    `.trim();
  }
  /**
   * Generate HTML email template for partner account creation
   */
  generatePartnerAccountCreationHtmlEmail(options) {
    const loginUrl = options.loginUrl || process.env.FRONTEND_URL || "http://localhost:3000";
    const supportEmail = options.supportEmail || "support@erps.com.au";
    const supportPhone = options.supportPhone || "1800 ERPS (1800 3777)";
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERPS Partner Account Created - ${options.businessName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background-color: #f0fdf4; border-radius: 0 0 8px 8px; }
        .business-info { background-color: #dcfce7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #059669; }
        .credentials-box { background-color: #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1e40af; }
        .login-button { display: inline-block; background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .login-button:hover { background-color: #047857; }
        .welcome-steps { background-color: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .success-badge { background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ERPS Partner Portal</div>
            <div class="success-badge">\u2705 Account Created Successfully</div>
            <h1>Welcome to the ERPS Partner Network!</h1>
            <p>Your partner account has been set up and is ready to use</p>
        </div>
        
        <div class="content">
            <h2>\u{1F389} Congratulations ${options.contactPerson}!</h2>
            <p>Your ERPS Partner Account has been successfully created and activated. You can now start managing warranty registrations and annual inspections through our portal.</p>
            
            <div class="business-info">
                <h3>\u{1F3E2} Partner Account Information</h3>
                <p><strong>Business Name:</strong> ${options.businessName}</p>
                <p><strong>Contact Person:</strong> ${options.contactPerson}</p>
                <p><strong>Account Status:</strong> <span style="color: #059669; font-weight: bold;">Active</span></p>
            </div>
            
            <div class="credentials-box">
                <h3>\u{1F510} Admin User Login Credentials</h3>
                <p><strong>Email:</strong> ${options.adminEmail}</p>
                <p><strong>Password:</strong> ${options.adminPassword}</p>
                <p><strong>Role:</strong> Account Administrator</p>
                <p><strong>Full Name:</strong> ${options.adminFullName || options.contactPerson}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${loginUrl}" class="login-button">Access Partner Portal</a>
            </div>
            
            <div class="welcome-steps">
                <h3>\u{1F680} Getting Started - Next Steps</h3>
                <ol>
                    <li><strong>Login:</strong> Use the credentials above to access your partner portal</li>
                    <li><strong>Change Password:</strong> Update your password for security</li>
                    <li><strong>Complete Profile:</strong> Fill in any missing business information</li>
                    <li><strong>Add Team Members:</strong> Create accounts for your staff and installers</li>
                    <li><strong>Start Processing:</strong> Begin creating warranty registrations and inspections</li>
                </ol>
            </div>
            
            <h3>\u{1F4CB} What You Can Do Now</h3>
            <ul>
                <li><strong>Warranty Registrations:</strong> Create and submit new ERPS installation warranties</li>
                <li><strong>Annual Inspections:</strong> Manage yearly compliance inspections</li>
                <li><strong>User Management:</strong> Add and manage staff and installer accounts</li>
                <li><strong>Photo Management:</strong> Upload and organize installation photos</li>
                <li><strong>Compliance Tracking:</strong> Monitor inspection due dates and reminders</li>
                <li><strong>Verification Workflow:</strong> Handle SMS-based work verification</li>
            </ul>
            
            <h3>\u{1F512} Important Security Information</h3>
            <ul>
                <li>Change your password immediately after first login</li>
                <li>Only share login credentials with authorized personnel</li>
                <li>Installers must verify work via SMS using their registered mobile numbers</li>
                <li>All system activities are logged for security and compliance</li>
            </ul>
            
            <h3>\u{1F4DE} Support & Assistance</h3>
            <p>Our support team is here to help you get started:</p>
            <ul>
                <li><strong>Email:</strong> ${supportEmail}</li>
                <li><strong>Phone:</strong> ${supportPhone}</li>
                <li><strong>Portal:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
                <li><strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM AEST</li>
            </ul>
            
            <p><strong>Welcome to the ERPS Partner Network!</strong> We look forward to working with ${options.businessName} to provide excellent ERPS services to your customers.</p>
        </div>
        
        <div class="footer">
            <p>This email was sent automatically when your ERPS Partner Account was created.</p>
            <p>Please do not reply to this email. For support, use the contact information above.</p>
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ERPS - Electronic Rust Protection System</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
  /**
   * Generate text email for partner account creation
   */
  generatePartnerAccountCreationTextEmail(options) {
    const loginUrl = options.loginUrl || process.env.FRONTEND_URL || "http://localhost:3000";
    const supportEmail = options.supportEmail || "support@erps.com.au";
    const supportPhone = options.supportPhone || "1800 ERPS (1800 3777)";
    return `
ERPS PARTNER ACCOUNT CREATED SUCCESSFULLY!

Congratulations ${options.contactPerson}!

Your ERPS Partner Account has been successfully created and activated. You can now start managing warranty registrations and annual inspections through our portal.

PARTNER ACCOUNT INFORMATION:
Business Name: ${options.businessName}
Contact Person: ${options.contactPerson}
Account Status: Active

ADMIN USER LOGIN CREDENTIALS:
Email: ${options.adminEmail}
Password: ${options.adminPassword}
Role: Account Administrator
Full Name: ${options.adminFullName || options.contactPerson}

Login URL: ${loginUrl}

GETTING STARTED - NEXT STEPS:
1. Login: Use the credentials above to access your partner portal
2. Change Password: Update your password for security
3. Complete Profile: Fill in any missing business information
4. Add Team Members: Create accounts for your staff and installers
5. Start Processing: Begin creating warranty registrations and inspections

WHAT YOU CAN DO NOW:
- Warranty Registrations: Create and submit new ERPS installation warranties
- Annual Inspections: Manage yearly compliance inspections
- User Management: Add and manage staff and installer accounts
- Photo Management: Upload and organize installation photos
- Compliance Tracking: Monitor inspection due dates and reminders
- Verification Workflow: Handle SMS-based work verification

IMPORTANT SECURITY INFORMATION:
- Change your password immediately after first login
- Only share login credentials with authorized personnel
- Installers must verify work via SMS using their registered mobile numbers
- All system activities are logged for security and compliance

SUPPORT & ASSISTANCE:
Our support team is here to help you get started:
- Email: ${supportEmail}
- Phone: ${supportPhone}
- Portal: ${loginUrl}
- Business Hours: Monday - Friday, 8:00 AM - 6:00 PM AEST

Welcome to the ERPS Partner Network! We look forward to working with ${options.businessName} to provide excellent ERPS services to your customers.

This email was sent automatically when your ERPS Partner Account was created.
Please do not reply to this email. For support, use the contact information above.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ERPS - Electronic Rust Protection System
    `.trim();
  }
  generateHtmlEmail(options) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .vehicle-info { background-color: #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .business-info { background-color: #dbeafe; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ERPS Annual Inspection Reminder</h1>
        </div>
        
        <div class="content">
            <h2>Dear ${options.customerName},</h2>
            
            <div class="vehicle-info">
                <h3>Vehicle Information</h3>
                <p><strong>Make:</strong> ${options.vehicleDetails.make}</p>
                <p><strong>Model:</strong> ${options.vehicleDetails.model}</p>
                <p><strong>VIN:</strong> ${options.vehicleDetails.vinNumber}</p>
            </div>
            
            <div style="white-space: pre-line; margin: 20px 0;">
                ${options.content}
            </div>
            
            <div class="business-info">
                <h3>Contact Your ERPS Installer</h3>
                <p><strong>Business:</strong> ${options.businessDetails.name}</p>
                <p><strong>Phone:</strong> ${options.businessDetails.phone}</p>
            </div>
            
            ${this.getWarningSection(options.subject)}
        </div>
        
        <div class="footer">
            <p>This is an automated reminder from the ERPS system.</p>
            <p>Please do not reply to this email.</p>
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ERPS - Electronic Rust Protection System</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
  /**
   * Get warning section based on email type
   */
  getWarningSection(subject) {
    if (subject.includes("URGENT") || subject.includes("30 Days")) {
      return `
        <div class="warning">
          <h3>\u26A0\uFE0F URGENT ACTION REQUIRED</h3>
          <p>Your inspection is due in 30 days. You have a 30-day grace period after the due date. Failure to complete the inspection will result in permanent warranty lapse.</p>
        </div>
      `;
    } else if (subject.includes("FINAL NOTICE") || subject.includes("DUE TODAY")) {
      return `
        <div class="warning">
          <h3>\u{1F6A8} FINAL NOTICE</h3>
          <p>Your inspection is due TODAY. You have 30 days from today to complete the inspection before your warranty lapses permanently. Contact your installer immediately.</p>
        </div>
      `;
    }
    return "";
  }
  /**
   * Send test email (for system verification)
   */
  async sendTestEmail(to) {
    const testOptions = {
      to,
      subject: "ERPS System Test Email",
      content: "This is a test email from the ERPS reminder system. If you receive this, the email service is working correctly.",
      customerName: "Test User",
      vehicleDetails: {
        make: "Test",
        model: "Vehicle",
        vinNumber: "TEST123456789"
      },
      businessDetails: {
        name: "Test Business",
        phone: "+61400000000"
      }
    };
    return await this.sendReminderEmail(testOptions);
  }
  /**
   * Get email service status
   */
  getServiceStatus() {
    return {
      provider: this.emailProvider,
      configured: !!(process.env.MAIL_HOST && process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD),
      fromEmail: this.fromEmail
    };
  }
  /**
   * Test SMTP connection
   */
  async testConnection() {
    try {
      console.log("\u{1F50D} Testing SMTP connection...");
      await this.transporter.verify();
      console.log("\u2705 SMTP connection successful");
      return true;
    } catch (error) {
      console.error("\u274C SMTP connection failed:", error);
      return false;
    }
  }
}
