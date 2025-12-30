import { User } from "../entities/User.js";
import path from "path";
import ejs from "ejs";
import bcrypt from "bcryptjs";
import email from "../Traits/SendEmail.js";
import { fileURLToPath } from "url";
import Response from "../Traits/ApiResponser.js";
import { sendSms } from "../../utils/twilioService.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const register = async (req, reply) => {
  const { userEmail, password, fullName, dob } = req.body;
  if (!userEmail || !password || !fullName || !dob) {
    return Response.errorResponse(reply, "All fields are required", 400);
  }
  console.log("Registration data received:", { userEmail, fullName, dob });
  const repo = req.server.db.getRepository(User);
  const existing = await repo.findOneBy({ email: userEmail });
  console.log("Existing user check:", existing);
  if (existing) {
    const existingUserToken = req.server.jwt.sign({ id: existing.id, email: existing.email, role: existing.role });
    return Response.showOne(reply, {
      success: true,
      message: "User already exists. Logged in successfully.",
      data: {
        ...existing,
        token: existingUserToken
      }
    });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = repo.create({ email: userEmail, password: hashed, fullName, dob, role: "PARTNER_USER" });
  console.log("User creation data:", { email: userEmail, fullName, dob, id: user.id });
  await repo.save(user);
  const token = req.server.jwt.sign({ id: user.id, email: user.email, role: user.role });
  const otpCode = Math.floor(1e4 + Math.random() * 9e4).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1e3);
  const html = await ejs.renderFile(
    path.join(__dirname, "../../resources/views/emails/verify-account-email.ejs"),
    { userEmail: user.email, otp: otpCode }
  );
  try {
    await email.send({
      to: user.email,
      subject: "Verify Your Account",
      html
    });
    console.log(`\u2705 Verification email sent to: ${user.email}`);
  } catch (mailErr) {
    console.error("\u274C Email send failed:", mailErr.message);
  }
  return Response.showOne(reply, {
    success: true,
    message: "Registered successfully",
    data: {
      ...user,
      token
    }
  });
};
export const login = async (req, reply) => {
  const { email: email2, password } = req.body;
  if (!email2 || !password) {
    return Response.errorResponse(reply, "Email and password are required", 400);
  }
  const repo = req.server.db.getRepository(User);
  const user = await repo.findOneBy({ email: email2 });
  console.log("Login attempt for user:", user);
  if (!user) return Response.errorResponse(reply, "Invalid credentials", 401);
  const valid = await bcrypt.compare(password, user?.password || "");
  if (!valid) return Response.errorResponse(reply, "Invalid credentials", 401);
  const token = req.server.jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role,
    partnerRole: user.partnerRole,
    partnerAccountId: user.partnerAccountId
  });
  return Response.showOne(reply, {
    success: true,
    message: "Login successful",
    data: {
      ...user,
      token
    }
  });
};
export const resendEmailOtp = async (req, reply) => {
  try {
    const userId = req.decoded?._id || req.user?.id;
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    if (user.isEmailVerified) return Response.errorResponse(reply, "Email already verified", 400);
    const otpCode = Math.floor(1e4 + Math.random() * 9e4).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1e3);
    const html = await ejs.renderFile(
      path.join(__dirname, "../../resources/views/emails/verify-account-email.ejs"),
      { userEmail: user.email, otp: otpCode }
    );
    await email.send({
      to: user.email,
      subject: "Resend Verification Code",
      html
    });
    return Response.showOne(reply, {
      success: true,
      message: "OTP resent successfully",
      data: {
        user
      }
    });
  } catch (err) {
    console.error("\u274C resendEmailOtp error:", err);
    return Response.errorResponse(reply, err.message || "Failed to resend OTP");
  }
};
export const resendPasswordOtp = async (req, reply) => {
  try {
    const userId = req.decoded?._id || req.user?.id;
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    const otpCode = Math.floor(1e4 + Math.random() * 9e4).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1e3);
    const html = await ejs.renderFile(
      path.join(__dirname, "../../resources/views/emails/forgot-password-email.ejs"),
      {
        resetPasswordCode: otpCode,
        userEmail: user.email
      }
    );
    await email.send({
      to: user.email,
      subject: "Resend Password Reset Code",
      html
    });
    return Response.showOne(reply, {
      success: true,
      message: "OTP resent successfully",
      data: {
        user
      }
    });
  } catch (err) {
    console.error("\u274C resendEmailOtp error:", err);
    return Response.errorResponse(reply, err.message || "Failed to resend OTP");
  }
};
export const forgetPassword = async (req, reply) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) return Response.errorResponse(reply, "Email is required", 400);
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ email: userEmail });
    console.log("Forget password request for email:", user);
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1e3);
    const resetCode = Math.floor(1e4 + Math.random() * 9e4).toString();
    const html = await ejs.renderFile(
      path.join(__dirname, "../../resources/views/emails/forgot-password-email.ejs"),
      {
        resetPasswordCode: resetCode,
        userEmail: user.email
      }
    );
    try {
      await email.send({
        to: user.email,
        subject: "Forget Password?",
        html
      });
    } catch (mailErr) {
      console.error("\u274C forgetPassword email send failed:", mailErr?.message || mailErr);
    }
    return Response.showOne(reply, { success: true, message: "Reset code sent", data: { user } });
  } catch (err) {
    console.error("\u274C forgetPassword error:", err);
    return Response.errorResponse(reply, err.message || "Something went wrong");
  }
};
export const sendOtp = async (req, reply) => {
  try {
    const { phone } = req.body;
    const userId = req.decoded?._id || req.user?.id;
    if (!phone) return Response.errorResponse(reply, "Phone number is required", 400);
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    if (!e164Regex.test(phone)) {
      return Response.errorResponse(
        reply,
        "Invalid phone number format. Use E.164 format, e.g. +15551234567",
        400
      );
    }
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    console.log("Updating user phone number:", phone);
    await repo.update(user.id, { phone });
    const otpCode = Math.floor(1e4 + Math.random() * 9e4).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1e3);
    const messageBody = `Your verification code is: ${otpCode}. It expires in 5 minutes.`;
    await sendSms(phone, messageBody);
    return Response.showOne(reply, { success: true, message: "OTP sent successfully", data: { user } });
  } catch (err) {
    console.error("\u274C sendOtp error:", err);
    return Response.errorResponse(reply, err.message || "Something went wrong");
  }
};
export const verifyOtp = async (req, reply) => {
  try {
    const { otp, type } = req.body;
    if (!otp) return Response.errorResponse(reply, "OTP is required", 400);
    if (!otp.length || otp.length !== 5) return Response.errorResponse(reply, "OTP must be 5 digits", 400);
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: req.user?.id });
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    if (type === "email") {
      user.isEmailVerified = true;
    } else if (type === "phone") {
      user.isPhoneVerified = true;
    } else if (type === "password_reset") {
      return Response.showOne(reply, { success: true, message: "Password reset OTP verified successfully" });
    } else {
      return Response.errorResponse(reply, "Invalid verification type", 400);
    }
    if (user.isEmailVerified && user.isPhoneVerified) {
      user.isVerified = true;
    }
    await repo.save(user);
    const userRecord = await repo.findOneBy({ id: req.user?.id });
    return Response.showOne(reply, {
      success: true,
      message: type === "email" ? "Email verified successfully" : "Phone verified successfully",
      data: {
        user: userRecord
      }
    });
  } catch (err) {
    console.error("\u274C verifyOtp error:", err);
    return Response.errorResponse(reply, err.message || "Something went wrong");
  }
};
export const resendOtp = async (req, reply) => {
  try {
    const userId = req.decoded?._id || req.user?.id;
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    if (!user.phone)
      return Response.errorResponse(
        reply,
        "Phone number not found. Please add your phone number first.",
        400
      );
    const otpCode = Math.floor(1e4 + Math.random() * 9e4).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1e3);
    const messageBody = `Your new verification code is: ${otpCode}. It expires in 5 minutes.`;
    await sendSms(user.phone, messageBody);
    return Response.showOne(reply, { success: true, message: "OTP resent successfully", data: { user } });
  } catch (err) {
    console.error("\u274C resendOtp error:", err);
    return Response.errorResponse(reply, err.message || "Something went wrong");
  }
};
export const resetPasswordWithCode = async (req, reply) => {
  try {
    const { email: email2, code, newPassword } = req.body;
    if (!email2 || !code || !newPassword) {
      return Response.errorResponse(reply, "All fields are required", 400);
    }
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ email: email2 });
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    return Response.showOne(reply, {
      success: true,
      message: "Password reset successfully",
      data: { user }
    });
  } catch (err) {
    console.error("\u274C resetPasswordWithCode error:", err);
    return Response.errorResponse(reply, err.message || "Something went wrong");
  }
};
export const getPartnerUsers = async (req, reply) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== "ERPS_ADMIN") {
      return Response.errorResponse(reply, "Only ERPS Admin can view all partner users", 403);
    }
    const repo = req.server.db.getRepository(User);
    const partnerUsers = await repo.find({
      where: { role: "PARTNER_USER", isDeleted: false },
      select: [
        "id",
        "email",
        "fullName",
        "phone",
        "mobileNumber",
        "partnerRole",
        "partnerAccountId",
        "isAccreditedInstaller",
        "isAuthorisedInspector",
        "installerCertificationNumber",
        "inspectorCertificationNumber",
        "isVerified",
        "isBlocked",
        "created"
      ]
    });
    return Response.showAll(reply, partnerUsers);
  } catch (err) {
    console.error("\u274C getPartnerUsers error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve partner users");
  }
};
export const getInstallers = async (req, reply) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== "ERPS_ADMIN") {
      return Response.errorResponse(reply, "Only ERPS Admin can view all installers", 403);
    }
    const repo = req.server.db.getRepository(User);
    const installers = await repo.find({
      where: {
        role: "PARTNER_USER",
        partnerRole: "ACCOUNT_INSTALLER",
        isDeleted: false
      },
      select: [
        "id",
        "email",
        "fullName",
        "phone",
        "mobileNumber",
        "partnerAccountId",
        "isAccreditedInstaller",
        "isAuthorisedInspector",
        "installerCertificationNumber",
        "inspectorCertificationNumber",
        "installerCertificationDate",
        "inspectorCertificationDate",
        "isVerified",
        "isBlocked",
        "created"
      ]
    });
    return Response.showAll(reply, installers);
  } catch (err) {
    console.error("\u274C getInstallers error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve installers");
  }
};
export const adminLoginAs = async (req, reply) => {
  try {
    const { targetUserId } = req.body;
    const adminUser = req.user;
    if (!targetUserId) {
      return Response.errorResponse(reply, "Target user ID is required", 400);
    }
    if (adminUser.role !== "ERPS_ADMIN") {
      return Response.errorResponse(reply, "Only ERPS Admin can login as other users", 403);
    }
    const repo = req.server.db.getRepository(User);
    const targetUser = await repo.findOneBy({
      id: targetUserId,
      isDeleted: false
    });
    if (!targetUser) {
      return Response.errorResponse(reply, "Target user not found", 404);
    }
    if (targetUser.role !== "PARTNER_USER") {
      return Response.errorResponse(reply, "Can only login as partner users", 400);
    }
    if (targetUser.isBlocked) {
      return Response.errorResponse(reply, "Target user is blocked", 400);
    }
    const token = req.server.jwt.sign({
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      partnerRole: targetUser.partnerRole,
      partnerAccountId: targetUser.partnerAccountId,
      adminLoginAs: true,
      // Flag to indicate this is an admin login
      originalAdminId: adminUser.id
    });
    return Response.showOne(reply, {
      success: true,
      message: `Successfully logged in as ${targetUser.partnerRole?.toLowerCase() || "partner user"}`,
      data: {
        ...targetUser,
        token,
        adminLoginAs: true,
        originalAdmin: {
          id: adminUser.id,
          email: adminUser.email
        }
      }
    });
  } catch (err) {
    console.error("\u274C adminLoginAs error:", err);
    return Response.errorResponse(reply, err.message || "Failed to login as user");
  }
};
export const getCurrentUser = async (req, reply) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return Response.errorResponse(reply, "User not authenticated", 401);
    }
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOne({
      where: { id: userId, isDeleted: false },
      select: [
        "id",
        "email",
        "fullName",
        "dob",
        "phone",
        "mobileNumber",
        "role",
        "partnerRole",
        "partnerAccountId",
        "isVerified",
        "isEmailVerified",
        "isPhoneVerified",
        "isBlocked",
        "accountStatus",
        "isAccreditedInstaller",
        "isAuthorisedInspector",
        "installerCertificationNumber",
        "inspectorCertificationNumber",
        "installerCertificationDate",
        "inspectorCertificationDate",
        "languagePreference",
        "isAllowedNotification",
        "created",
        "modified"
      ]
    });
    if (!user) {
      return Response.errorResponse(reply, "User not found", 404);
    }
    if (user.isBlocked) {
      return Response.errorResponse(reply, "User account is blocked", 403);
    }
    return Response.showOne(reply, {
      success: true,
      message: "Current user retrieved successfully",
      data: {
        user: {
          ...user,
          // Don't include sensitive information
          password: void 0
        }
      }
    });
  } catch (err) {
    console.error("\u274C getCurrentUser error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve current user");
  }
};
export const changePassword = async (req, reply) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return Response.errorResponse(reply, "Current and new password are required", 400);
    }
    const userId = req.user?.id;
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, "User not found", 404);
    const validPassword = await bcrypt.compare(currentPassword, user.password || "");
    if (!validPassword) {
      return Response.errorResponse(reply, "Current password is incorrect", 401);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await repo.update(user.id, { password: hashedPassword });
    return Response.showOne(reply, {
      success: true,
      message: "Password changed successfully",
      data: { user }
    });
  } catch (err) {
    console.error("\u274C changePassword error:", err);
    return Response.errorResponse(reply, err.message || "Something went wrong");
  }
};
