import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  getPendingReminders,
  processPendingReminders,
  processGracePeriodExpiry,
  getReminderStatistics,
  scheduleWarrantyReminders,
  cancelWarrantyReminders,
  getLapsedWarranties,
  reinstateWarranty,
  checkReinstatementEligibility,
  getWarrantyReinstatementHistory,
  getReinstatementStatistics,
  sendTestReminder
} from '../controllers/reminder-controller.js';
import {
  SuccessResponse,
  ErrorResponse,
  MessageResponse,
} from '../schemas/responseSchemas.js';

// Request body schemas
const ReinstatementBody = Type.Object({
  reason: Type.String({ description: 'Reason for warranty reinstatement' }),
  inspectionId: Type.Optional(Type.String({ description: 'ID of completed inspection (if applicable)' })),
  notes: Type.Optional(Type.String({ description: 'Additional notes for reinstatement' }))
});

const TestReminderBody = Type.Object({
  email: Type.String({ format: 'email', description: 'Email address to send test reminder' })
});

// Response schemas
const ReminderData = Type.Array(Type.Object({
  id: Type.String(),
  warrantyId: Type.String(),
  customerEmail: Type.String(),
  customerName: Type.String(),
  reminderType: Type.String(),
  scheduledDate: Type.String(),
  status: Type.String()
}, { additionalProperties: true }));

const ReminderStatsData = Type.Object({
  totalReminders: Type.Number(),
  pendingReminders: Type.Number(),
  sentReminders: Type.Number(),
  failedReminders: Type.Number()
}, { additionalProperties: true });

const LapsedWarrantyData = Type.Array(Type.Object({
  id: Type.String(),
  make: Type.String(),
  model: Type.String(),
  vinNumber: Type.String(),
  customerName: Type.String(),
  warrantyLapsedAt: Type.String()
}, { additionalProperties: true }));

const ReinstatementData = Type.Object({
  id: Type.String(),
  warrantyId: Type.String(),
  reinstatedBy: Type.String(),
  reinstatementDate: Type.String(),
  reason: Type.String(),
  newExpiryDate: Type.String()
}, { additionalProperties: true });

