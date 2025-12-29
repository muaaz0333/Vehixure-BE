import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { erpsAdminController } from '../controllers/erps-admin-controller.js';
import {
  SuccessResponse,
  ErrorResponse,
  MessageResponse,
} from '../schemas/responseSchemas.js';

export default async function erpsAdminRoutes(fastify: FastifyInstance) {
  
  // ===== WARRANTY OVERRIDE ROUTES =====
  
  /**
   * Manual warranty verification by ERPS Admin
   * Used when installer has left organization before verifying
   */
  fastify.post('/warranties/:warrantyId/verify', {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      params: Type.Object({
        warrantyId: Type.String({ format: 'uuid', description: 'Warranty ID to verify' })
      }),
      body: Type.Object({
        reason: Type.String({ description: 'Reason for manual override (required for audit trail)' }),
        notes: Type.Optional(Type.String({ description: 'Additional notes' })),
        skipCustomerNotification: Type.Optional(Type.Boolean({ 
          description: 'Skip customer notification and activate immediately (default: false)' 
        }))
      }),
      response: {
        200: SuccessResponse(Type.Any()),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['ERPS Admin - Overrides'],
      summary: 'Manual warranty verification (Admin Override)',
      description: 'Manually verify a warranty when installer is unavailable. Creates audit trail entry marked as ADMIN_OVERRIDE.',
      security: [{ bearerAuth: [] }],
    },
    handler: erpsAdminController.adminVerifyWarranty.bind(erpsAdminController)
  });

  /**
   * Manual warranty activation by ERPS Admin
   * Skip customer terms acceptance
   */
  fastify.post('/warranties/:warrantyId/activate', {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      params: Type.Object({
        warrantyId: Type.String({ format: 'uuid', description: 'Warranty ID to activate' })
      }),
      body: Type.Object({
        reason: Type.String({ description: 'Reason for manual activation (required for audit trail)' }),
        notes: Type.Optional(Type.String({ description: 'Additional notes' }))
      }),
      response: {
        200: SuccessResponse(Type.Any()),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['ERPS Admin - Overrides'],
      summary: 'Manual warranty activation (Admin Override)',
      description: 'Manually activate a warranty, skipping customer terms acceptance. Creates audit trail entry.',
      security: [{ bearerAuth: [] }],
    },
    handler: erpsAdminController.adminActivateWarranty.bind(erpsAdminController)
  });

  /**
   * Manual inspection verification by ERPS Admin
   */
  fastify.post('/inspections/:inspectionId/verify', {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      params: Type.Object({
        inspectionId: Type.String({ format: 'uuid', description: 'Inspection ID to verify' })
      }),
      body: Type.Object({
        reason: Type.String({ description: 'Reason for manual override (required for audit trail)' }),
        notes: Type.Optional(Type.String({ description: 'Additional notes' }))
      }),
      response: {
        200: SuccessResponse(Type.Any()),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['ERPS Admin - Overrides'],
      summary: 'Manual inspection verification (Admin Override)',
      description: 'Manually verify an inspection when inspector is unavailable. Creates audit trail entry marked as ADMIN_OVERRIDE.',
      security: [{ bearerAuth: [] }],
    },
    handler: erpsAdminController.adminVerifyInspection.bind(erpsAdminController)
  });

  // ===== USER ROLE MANAGEMENT ROUTES =====

  /**
   * Update user role (change partnerRole, account status, etc.)
   */
  fastify.put('/users/:userId/role', {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      params: Type.Object({
        userId: Type.String({ format: 'uuid', description: 'User ID to update' })
      }),
      body: Type.Object({
        partnerRole: Type.Optional(Type.Union([
          Type.Literal('ACCOUNT_ADMIN'),
          Type.Literal('ACCOUNT_STAFF'),
          Type.Literal('ACCOUNT_INSTALLER')
        ], { description: 'New partner role' })),
        partnerAccountId: Type.Optional(Type.String({ 
          format: 'uuid', 
          description: 'New partner account ID (to reassign user)' 
        })),
        accountStatus: Type.Optional(Type.Union([
          Type.Literal('Active'),
          Type.Literal('InActive')
        ], { description: 'Account status' })),
        isAccreditedInstaller: Type.Optional(Type.Boolean({ 
          description: 'Is accredited installer' 
        })),
        isAuthorisedInspector: Type.Optional(Type.Boolean({ 
          description: 'Is authorised inspector' 
        })),
        mobileNumber: Type.Optional(Type.String({ 
          description: 'Mobile number (required for ACCOUNT_INSTALLER role)' 
        })),
        reason: Type.String({ description: 'Reason for change (required for audit trail)' })
      }),
      response: {
        200: SuccessResponse(Type.Any()),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['ERPS Admin - User Management'],
      summary: 'Update user role and settings',
      description: 'Change user partnerRole (Staff to Installer, etc.), account status, or reassign to different partner account. All changes are logged in audit trail.',
      security: [{ bearerAuth: [] }],
    },
    handler: erpsAdminController.updateUserRole.bind(erpsAdminController)
  });

  /**
   * Reassign user to different partner account
   */
  fastify.put('/users/:userId/reassign', {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      params: Type.Object({
        userId: Type.String({ format: 'uuid', description: 'User ID to reassign' })
      }),
      body: Type.Object({
        newPartnerAccountId: Type.String({ 
          format: 'uuid', 
          description: 'New partner account ID' 
        }),
        reason: Type.String({ description: 'Reason for reassignment (required for audit trail)' })
      }),
      response: {
        200: SuccessResponse(Type.Any()),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['ERPS Admin - User Management'],
      summary: 'Reassign user to different partner account',
      description: 'Move a user from one partner account to another. Logged in audit trail.',
      security: [{ bearerAuth: [] }],
    },
    handler: erpsAdminController.reassignUserAccount.bind(erpsAdminController)
  });

  // ===== AUDIT HISTORY ROUTES =====

  /**
   * Get warranty audit history
   */
  fastify.get('/warranties/:warrantyId/audit-history', {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      params: Type.Object({
        warrantyId: Type.String({ format: 'uuid', description: 'Warranty ID' })
      }),
      response: {
        200: SuccessResponse(Type.Any()),
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['ERPS Admin - Audit'],
      summary: 'Get warranty audit history',
      description: 'Get complete audit history for a warranty. Only visible to ERPS Admin.',
      security: [{ bearerAuth: [] }],
    },
    handler: erpsAdminController.getWarrantyAuditHistory.bind(erpsAdminController)
  });

  /**
   * Get inspection audit history
   */
  fastify.get('/inspections/:inspectionId/audit-history', {
    onRequest: [fastify.authenticateAdmin],
    schema: {
      params: Type.Object({
        inspectionId: Type.String({ format: 'uuid', description: 'Inspection ID' })
      }),
      response: {
        200: SuccessResponse(Type.Any()),
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ['ERPS Admin - Audit'],
      summary: 'Get inspection audit history',
      description: 'Get complete audit history for an inspection. Only visible to ERPS Admin.',
      security: [{ bearerAuth: [] }],
    },
    handler: erpsAdminController.getInspectionAuditHistory.bind(erpsAdminController)
  });
}
