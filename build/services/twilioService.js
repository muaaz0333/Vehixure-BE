import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
export const sendSms = async (to, body) => {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log("\u2705 SMS sent successfully:", message.sid);
  } catch (error) {
    console.error("\u274C Failed to send SMS:", error.message);
    throw error;
  }
};
