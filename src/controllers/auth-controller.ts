import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../entities/User.js';
import path from 'path';
import ejs from 'ejs';
import bcrypt from 'bcryptjs';
import email from '../Traits/SendEmail.js';
import { fileURLToPath } from 'url';
import Response from '../Traits/ApiResponser.js';
import {sendSms} from "../services/twilioService.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * 📩 Register User
 */

export const register = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userEmail, password, fullName, dob } = req.body as any;
  if (!userEmail || !password || !fullName || !dob) {
    return Response.errorResponse(reply, 'All fields are required', 400);
  }
  console.log("Registration data received:", { userEmail, fullName, dob });
  const repo = req.server.db.getRepository(User);
  const existing = await repo.findOneBy({ email: userEmail });
  console.log("Existing user check:", existing);
  if (existing) {
    // ensure notification preference exists for existing user
    const existingUserToken = req.server.jwt.sign({ id: existing.id, email: existing.email, role: existing.role });
    return Response.showOne(reply, {
      success: true,
      message: 'User already exists. Logged in successfully.',
      data: {
        ...existing,
        token: existingUserToken,
      },
    });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = repo.create({ email: userEmail, password: hashed, fullName, dob, role: 'PARTNER_USER' });
  console.log("User creation data:", { email: userEmail, fullName, dob, id: user.id });
  await repo.save(user);
  // create default notification preference for new user

  const token = req.server.jwt.sign({ id: user.id, email: user.email, role: user.role });

  const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  // await repo.update(user.id, { otp: otpCode, otpExpires });
  const html = await ejs.renderFile(
    path.join(__dirname, '../../resources/views/emails/verify-account-email.ejs'),
    { userEmail: user.email, otp: otpCode }
  );

  try {
    await email.send({
      to: user.email,
      subject: 'Verify Your Account',
      html,
    });
    console.log(`✅ Verification email sent to: ${user.email}`);
  } catch (mailErr: any) {
    console.error('❌ Email send failed:', mailErr.message);
  }

  return Response.showOne(reply, {
    success: true,
    message: 'Registered successfully',
    data: {
      ...user,
      token,
    },
  });

};

/**
 * 📩 Login User
 */
export const login = async (req: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = req.body as any;
  if (!email || !password) {
    return Response.errorResponse(reply, 'Email and password are required', 400);
  }
  const repo = req.server.db.getRepository(User);
  const user = await repo.findOneBy({ email });
  console.log("Login attempt for user:", user);
  if (!user) return Response.errorResponse(reply, 'Invalid credentials', 401);
  // if (user.isEmailVerified === false) {
  //   return Response.errorResponse(reply, 'Email not verified. Please verify your email before logging in.', 403);
  // }
  // if (user.isPhoneVerified === false) {
  //   return Response.errorResponse(reply, 'Phone number not verified. Please verify your phone number before logging in.', 403);
  // }
  
  const valid = await bcrypt.compare(password, user?.password || '');
  if (!valid) return Response.errorResponse(reply, 'Invalid credentials', 401);
  // const token = req.server.jwt.sign({ id: user.id, email: user.email });
  const token = req.server.jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role,
    partnerRole: user.partnerRole,
    partnerAccountId: user.partnerAccountId
  });
  return Response.showOne(reply, {
    success: true,
    message: 'Login successful',
    data: {
      ...user,
      token,
    },
  });
};

/**
 * 📩 Resend verification email OTP
 */
export const resendEmailOtp = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).decoded?._id || (req as any).user?.id;
    const repo = req.server.db.getRepository(User);

    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, 'User not found', 404);
    if (user.isEmailVerified) return Response.errorResponse(reply, 'Email already verified', 400);

    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    const html = await ejs.renderFile(
      path.join(__dirname, '../../resources/views/emails/verify-account-email.ejs'),
      { userEmail: user.email, otp: otpCode }
    );

    await email.send({
      to: user.email,
      subject: 'Resend Verification Code',
      html,
    });

    // return Response.showOne(reply, { success: true, message: 'OTP resent successfully' });
    return Response.showOne(reply, {
      success: true,
      message: 'OTP resent successfully',
      data: {
        user,
      },
    });

  } catch (err: any) {
    console.error('❌ resendEmailOtp error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to resend OTP');
  }
};