export default async function reminderRoutes(fastify: FastifyInstance) {
  
  // Reminder Management Endpoints (ERPS Admin only)
  fastify.get(
    '/pending',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(ReminderData),
          403: ErrorResponse,
        },
        tags: ['Reminders', 'Admin'],
        summary: 'Get pending reminders (ERPS Admin only)',
        description: 'Get all reminders that are scheduled to be sent today',
        security: [{ bearerAuth: [] }],
      },
    },
    getPendingReminders
  );

  fastify.post(
    '/process',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Object({
            sent: Type.Number(),
            failed: Type.Number()
          })),
          403: ErrorResponse,
        },
        tags: ['Reminders', 'Admin'],
        summary: 'Process pending reminders (ERPS Admin only)',
        description: 'Manually trigger processing of all pending reminders',
        security: [{ bearerAuth: [] }],
      },
    },
    processPendingReminders
  );

  fastify.post(
    '/grace-period/process',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Object({
            expiredCount: Type.Number()
          })),
          403: ErrorResponse,
        },
        tags: ['Reminders', 'Admin'],
        summary: 'Process grace period expiry (ERPS Admin only)',
        description: 'Process warranties where grace period has expired',
        security: [{ bearerAuth: [] }],
      },
    },
    processGracePeriodExpiry
  );

  fastify.get(
    '/statistics',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(ReminderStatsData),
          403: ErrorResponse,
        },
        tags: ['Reminders', 'Admin'],
        summary: 'Get reminder statistics (ERPS Admin only)',
        description: 'Get comprehensive reminder system statistics',
        security: [{ bearerAuth: [] }],
      },
    },
    getReminderStatistics
  );

  fastify.post(
    '/warranty/:warrantyId/schedule',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyId: Type.String({ description: 'Warranty ID' }),
        }),
        response: {
          200: MessageResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Reminders', 'Admin'],
        summary: 'Schedule reminders for warranty (ERPS Admin only)',
        description: 'Schedule all reminder types for a specific warranty',
        security: [{ bearerAuth: [] }],
      },
    },
    scheduleWarrantyReminders
  );

  fastify.post(
    '/warranty/:warrantyId/cancel',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyId: Type.String({ description: 'Warranty ID' }),
        }),
        response: {
          200: MessageResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Reminders', 'Admin'],
        summary: 'Cancel reminders for warranty (ERPS Admin only)',
        description: 'Cancel all pending reminders for a specific warranty',
        security: [{ bearerAuth: [] }],
      },
    },
    cancelWarrantyReminders
  );

  fastify.post(
    '/test',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: TestReminderBody,
        response: {
          200: MessageResponse,
          403: ErrorResponse,
        },
        tags: ['Reminders', 'Admin'],
        summary: 'Send test reminder email (ERPS Admin only)',
        description: 'Send a test reminder email to verify email service functionality',
        security: [{ bearerAuth: [] }],
      },
    },
    sendTestReminder
  );

  // Warranty Reinstatement Endpoints (ERPS Admin only)
  fastify.get(
    '/lapsed-warranties',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(LapsedWarrantyData),
          403: ErrorResponse,
        },
        tags: ['Warranty Reinstatement', 'Admin'],
        summary: 'Get lapsed warranties (ERPS Admin only)',
        description: 'Get all warranties that have lapsed and are eligible for reinstatement',
        security: [{ bearerAuth: [] }],
      },
    },
    getLapsedWarranties
  );

  fastify.post(
    '/warranty/:warrantyId/reinstate',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyId: Type.String({ description: 'Warranty ID' }),
        }),
        body: ReinstatementBody,
        response: {
          200: SuccessResponse(ReinstatementData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Warranty Reinstatement', 'Admin'],
        summary: 'Reinstate lapsed warranty (ERPS Admin only)',
        description: 'Reinstate a lapsed warranty and re-enter customer into reminder cycle',
        security: [{ bearerAuth: [] }],
      },
    },
    reinstateWarranty
  );

  fastify.get(
    '/warranty/:warrantyId/reinstatement-eligibility',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyId: Type.String({ description: 'Warranty ID' }),
        }),
        response: {
          200: SuccessResponse(Type.Object({
            eligible: Type.Boolean(),
            reason: Type.String(),
            hasCompletedInspection: Type.Boolean()
          }, { additionalProperties: true })),
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Warranty Reinstatement', 'Admin'],
        summary: 'Check reinstatement eligibility (ERPS Admin only)',
        description: 'Check if a warranty is eligible for reinstatement',
        security: [{ bearerAuth: [] }],
      },
    },
    checkReinstatementEligibility
  );

  fastify.get(
    '/warranty/:warrantyId/reinstatement-history',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyId: Type.String({ description: 'Warranty ID' }),
        }),
        response: {
          200: SuccessResponse(Type.Array(ReinstatementData)),
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Warranty Reinstatement', 'Admin'],
        summary: 'Get reinstatement history (ERPS Admin only)',
        description: 'Get complete reinstatement history for a warranty',
        security: [{ bearerAuth: [] }],
      },
    },
    getWarrantyReinstatementHistory
  );

  fastify.get(
    '/reinstatement-statistics',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Object({
            totalLapsedWarranties: Type.Number(),
            totalReinstatedWarranties: Type.Number(),
            eligibleForReinstatement: Type.Number()
          }, { additionalProperties: true })),
          403: ErrorResponse,
        },
        tags: ['Warranty Reinstatement', 'Admin'],
        summary: 'Get reinstatement statistics (ERPS Admin only)',
        description: 'Get comprehensive warranty reinstatement statistics',
        security: [{ bearerAuth: [] }],
      },
    },
    getReinstatementStatistics
  );
}