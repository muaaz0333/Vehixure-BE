import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const send = async ({ to, subject = "", html = "" }) => {
  const user = process.env.MAIL_USERNAME || "";
  const pass = process.env.MAIL_PASSWORD || "";
  const host = process.env.MAIL_HOST || "";
  const port = parseInt(process.env.MAIL_PORT || "587", 10);
  const from = process.env.MAIL_FROM || user;
  const provider = host.includes("mailgun") ? "mailgun" : host.includes("office365") || host.includes("outlook") ? "outlook" : host.includes("gmail") ? "gmail" : "custom";
  let transportConfig = {
    host,
    port,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  };
  switch (provider) {
    case "mailgun":
      transportConfig.secure = false;
      transportConfig.port = 587;
      break;
    case "outlook":
      transportConfig.host = "smtp.office365.com";
      transportConfig.port = 587;
      transportConfig.secure = false;
      break;
    case "gmail":
      transportConfig.host = "smtp.gmail.com";
      transportConfig.port = 465;
      transportConfig.secure = true;
      break;
    default:
      transportConfig.secure = port === 465;
  }
  console.log(`\u{1F4E1} Using ${provider.toUpperCase()} SMTP on port ${transportConfig.port}`);
  try {
    const transporter = nodemailer.createTransport(transportConfig);
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    console.log(`\u2705 Email sent: ${info.messageId} \u2192 ${to}`);
    return true;
  } catch (err) {
    console.error("\u274C Email failed:", err.message);
    console.error(err);
    throw err;
  }
};
export default { send };
