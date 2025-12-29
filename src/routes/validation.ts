import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  getPhotoCategories,
  validateWarrantyPhotos,
  validateInspectionPhotos,
  validateCorrosionRequirements,
  updatePhotoCategory,
  validatePhotoUpload,
  updatePhotoValidationStatus,
  createInspectionChecklist,
  getInspectionChecklist,
  updateChecklistItem,
  validateInspectionChecklist,
  getChecklistTemplate,
  getSubmissionHistory,
  getSubmissionVersion,
  getAuditTrail,
  getValidationSummary,
  getRejectedSubmissions,
  getIncompleteChecklists
} from '../controllers/validation-controller.js';
import {
  SuccessResponse,
  ErrorResponse,
  MessageResponse,
} from '../schemas/responseSchemas.js';

// Request body schemas
const PhotoCategoryUpdateBody = Type.Object({
  category: Type.String({ description: 'Photo category code' })
});

const PhotoUploadValidationBody = Type.Object({
  photoCount: Type.Number({ description: 'Number of photos to upload' })
});

const PhotoValidationStatusBody = Type.Object({
  status: Type.Union([
    Type.Literal('APPROVED'),
    Type.Literal('REJECTED')
  ], { description: 'Validation status' }),
  notes: Type.Optional(Type.String({ description: 'Validation notes' }))
});

const ChecklistItemUpdateBody = Type.Object({
  conditionStatus: Type.Union([
    Type.Literal('PASS'),
    Type.Literal('ISSUE_OBSERVED')
  ], { description: 'Condition status' }),
  notes: Type.Optional(Type.String({ description: 'Notes (required if issue observed)' }))
});

// Response schemas
const PhotoCategoryData = Type.Array(Type.Object({
  id: Type.String(),
  categoryCode: Type.String(),
  categoryName: Type.String(),
  description: Type.String(),
  recordType: Type.String(),
  isMandatory: Type.Boolean(),
  minPhotos: Type.Number(),
  maxPhotos: Type.Number()
}, { additionalProperties: true }));

const PhotoValidationData = Type.Object({
  isValid: Type.Boolean(),
  missingCategories: Type.Array(Type.String()),
  validationMessage: Type.String(),
  categoryValidation: Type.Object({}, { additionalProperties: true })
});

const CorrosionValidationData = Type.Object({
  isValid: Type.Boolean(),
  corrosionFound: Type.Boolean(),
  notesRequired: Type.Boolean(),
  notesProvided: Type.Boolean(),
  photosRequired: Type.Boolean(),
  photosProvided: Type.Boolean(),
  validationMessage: Type.String()
});

const ChecklistItemData = Type.Object({
  id: Type.String(),
  inspectionId: Type.String(),
  itemCode: Type.String(),
  itemName: Type.String(),
  conditionStatus: Type.String(),
  notes: Type.Optional(Type.String()),
  isNotesRequired: Type.Boolean(),
  notesProvided: Type.Boolean(),
  validationComplete: Type.Boolean()
});

const ChecklistValidationData = Type.Object({
  isComplete: Type.Boolean(),
  incompleteItems: Type.Array(Type.String()),
  validationMessage: Type.String(),
  totalItems: Type.Number(),
  completedItems: Type.Number(),
  itemsWithIssues: Type.Number()
});

const SubmissionHistoryData = Type.Array(Type.Object({
  version: Type.Number(),
  submittedBy: Type.String(),
  submittedAt: Type.String(),
  status: Type.String(),
  data: Type.Object({}, { additionalProperties: true })
}, { additionalProperties: true }));

