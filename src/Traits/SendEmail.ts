import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface SendEmailOptions {
  to: string;
  subject?: string;
  html?: string;
}

const send = async ({ to, subject = '', html = '' }: SendEmailOptions): Promise<boolean> => {
  const user = process.env.MAIL_USERNAME || '';
  const pass = process.env.MAIL_PASSWORD || '';
  const host = process.env.MAIL_HOST || '';
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const from = process.env.MAIL_FROM || user;

  // 🔍 Auto-detect provider
  const provider = host.includes('mailgun')
    ? 'mailgun'
    : host.includes('office365') || host.includes('outlook')
    ? 'outlook'
    : host.includes('gmail')
    ? 'gmail'
    : 'custom';

  // 🎯 Configure automatically based on provider
  let transportConfig: any = {
    host,
    port,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  };

  switch (provider) {
    case 'mailgun':
      transportConfig.secure = false;
      transportConfig.port = 587;
      break;
    case 'outlook':
      transportConfig.host = 'smtp.office365.com';
      transportConfig.port = 587;
      transportConfig.secure = false;
      break;
    case 'gmail':
      transportConfig.host = 'smtp.gmail.com';
      transportConfig.port = 465;
      transportConfig.secure = true;
      break;
    default:
      transportConfig.secure = port === 465;
  }

  console.log(`📡 Using ${provider.toUpperCase()} SMTP on port ${transportConfig.port}`);

  try {
    const transporter = nodemailer.createTransport(transportConfig);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent: ${info.messageId} → ${to}`);
    return true;
  } catch (err: any) {
    console.error('❌ Email failed:', err.message);
    console.error(err);
    throw err;
  }
};

export default { send };
