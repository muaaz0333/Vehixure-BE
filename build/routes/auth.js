import {
  register,
  login,
  resendEmailOtp,
  sendOtp,
  verifyOtp,
  resendOtp,
  forgetPassword,
  resetPasswordWithCode,
  changePassword,
  resendPasswordOtp,
  getPartnerUsers,
  getInstallers,
  adminLoginAs,
  getCurrentUser
} from "../controllers/auth-controller.js";
import { Type } from "@sinclair/typebox";
import {
  SuccessResponse,
  ErrorResponse,
  MessageResponse
} from "../schemas/responseSchemas.js";
const AuthRegisterBody = Type.Object({
  fullName: Type.String({ description: "Full name of the user" }),
  dob: Type.String({ format: "date", description: "Date of birth (YYYY-MM-DD)" }),
  userEmail: Type.String({ format: "email", description: "Email address of the user" }),
  password: Type.String({ minLength: 6, description: "Password (minimum 6 characters)" })
});
const AuthLoginBody = Type.Object({
  email: Type.String({ format: "email", description: "Registered email address" }),
  password: Type.String({ description: "Account password" })
});
const SendOtpBody = Type.Object({
  phone: Type.String({
    description: "Phone number in E.164 format (e.g. +15551234567)"
  })
});
const VerifyOtpBody = Type.Object({
  type: Type.Union([
    Type.Literal("email"),
    Type.Literal("phone"),
    Type.Literal("password_reset")
  ], { description: "Type of OTP verification (email or phone or password_reset)" }),
  otp: Type.String({
    minLength: 5,
    maxLength: 5,
    description: "5 digit OTP code"
  })
});
const ForgetPasswordBody = Type.Object({
  userEmail: Type.String({ format: "email", description: "Registered email address" })
});
const ResetPasswordWithCodeBody = Type.Object({
  email: Type.String({ format: "email", description: "Registered email address" }),
  code: Type.String({ minLength: 5, maxLength: 5, description: "6-digit reset code" }),
  newPassword: Type.String({ description: "New password (minimum 6 characters)" })
});
const ChangePasswordBody = Type.Object({
  currentPassword: Type.String({ description: "Current account password" }),
  newPassword: Type.String({ minLength: 6, description: "New password (minimum 6 characters)" })
});
const AdminLoginAsBody = Type.Object({
  targetUserId: Type.String({ description: "ID of the agent or inspector to login as" })
});
const FirebaseSignInBody = Type.Object({
  googleToken: Type.String({
    description: "Firebase ID token obtained from client-side Firebase Google Sign-In"
  })
});
const UserData = Type.Object(
  {
    id: Type.String(),
    fullName: Type.String(),
    email: Type.String({ format: "email" }),
    role: Type.Optional(Type.String()),
    token: Type.String()
  },
  { additionalProperties: true }
);
const UserListData = Type.Array(Type.Object(
  {
    id: Type.String(),
    email: Type.String({ format: "email" }),
    username: Type.Optional(Type.String()),
    fullName: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),
    businessName: Type.Optional(Type.String()),
    contact: Type.Optional(Type.String()),
    streetAddress: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    state: Type.Optional(Type.String()),
    postcode: Type.Optional(Type.String()),
    agentType: Type.Optional(Type.String()),
    buyPrice: Type.Optional(Type.String()),
    accountStatus: Type.Optional(Type.String()),
    isVerified: Type.Boolean(),
    isBlocked: Type.Boolean(),
    created: Type.String()
  },
  { additionalProperties: true }
));
const TokenData = Type.Object({
  token: Type.String()
});
const CurrentUserResponseData = Type.Object({
  user: Type.Object({
    id: Type.String(),
    email: Type.String({ format: "email" }),
    fullName: Type.Optional(Type.String()),
    dob: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),
    mobileNumber: Type.Optional(Type.String()),
    role: Type.String(),
    partnerRole: Type.Optional(Type.String()),
    partnerAccountId: Type.Optional(Type.String()),
    isVerified: Type.Boolean(),
    isEmailVerified: Type.Boolean(),
    isPhoneVerified: Type.Boolean(),
    isBlocked: Type.Boolean(),
    accountStatus: Type.Optional(Type.String()),
    isAccreditedInstaller: Type.Boolean(),
    isAuthorisedInspector: Type.Boolean(),
    installerCertificationNumber: Type.Optional(Type.String()),
    inspectorCertificationNumber: Type.Optional(Type.String()),
    installerCertificationDate: Type.Optional(Type.String()),
    inspectorCertificationDate: Type.Optional(Type.String()),
    languagePreference: Type.String(),
    isAllowedNotification: Type.Boolean(),
    created: Type.String(),
    modified: Type.String()
  })
}, { additionalProperties: true });
export default async function authRoutes(fastify) {
  fastify.post(
    "/register",
    {
      schema: {
        body: AuthRegisterBody,
        response: {
          201: SuccessResponse(UserData),
          400: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Register a new user"
      }
    },
    register
  );
  fastify.post(
    "/verify-otp",
    {
      // onRequest: [fastify.authenticate],
      schema: {
        body: VerifyOtpBody,
        response: {
          200: MessageResponse,
          400: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Verify email or phone OTP",
        description: "Verifies OTP for email or phone depending on the `type: email|phone|password_reset` field provided in request body."
        // security: [{ bearerAuth: [] }],
      }
    },
    verifyOtp
  );
  fastify.post(
    "/resend-email-otp",
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: MessageResponse,
          404: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Resend email verification OTP",
        security: [{ bearerAuth: [] }]
      }
    },
    resendEmailOtp
  );
  fastify.post(
    "/resend-password-otp",
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: MessageResponse,
          404: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Resend OTP to user email for Reset Password"
      }
    },
    resendPasswordOtp
  );
  fastify.post(
    "/send-otp",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: SendOtpBody,
        response: {
          200: MessageResponse,
          404: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Send OTP to user phone",
        security: [{ bearerAuth: [] }]
      }
    },
    sendOtp
  );
  fastify.post(
    "/resend-otp",
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: MessageResponse,
          404: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Resend OTP to user phone",
        security: [{ bearerAuth: [] }]
      }
    },
    resendOtp
  );
  fastify.post(
    "/login",
    {
      schema: {
        body: AuthLoginBody,
        response: {
          200: SuccessResponse(UserData),
          401: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Login and get JWT token"
      }
    },
    login
  );
  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: SuccessResponse(CurrentUserResponseData),
          401: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Get current authenticated user",
        description: "Retrieve the current authenticated user's profile information",
        security: [{ bearerAuth: [] }]
      }
    },
    getCurrentUser
  );
  fastify.post(
    "/forget-password",
    {
      schema: {
        body: ForgetPasswordBody,
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          404: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Send password reset code to user email"
      }
    },
    forgetPassword
  );
  fastify.post(
    "/reset-password",
    {
      schema: {
        body: ResetPasswordWithCodeBody,
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          404: ErrorResponse
        },
        // tags: ['Auth'],
        summary: "Reset password using verification code",
        description: "Reset user password using the 6-digit code sent to their email"
      }
    },
    resetPasswordWithCode
  );
  fastify.post(
    "/change-password",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: ChangePasswordBody,
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          401: ErrorResponse,
          404: ErrorResponse
        },
        tags: ["Auth"],
        summary: "Change password (authenticated)",
        description: "Change password by providing current password and new password. Requires authentication.",
        security: [{ bearerAuth: [] }]
      }
    },
    changePassword
  );
  fastify.get(
    "/admin/partner-users",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(UserListData),
          403: ErrorResponse
        },
        tags: ["Admin"],
        summary: "Get all partner users (ERPS Admin only)",
        description: "Retrieve a list of all partner users in the system. Only accessible by ERPS Admin.",
        security: [{ bearerAuth: [] }]
      }
    },
    getPartnerUsers
  );
  fastify.get(
    "/admin/installers",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(UserListData),
          403: ErrorResponse
        },
        tags: ["Admin"],
        summary: "Get all installers (ERPS Admin only)",
        description: "Retrieve a list of all installers in the system. Only accessible by ERPS Admin.",
        security: [{ bearerAuth: [] }]
      }
    },
    getInstallers
  );
  fastify.post(
    "/admin/login-as",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: AdminLoginAsBody,
        response: {
          200: SuccessResponse(UserData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse
        },
        tags: ["Admin"],
        summary: "Admin login as agent or inspector",
        description: "Allows ERPS Admin to login as any partner user. Returns a token for the target user.",
        security: [{ bearerAuth: [] }]
      }
    },
    adminLoginAs
  );
}