export default async function validationRoutes(fastify: FastifyInstance) {
  
  // Photo Validation Endpoints
  fastify.get(
    '/photo-categories/:recordType',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
        }),
        response: {
          200: SuccessResponse(PhotoCategoryData),
          401: ErrorResponse,
        },
        tags: ['Validation', 'Photos'],
        summary: 'Get photo categories for record type',
        description: 'Get all photo categories and requirements for warranty or inspection records',
        security: [{ bearerAuth: [] }],
      },
    },
    getPhotoCategories
  );

  fastify.get(
    '/warranty/:warrantyId/photos',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          warrantyId: Type.String({ description: 'Warranty ID' }),
        }),
        response: {
          200: SuccessResponse(PhotoValidationData),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Photos'],
        summary: 'Validate warranty photos',
        description: 'Validate that all required photo categories are provided for warranty',
        security: [{ bearerAuth: [] }],
      },
    },
    validateWarrantyPhotos
  );

  fastify.get(
    '/inspection/:inspectionId/photos',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          inspectionId: Type.String({ description: 'Inspection ID' }),
        }),
        response: {
          200: SuccessResponse(PhotoValidationData),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Photos'],
        summary: 'Validate inspection photos',
        description: 'Validate that all required photo categories are provided for inspection',
        security: [{ bearerAuth: [] }],
      },
    },
    validateInspectionPhotos
  );

  fastify.get(
    '/corrosion/:recordType/:recordId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
          recordId: Type.String({ description: 'Record ID' }),
        }),
        response: {
          200: SuccessResponse(CorrosionValidationData),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Corrosion'],
        summary: 'Validate corrosion requirements',
        description: 'Validate that corrosion documentation requirements are met',
        security: [{ bearerAuth: [] }],
      },
    },
    validateCorrosionRequirements
  );

  fastify.put(
    '/photo/:recordType/:photoId/category',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
          photoId: Type.String({ description: 'Photo ID' }),
        }),
        body: PhotoCategoryUpdateBody,
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          401: ErrorResponse,
        },
        tags: ['Validation', 'Photos'],
        summary: 'Update photo category',
        description: 'Update the category classification for a photo',
        security: [{ bearerAuth: [] }],
      },
    },
    updatePhotoCategory
  );

  fastify.post(
    '/photo-upload/:recordType/:recordId/:category/validate',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
          recordId: Type.String({ description: 'Record ID' }),
          category: Type.String({ description: 'Photo category' }),
        }),
        body: PhotoUploadValidationBody,
        response: {
          200: SuccessResponse(Type.Object({
            valid: Type.Boolean(),
            message: Type.String(),
            currentCount: Type.Number(),
            maxAllowed: Type.Number()
          })),
          401: ErrorResponse,
        },
        tags: ['Validation', 'Photos'],
        summary: 'Validate photo upload',
        description: 'Validate if photo upload is allowed for category',
        security: [{ bearerAuth: [] }],
      },
    },
    validatePhotoUpload
  );

  fastify.put(
    '/photo/:recordType/:photoId/validation-status',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
          photoId: Type.String({ description: 'Photo ID' }),
        }),
        body: PhotoValidationStatusBody,
        response: {
          200: MessageResponse,
          401: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Validation', 'Photos', 'Admin'],
        summary: 'Update photo validation status (ERPS Admin only)',
        description: 'Approve or reject photo validation',
        security: [{ bearerAuth: [] }],
      },
    },
    updatePhotoValidationStatus
  );

  // Inspection Checklist Endpoints
  fastify.post(
    '/inspection/:inspectionId/checklist',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          inspectionId: Type.String({ description: 'Inspection ID' }),
        }),
        response: {
          201: SuccessResponse(Type.Array(ChecklistItemData)),
          400: ErrorResponse,
          401: ErrorResponse,
        },
        tags: ['Validation', 'Checklist'],
        summary: 'Create inspection checklist',
        description: 'Create standardized checklist for inspection',
        security: [{ bearerAuth: [] }],
      },
    },
    createInspectionChecklist
  );

  fastify.get(
    '/inspection/:inspectionId/checklist',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          inspectionId: Type.String({ description: 'Inspection ID' }),
        }),
        response: {
          200: SuccessResponse(Type.Array(ChecklistItemData)),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Checklist'],
        summary: 'Get inspection checklist',
        description: 'Get all checklist items for inspection',
        security: [{ bearerAuth: [] }],
      },
    },
    getInspectionChecklist
  );

  fastify.put(
    '/checklist-item/:itemId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          itemId: Type.String({ description: 'Checklist item ID' }),
        }),
        body: ChecklistItemUpdateBody,
        response: {
          200: SuccessResponse(ChecklistItemData),
          400: ErrorResponse,
          401: ErrorResponse,
        },
        tags: ['Validation', 'Checklist'],
        summary: 'Update checklist item',
        description: 'Update checklist item condition and notes',
        security: [{ bearerAuth: [] }],
      },
    },
    updateChecklistItem
  );

  fastify.get(
    '/inspection/:inspectionId/checklist/validate',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          inspectionId: Type.String({ description: 'Inspection ID' }),
        }),
        response: {
          200: SuccessResponse(ChecklistValidationData),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Checklist'],
        summary: 'Validate inspection checklist',
        description: 'Validate that inspection checklist is complete',
        security: [{ bearerAuth: [] }],
      },
    },
    validateInspectionChecklist
  );

  fastify.get(
    '/checklist-template',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: SuccessResponse(Type.Array(Type.Object({
            itemCode: Type.String(),
            itemName: Type.String(),
            description: Type.String(),
            category: Type.String(),
            displayOrder: Type.Number(),
            isRequired: Type.Boolean()
          }))),
          401: ErrorResponse,
        },
        tags: ['Validation', 'Checklist'],
        summary: 'Get checklist template',
        description: 'Get standard inspection checklist template',
        security: [{ bearerAuth: [] }],
      },
    },
    getChecklistTemplate
  );

  // Submission History & Audit Trail Endpoints
  fastify.get(
    '/submission-history/:recordType/:recordId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
          recordId: Type.String({ description: 'Record ID' }),
        }),
        response: {
          200: SuccessResponse(SubmissionHistoryData),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Audit'],
        summary: 'Get submission history',
        description: 'Get complete submission history for record',
        security: [{ bearerAuth: [] }],
      },
    },
    getSubmissionHistory
  );

  fastify.get(
    '/submission-history/:recordType/:recordId/:version',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
          recordId: Type.String({ description: 'Record ID' }),
          version: Type.String({ description: 'Submission version number' }),
        }),
        response: {
          200: SuccessResponse(Type.Object({
            version: Type.Number(),
            submittedBy: Type.String(),
            submittedAt: Type.String(),
            status: Type.String(),
            data: Type.Object({}, { additionalProperties: true })
          }, { additionalProperties: true })),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Audit'],
        summary: 'Get submission version',
        description: 'Get specific submission version (read-only historical data)',
        security: [{ bearerAuth: [] }],
      },
    },
    getSubmissionVersion
  );

  fastify.get(
    '/audit-trail/:recordType/:recordId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: Type.Object({
          recordType: Type.Union([
            Type.Literal('WARRANTY'),
            Type.Literal('INSPECTION')
          ], { description: 'Record type' }),
          recordId: Type.String({ description: 'Record ID' }),
        }),
        response: {
          200: SuccessResponse(Type.Array(Type.Object({
            eventType: Type.String(),
            timestamp: Type.String(),
            version: Type.Optional(Type.Number()),
            status: Type.String(),
            performedBy: Type.String()
          }, { additionalProperties: true }))),
          401: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Validation', 'Audit'],
        summary: 'Get audit trail',
        description: 'Get complete audit trail for record',
        security: [{ bearerAuth: [] }],
      },
    },
    getAuditTrail
  );

  // Admin Summary Endpoints (ERPS Admin only)
  fastify.get(
    '/summary',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Object({
            photos: Type.Array(Type.Object({}, { additionalProperties: true })),
            checklists: Type.Object({}, { additionalProperties: true }),
            submissions: Type.Array(Type.Object({}, { additionalProperties: true }))
          })),
          401: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Validation', 'Admin'],
        summary: 'Get validation summary (ERPS Admin only)',
        description: 'Get comprehensive validation system summary',
        security: [{ bearerAuth: [] }],
      },
    },
    getValidationSummary
  );

  fastify.get(
    '/rejected-submissions',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Array(Type.Object({
            recordId: Type.String(),
            recordType: Type.String(),
            submissionVersion: Type.Number(),
            rejectionReason: Type.String(),
            rejectedAt: Type.String(),
            recordDescription: Type.String(),
            customerName: Type.String()
          }, { additionalProperties: true }))),
          401: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Validation', 'Admin'],
        summary: 'Get rejected submissions (ERPS Admin only)',
        description: 'Get all rejected submissions requiring attention',
        security: [{ bearerAuth: [] }],
      },
    },
    getRejectedSubmissions
  );

  fastify.get(
    '/incomplete-checklists',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Array(Type.Object({
            inspectionId: Type.String(),
            verificationStatus: Type.String(),
            make: Type.String(),
            model: Type.String(),
            vinNumber: Type.String(),
            customerName: Type.String(),
            inspectorName: Type.String(),
            totalItems: Type.Number(),
            completedItems: Type.Number(),
            incompleteIssues: Type.Number()
          }, { additionalProperties: true }))),
          401: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Validation', 'Admin'],
        summary: 'Get incomplete checklists (ERPS Admin only)',
        description: 'Get inspections with incomplete checklists requiring attention',
        security: [{ bearerAuth: [] }],
      },
    },
    getIncompleteChecklists
  );
}