/**
 * 📩 Resend Password email OTP
 */
export const resendPasswordOtp = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).decoded?._id || (req as any).user?.id;
    const repo = req.server.db.getRepository(User);

    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, 'User not found', 404);

    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    const html = await ejs.renderFile(
      path.join(__dirname, '../../resources/views/emails/forgot-password-email.ejs'),
      {
        resetPasswordCode: otpCode,
        userEmail: user.email
      }
    );

    await email.send({
      to: user.email,
      subject: 'Resend Password Reset Code',
      html,
    });

    // return Response.showOne(reply, { success: true, message: 'OTP resent successfully' });
    return Response.showOne(reply, {
      success: true,
      message: 'OTP resent successfully',
      data: {
        user,
      },
    });
  } catch (err: any) {
    console.error('❌ resendEmailOtp error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to resend OTP');
  }
};

/**
 * � Forget / Reset Password - send reset code
 */
export const forgetPassword = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userEmail } = req.body as any;
    if (!userEmail) return Response.errorResponse(reply, 'Email is required', 400);

    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ email: userEmail });
    console.log("Forget password request for email:", user);
    if (!user) return Response.errorResponse(reply, 'User not found', 404);

    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5 Digit OTP

    const html = await ejs.renderFile(
      path.join(__dirname, '../../resources/views/emails/forgot-password-email.ejs'),
      {
        resetPasswordCode: resetCode,
        userEmail: user.email
      }
    );


    try {
      await email.send({
        to: user.email,
        subject: 'Forget Password?',
        html,
      });
    } catch (mailErr: any) {
      console.error('❌ forgetPassword email send failed:', mailErr?.message || mailErr);
    }

    return Response.showOne(reply, { success: true, message: 'Reset code sent', data: { user } });
  } catch (err: any) {
    console.error('❌ forgetPassword error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};

/**
 * �📱 Send phone OTP
 */
export const sendOtp = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { phone } = req.body as any;
    const userId = (req as any).decoded?._id || (req as any).user?.id;
    if (!phone) return Response.errorResponse(reply, 'Phone number is required', 400);
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    if (!e164Regex.test(phone)) {
      return Response.errorResponse(
        reply,
        'Invalid phone number format. Use E.164 format, e.g. +15551234567',
        400
      );
    }
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return Response.errorResponse(reply, 'User not found', 404);

    console.log("Updating user phone number:", phone);
    await repo.update(user.id, { phone });

    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const messageBody = `Your verification code is: ${otpCode}. It expires in 5 minutes.`;

    await sendSms(phone, messageBody); // implement Twilio or other service here

    return Response.showOne(reply, { success: true, message: 'OTP sent successfully', data: { user } });
  } catch (err: any) {
    console.error('❌ sendOtp error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};

/**
 * ✅ Verify OTP (phone verification)
 */
export const verifyOtp = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { otp, type } = req.body as any;
    if (!otp) return Response.errorResponse(reply, 'OTP is required', 400);
    if (!otp.length || otp.length !== 5) return Response.errorResponse(reply, 'OTP must be 5 digits', 400);
    // const userId = (req as any).decoded?._id || (req as any).user?.id;

    const repo = req.server.db.getRepository(User);

    const user = await repo.findOneBy({ id: (req as any).user?.id });
    if (!user) return Response.errorResponse(reply, 'User not found', 404);

    if (type === 'email') {
      user.isEmailVerified = true;
    } else if (type === 'phone') {
      user.isPhoneVerified = true;

    } else if (type === 'password_reset') {
      // Handle password reset verification if needed
      return Response.showOne(reply, { success: true, message: 'Password reset OTP verified successfully' });
    } else {
      return Response.errorResponse(reply, 'Invalid verification type', 400);
    }

    if (user.isEmailVerified && user.isPhoneVerified) {
      user.isVerified = true;
    }

    await repo.save(user);

    const userRecord: any = await repo.findOneBy({ id: (req as any).user?.id });

    // return Response.showOne(reply, {
    //   success: true,
    //   message:
    //     type === 'email'
    //       ? 'Email verified successfully'
    //       : 'Phone verified successfully',
    // });
    return Response.showOne(reply, {
      success: true,
      message: type === 'email' ? 'Email verified successfully' : 'Phone verified successfully',
      data: {
        user: userRecord,
      },
    });

  } catch (err: any) {
    console.error('❌ verifyOtp error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};

/**
 * 🔁 Resend phone OTP
 */
export const resendOtp = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).decoded?._id || (req as any).user?.id;
    const repo = req.server.db.getRepository(User);

    const user = await repo.findOneBy({ id: userId });

    if (!user) return Response.errorResponse(reply, 'User not found', 404);
    if (!user.phone)
      return Response.errorResponse(
        reply,
        'Phone number not found. Please add your phone number first.',
        400
      );

    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    const messageBody = `Your new verification code is: ${otpCode}. It expires in 5 minutes.`;

    await sendSms(user.phone, messageBody);

    return Response.showOne(reply, { success: true, message: 'OTP resent successfully', data: { user } });
  } catch (err: any) {
    console.error('❌ resendOtp error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};



/**
 * 🔑 Reset Password with verification code
 */
export const resetPasswordWithCode = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, code, newPassword } = req.body as any;
    if (!email || !code || !newPassword) {
      return Response.errorResponse(reply, 'All fields are required', 400);
    }

    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ email });
    if (!user) return Response.errorResponse(reply, 'User not found', 404);             

    return Response.showOne(reply, {
      success: true,
      message: 'Password reset successfully',
      data: { user }
    });
  } catch (err: any) {
    console.error('❌ resetPasswordWithCode error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};

/**
 * 👥 Get all partner users (ERPS Admin only)
 */
export const getPartnerUsers = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const currentUser = (req as any).user;
    
    if (currentUser.role !== 'ERPS_ADMIN') {
      return Response.errorResponse(reply, 'Only ERPS Admin can view all partner users', 403);
    }

    const repo = req.server.db.getRepository(User);
    const partnerUsers = await repo.find({
      where: { role: 'PARTNER_USER', isDeleted: false },
      select: [
        'id', 'email', 'fullName', 'phone', 'mobileNumber', 'partnerRole', 
        'partnerAccountId', 'isAccreditedInstaller', 'isAuthorisedInspector',
        'installerCertificationNumber', 'inspectorCertificationNumber',
        'isVerified', 'isBlocked', 'created'
      ]
    });

    return Response.showAll(reply, partnerUsers);
  } catch (err: any) {
    console.error('❌ getPartnerUsers error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve partner users');
  }
};

