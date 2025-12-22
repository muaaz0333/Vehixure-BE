import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../entities/User.js';
import path from 'path';
import ejs from 'ejs';
import bcrypt from 'bcryptjs';
import email from '../Traits/SendEmail.js';
import { fileURLToPath } from 'url';
import Response from '../Traits/ApiResponser.js';
import sendSms from '../../utils/twilioService.js'; // optional if you have SMS integration

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
  const user = repo.create({ email: userEmail, password: hashed, fullName, dob });
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
      subject: 'Verify Your Papero Account',
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
  const token = req.server.jwt.sign({ id: user.id, email: user.email, role: user.role });
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
      subject: 'Resend Verification Code - Papero',
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
      subject: 'Resend Password Reset Code - Papero',
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
    const messageBody = `Your Papero verification code is: ${otpCode}. It expires in 5 minutes.`;

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

    const messageBody = `Your new Papero verification code is: ${otpCode}. It expires in 5 minutes.`;

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
