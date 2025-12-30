import {
  getVerificationDetails,
  processWarrantyVerification,
  processInspectionVerification,
  resendVerificationSMS,
  getInstallerVerificationHistory,
} from '../controllers/verification-controller.js';
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  SuccessResponse,
  ErrorResponse,
  MessageResponse,
} from '../schemas/responseSchemas.js';

// Request body schemas
const VerificationActionBody = Type.Object({
  action: Type.Union([
    Type.Literal('CONFIRM'),
    Type.Literal('DECLINE'),
  ], { description: 'Action to take: CONFIRM or DECLINE' }),
  declineReason: Type.Optional(Type.String({ 
    description: 'Required when action is DECLINE' 
  })),
});

const ResendSMSBody = Type.Object({
  recordId: Type.String({ description: 'ID of the warranty or inspection record' }),
  recordType: Type.Union([
    Type.Literal('WARRANTY'),
    Type.Literal('INSPECTION'),
  ], { description: 'Type of record: WARRANTY or INSPECTION' }),
});

// Response schemas
const VerificationDetailsData = Type.Object({
  verificationType: Type.String(),
  expiresAt: Type.String(),
  record: Type.Object({}, { additionalProperties: true }),
});

const VerificationResultData = Type.Object({
  recordId: Type.String(),
  status: Type.String(),
});

const VerificationHistoryData = Type.Object({
  installer: Type.Object({
    id: Type.String(),
    fullName: Type.String(),
    email: Type.String(),
    mobileNumber: Type.Optional(Type.String()),
    verificationAttempts: Type.Number(),
    lastVerificationSent: Type.Optional(Type.String()),
  }),
  warranties: Type.Array(Type.Object({}, { additionalProperties: true })),
  inspections: Type.Array(Type.Object({}, { additionalProperties: true })),
});

export default async function verificationRoutes(fastify: FastifyInstance) {
  
  // Public verification endpoints (no authentication required)
  fastify.get(
    '/:token',
    {
      schema: {
        params: Type.Object({
          token: Type.String({ description: 'Verification token from SMS' }),
        }),
        response: {
          200: SuccessResponse(VerificationDetailsData),
          404: ErrorResponse,
        },
        tags: ['Verification'],
        summary: 'Get verification details (public)',
        description: 'Get details for a verification token. Used by installers clicking SMS links.',
      },
    },
    getVerificationDetails
  );

  fastify.post(
    '/warranty/:token',
    {
      schema: {
        params: Type.Object({
          token: Type.String({ description: 'Verification token from SMS' }),
        }),
        body: VerificationActionBody,
        response: {
          200: SuccessResponse(VerificationResultData),
          400: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Verification'],
        summary: 'Process warranty verification (public)',
        description: 'Confirm or decline warranty verification. Used by installers via SMS links.',
      },
    },
    processWarrantyVerification
  );

  fastify.post(
    '/inspection/:token',
    {
      schema: {
        params: Type.Object({
          token: Type.String({ description: 'Verification token from SMS' }),
        }),
        body: VerificationActionBody,
        response: {
          200: SuccessResponse(VerificationResultData),
          400: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Verification'],
        summary: 'Process inspection verification (public)',
        description: 'Confirm or decline inspection verification. Used by inspectors via SMS links.',
      },
    },
    processInspectionVerification
  );

  // ERPS Admin only endpoints
  fastify.post(
    '/resend',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: ResendSMSBody,
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Verification', 'Admin'],
        summary: 'Resend verification SMS (ERPS Admin only)',
        description: 'Resend verification SMS to installer. Only accessible by ERPS Admin.',
        security: [{ bearerAuth: [] }],
      },
    },
    resendVerificationSMS as any
  );

  fastify.get(
    '/history/:installerId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          installerId: Type.String({ description: 'ID of the installer' }),
        }),
        response: {
          200: SuccessResponse(VerificationHistoryData),
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Verification', 'Admin'],
        summary: 'Get installer verification history (ERPS Admin only)',
        description: 'Get complete verification history for an installer. Only accessible by ERPS Admin.',
        security: [{ bearerAuth: [] }],
      },
    },
    getInstallerVerificationHistory as any
  );
}