/**
 * 👥 Get all installers (ERPS Admin only)
 */
export const getInstallers = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const currentUser = (req as any).user;
    
    if (currentUser.role !== 'ERPS_ADMIN') {
      return Response.errorResponse(reply, 'Only ERPS Admin can view all installers', 403);
    }

    const repo = req.server.db.getRepository(User);
    const installers = await repo.find({
      where: { 
        role: 'PARTNER_USER', 
        partnerRole: 'ACCOUNT_INSTALLER',
        isDeleted: false 
      },
      select: [
        'id', 'email', 'fullName', 'phone', 'mobileNumber', 'partnerAccountId',
        'isAccreditedInstaller', 'isAuthorisedInspector',
        'installerCertificationNumber', 'inspectorCertificationNumber',
        'installerCertificationDate', 'inspectorCertificationDate',
        'isVerified', 'isBlocked', 'created'
      ]
    });

    return Response.showAll(reply, installers);
  } catch (err: any) {
    console.error('❌ getInstallers error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve installers');
  }
};

/**
 * 🔐 ERPS Admin login as partner user
 */
export const adminLoginAs = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { targetUserId } = req.body as any;
    const adminUser = (req as any).user;

    if (!targetUserId) {
      return Response.errorResponse(reply, 'Target user ID is required', 400);
    }

    // Verify the current user is an ERPS admin
    if (adminUser.role !== 'ERPS_ADMIN') {
      return Response.errorResponse(reply, 'Only ERPS Admin can login as other users', 403);
    }

    const repo = req.server.db.getRepository(User);
    const targetUser = await repo.findOneBy({ 
      id: targetUserId, 
      isDeleted: false 
    });

    if (!targetUser) {
      return Response.errorResponse(reply, 'Target user not found', 404);
    }

    // Only allow login as partner users
    if (targetUser.role !== 'PARTNER_USER') {
      return Response.errorResponse(reply, 'Can only login as partner users', 400);
    }

    if (targetUser.isBlocked) {
      return Response.errorResponse(reply, 'Target user is blocked', 400);
    }

    // Generate token for the target user
    const token = req.server.jwt.sign({ 
      id: targetUser.id, 
      email: targetUser.email, 
      role: targetUser.role,
      partnerRole: targetUser.partnerRole,
      partnerAccountId: targetUser.partnerAccountId,
      adminLoginAs: true, // Flag to indicate this is an admin login
      originalAdminId: adminUser.id
    });

    return Response.showOne(reply, {
      success: true,
      message: `Successfully logged in as ${targetUser.partnerRole?.toLowerCase() || 'partner user'}`,
      data: {
        ...targetUser,
        token,
        adminLoginAs: true,
        originalAdmin: {
          id: adminUser.id,
          email: adminUser.email
        }
      },
    });
  } catch (err: any) {
    console.error('❌ adminLoginAs error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to login as user');
  }
};

