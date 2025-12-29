import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { customerActivationController } from '../controllers/customer-activation-controller.js';
import {
  SuccessResponse,
  ErrorResponse,
} from '../schemas/responseSchemas.js';

/**
 * Customer Warranty Activation Routes
 * These are PUBLIC endpoints (no authentication required)
 * Accessed via activation token sent to customer email/SMS
 */
export default async function customerActivationRoutes(fastify: FastifyInstance) {
  
  /**
   * Get warranty activation details
   * Public endpoint - accessed via activation token
   */
  fastify.get('/activate/:token', {
    schema: {
      params: Type.Object({
        token: Type.String({ description: 'Activation token from email/SMS' })
      }),
      response: {
        200: SuccessResponse(Type.Object({
          alreadyActivated: Type.Boolean(),
          warranty: Type.Object({
            id: Type.String(),
            customerName: Type.String(),
            companyName: Type.Optional(Type.String()),
            vehicle: Type.String(),
            vinNumber: Type.String(),
            registrationNumber: Type.Optional(Type.String()),
            installationDate: Type.Optional(Type.String()),
            installerName: Type.Optional(Type.String()),
            generatorSerialNumber: Type.Optional(Type.String()),
            status: Type.String(),
            activatedAt: Type.Optional(Type.String())
          }),
          tokenExpiresAt: Type.Optional(Type.String())
        })),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['Customer - Warranty Activation'],
      summary: 'Get warranty activation details',
      description: 'Get warranty details for customer activation page. Public endpoint accessed via token.',
    },
    handler: customerActivationController.getActivationDetails.bind(customerActivationController)
  });

  /**
   * Get warranty terms and conditions
   * Public endpoint
   */
  fastify.get('/activate/:token/terms', {
    schema: {
      params: Type.Object({
        token: Type.String({ description: 'Activation token from email/SMS' })
      }),
      response: {
        200: SuccessResponse(Type.Object({
          warrantyId: Type.String(),
          terms: Type.Object({
            warrantyName: Type.String(),
            description: Type.Optional(Type.String()),
            termsAndConditions: Type.String(),
            revision: Type.String()
          })
        })),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['Customer - Warranty Activation'],
      summary: 'Get warranty terms and conditions',
      description: 'Get warranty terms for customer to review before accepting. Public endpoint.',
    },
    handler: customerActivationController.getWarrantyTerms.bind(customerActivationController)
  });

  /**
   * Accept terms and activate warranty
   * Public endpoint - customer accepts terms to activate warranty
   */
  fastify.post('/activate/:token/accept', {
    schema: {
      params: Type.Object({
        token: Type.String({ description: 'Activation token from email/SMS' })
      }),
      body: Type.Object({
        acceptTerms: Type.Boolean({ description: 'Must be true to activate warranty' }),
        customerSignature: Type.Optional(Type.String({ description: 'Optional digital signature' }))
      }),
      response: {
        200: SuccessResponse(Type.Object({
          warranty: Type.Object({
            id: Type.String(),
            customerName: Type.String(),
            vehicle: Type.String(),
            vinNumber: Type.String(),
            status: Type.String(),
            isActive: Type.Boolean(),
            activatedAt: Type.String(),
            inspectionDueDate: Type.String()
          }),
          nextSteps: Type.Object({
            message: Type.String(),
            inspectionDueDate: Type.String(),
            reminderNote: Type.String()
          })
        })),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['Customer - Warranty Activation'],
      summary: 'Accept terms and activate warranty',
      description: 'Customer accepts warranty terms to complete activation. Public endpoint.',
    },
    handler: customerActivationController.acceptTermsAndActivate.bind(customerActivationController)
  });

  /**
   * Resend activation email (authenticated - Admin or Partner Admin)
   */
  fastify.post('/warranties/:warrantyId/resend-activation', {
    onRequest: [fastify.authenticate],
    schema: {
      params: Type.Object({
        warrantyId: Type.String({ format: 'uuid', description: 'Warranty ID' })
      }),
      response: {
        200: SuccessResponse(Type.Object({
          warrantyId: Type.String(),
          sentTo: Type.Object({
            email: Type.String(),
            phone: Type.String()
          }),
          tokenExpiresAt: Type.String()
        })),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['Customer - Warranty Activation'],
      summary: 'Resend activation email to customer',
      description: 'Resend warranty activation email and SMS to customer. Requires authentication.',
      security: [{ bearerAuth: [] }],
    },
    handler: customerActivationController.resendActivationEmail.bind(customerActivationController)
  });
}
