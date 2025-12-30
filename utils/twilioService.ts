import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

/**
 * 📱 Send SMS via Twilio
 * @param to Recipient phone number (E.164 format, e.g. +15551234567)
 * @param body Message body
 */
export const sendSms = async (to: string, body: string): Promise<void> => {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER as string,
      to,
    });

    console.log('✅ SMS sent successfully:', message.sid);
  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error.message);
    throw error;
  }
};