/**
 * 👤 Get Current User (authenticated)
 */
export const getCurrentUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return Response.errorResponse(reply, 'User not authenticated', 401);
    }

    const repo = req.server.db.getRepository(User);
    const user = await repo.findOne({
      where: { id: userId, isDeleted: false },
      select: [
        'id', 'email', 'fullName', 'dob', 'phone', 'mobileNumber',
        'role', 'partnerRole', 'partnerAccountId', 'isVerified', 
        'isEmailVerified', 'isPhoneVerified', 'isBlocked', 'accountStatus',
        'isAccreditedInstaller', 'isAuthorisedInspector',
        'installerCertificationNumber', 'inspectorCertificationNumber',
        'installerCertificationDate', 'inspectorCertificationDate',
        'languagePreference', 'isAllowedNotification', 'created', 'modified'
      ]
    });

    if (!user) {
      return Response.errorResponse(reply, 'User not found', 404);
    }

    if (user.isBlocked) {
      return Response.errorResponse(reply, 'User account is blocked', 403);
    }

    return Response.showOne(reply, {
      success: true,
      message: 'Current user retrieved successfully',
      data: {
        user: {
          ...user,
          // Don't include sensitive information
          password: undefined
        }
      }
    });
  } catch (err: any) {
    console.error('❌ getCurrentUser error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve current user');
  }
};

/**
 * 🔒 Change Password (authenticated)
 */
export const changePassword = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { currentPassword, newPassword } = req.body as any;
    if (!currentPassword || !newPassword) {
      return Response.errorResponse(reply, 'Current and new password are required', 400);
    }

    const userId = (req as any).user?.id;
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId });

    if (!user) return Response.errorResponse(reply, 'User not found', 404);

    const validPassword = await bcrypt.compare(currentPassword, user.password || '');
    if (!validPassword) {
      return Response.errorResponse(reply, 'Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await repo.update(user.id, { password: hashedPassword });

    return Response.showOne(reply, {
      success: true,
      message: 'Password changed successfully',
      data: { user }
    });
  } catch (err: any) {
    console.error('❌ changePassword error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};