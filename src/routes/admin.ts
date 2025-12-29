import {
  createUser,
  editUser,
  toggleUserBlock,
  deleteUser,
  getDashboardStats,
  getAgentsForDropdown,
  getInspectorsForDropdown,
  loginAsUser,
} from '../controllers/admin-controller.js';
import { SystemConfigController } from '../controllers/system-config-controller.js';
import { CronJobController } from '../controllers/cron-job-controller.js';
import {
  createWarranty,
  getAllWarranties,
  getWarrantyById,
  updateWarranty,
  deleteWarranty,
  restoreWarranty,
  getDeletedWarranties,
  getCorrosionWarranties,
} from '../controllers/warranty-controller.js';
import {
  createWarrantyTerms,
  getAllWarrantyTerms,
  getActiveWarrantyTerms,
  getWarrantyTermsById,
  updateWarrantyTerms,
  deleteWarrantyTerms,
  toggleWarrantyTermsStatus,
  getWarrantyTermsForReplacement,
} from '../controllers/warranty-terms-controller.js';
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  SuccessResponse,
  PaginatedResponse,
  DataResponse,
  ErrorResponse,
  MessageResponse,
} from '../schemas/responseSchemas.js';

// Request body schemas
const CreateUserBody = Type.Object({
  email: Type.String({ format: 'email', description: 'Email address of the user' }),
  password: Type.String({ minLength: 6, description: 'Password (minimum 6 characters)' }),
  fullName: Type.Optional(Type.String({ description: 'Full name of the user' })),
  phone: Type.String({ description: 'Phone number' }),
  
  // Required fields for agent/inspector creation
  businessName: Type.String({ description: 'Business name' }),
  contact: Type.String({ description: 'Contact person' }),
  streetAddress: Type.String({ description: 'Street address' }),
  city: Type.String({ description: 'City' }),
  state: Type.String({ description: 'State' }),
  postcode: Type.String({ description: 'Postcode/ZIP code' }),
  username: Type.String({ description: 'Username for login' }),
  agentType: Type.Union([Type.Literal('AGENT'), Type.Literal('INSPECTOR')], {
    description: 'Agent type (AGENT or INSPECTOR)'
  }),
  buyPrice: Type.Union([
    Type.Literal('Aftermart'),
    Type.Literal('Distributor'),
    Type.Literal('E1'),
    Type.Literal('E2'),
    Type.Literal('Less 15%'),
    Type.Literal('Rob'),
    Type.Literal('EquipIT'),
    Type.Literal('Installer'),
    Type.Literal('Inspector')
  ], { description: 'Buy price category' }),
  accountStatus: Type.Union([
    Type.Literal('Active'),
    Type.Literal('InActive')
  ], { description: 'Account status' }),
  
  // Optional fields
  faxNumber: Type.Optional(Type.String({ description: 'Fax number (optional)' })),
  installerId: Type.Optional(Type.String({ description: 'Installer ID (optional)' })),
  productsSold: Type.Optional(Type.String({ description: 'Products sold (optional)' })),
});

const EditUserBody = Type.Object({
  email: Type.Optional(Type.String({ format: 'email', description: 'Email address of the user' })),
  password: Type.Optional(Type.String({ minLength: 6, description: 'Password (minimum 6 characters)' })),
  fullName: Type.Optional(Type.String({ description: 'Full name of the user' })),
  phone: Type.Optional(Type.String({ description: 'Phone number' })),
  
  // Optional fields for agent/inspector editing
  businessName: Type.Optional(Type.String({ description: 'Business name' })),
  contact: Type.Optional(Type.String({ description: 'Contact person' })),
  streetAddress: Type.Optional(Type.String({ description: 'Street address' })),
  city: Type.Optional(Type.String({ description: 'City' })),
  state: Type.Optional(Type.String({ description: 'State' })),
  postcode: Type.Optional(Type.String({ description: 'Postcode/ZIP code' })),
  username: Type.Optional(Type.String({ description: 'Username for login' })),
  agentType: Type.Optional(Type.Union([Type.Literal('AGENT'), Type.Literal('INSPECTOR')], {
    description: 'Agent type (AGENT or INSPECTOR)'
  })),
  buyPrice: Type.Optional(Type.Union([
    Type.Literal('Aftermart'),
    Type.Literal('Distributor'),
    Type.Literal('E1'),
    Type.Literal('E2'),
    Type.Literal('Less 15%'),
    Type.Literal('Rob'),
    Type.Literal('EquipIT'),
    Type.Literal('Installer'),
    Type.Literal('Inspector')
  ], { description: 'Buy price category' })),
  accountStatus: Type.Optional(Type.Union([
    Type.Literal('Active'),
    Type.Literal('InActive')
  ], { description: 'Account status' })),
  
  // Optional fields
  faxNumber: Type.Optional(Type.String({ description: 'Fax number (optional)' })),
  installerId: Type.Optional(Type.String({ description: 'Installer ID (optional)' })),
  productsSold: Type.Optional(Type.String({ description: 'Products sold (optional)' })),
});

const ToggleBlockBody = Type.Object({
  isBlocked: Type.Boolean({ description: 'Whether to block or unblock the user' }),
  blockedReason: Type.Optional(Type.String({ description: 'Reason for blocking (required if isBlocked is true)' })),
});

// Response schemas
const UserData = Type.Object({
  id: Type.String(),
  email: Type.String({ format: 'email' }),
  username: Type.Optional(Type.String()),
  fullName: Type.Optional(Type.String()),
  role: Type.String(),
  phone: Type.Optional(Type.String()),
  businessName: Type.Optional(Type.String()),
  contact: Type.Optional(Type.String()),
  streetAddress: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  postcode: Type.Optional(Type.String()),
  faxNumber: Type.Optional(Type.String()),
  installerId: Type.Optional(Type.String()),
  agentType: Type.Optional(Type.String()),
  productsSold: Type.Optional(Type.String()),
  buyPrice: Type.Optional(Type.String()),
  accountStatus: Type.Optional(Type.String()),
  isVerified: Type.Boolean(),
  created: Type.String(),
}, { additionalProperties: true });

const DashboardStatsData = Type.Object({
  totalAgents: Type.Number(),
  totalInspectors: Type.Number(),
  blockedUsers: Type.Number(),
  verifiedUsers: Type.Number(),
  totalUsers: Type.Number(),
});

export default async function adminRoutes(fastify: FastifyInstance) {
  
  // Initialize system config controller
  const systemConfigController = new SystemConfigController();
  
  // Initialize cron job controller
  const cronJobController = new CronJobController();
  
  fastify.post(
    '/users',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: CreateUserBody,
        response: {
          201: SuccessResponse(UserData),
          400: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Create new agent or inspector',
        description: 'Create a new agent or inspector user. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    createUser
  );

  fastify.put(
    '/users/:userId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          userId: Type.String({ description: 'ID of the user to edit' })
        }),
        body: EditUserBody,
        response: {
          200: SuccessResponse(UserData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Edit existing agent or inspector',
        description: 'Edit an existing agent or inspector user. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    editUser
  );

  fastify.patch(
    '/users/:userId/block',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          userId: Type.String({ description: 'ID of the user to block/unblock' })
        }),
        body: ToggleBlockBody,
        response: {
          200: SuccessResponse(UserData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Block or unblock a user',
        description: 'Block or unblock an agent or inspector. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    toggleUserBlock
  );

  fastify.delete(
    '/users/:userId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          userId: Type.String({ description: 'ID of the user to delete' })
        }),
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Delete a user',
        description: 'Soft delete an agent or inspector. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    deleteUser
  );

  fastify.get(
    '/dashboard/stats',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(DashboardStatsData),
          403: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Get dashboard statistics',
        description: 'Get overview statistics for the admin dashboard. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    getDashboardStats
  );

  // Warranty Terms Routes
  const WarrantyTermsBody = Type.Object({
    warrantyName: Type.String({ description: 'Warranty name' }),
    description: Type.Optional(Type.String({ description: 'Description' })),
    revision: Type.String({ description: 'Revision' }),
    generatorLightColour: Type.Optional(Type.String({ description: 'Generator light colour' })),
    termsAndConditions: Type.Optional(Type.String({ description: 'Terms and conditions' })),
    addType: Type.Union([Type.Literal('ADD_WARRANTY'), Type.Literal('REPLACE_WARRANTY')], {
      description: 'Add type - ADD_WARRANTY or REPLACE_WARRANTY'
    }),
    warrantyToReplaceId: Type.Optional(Type.String({ description: 'Warranty to replace ID (required if addType is REPLACE_WARRANTY)' })),
    inspectionInstructions: Type.Optional(Type.String({ description: 'Inspection instructions' })),
    isActive: Type.Optional(Type.Boolean({ description: 'Is active' })),
  });

  const WarrantyTermsData = Type.Object({
    id: Type.String(),
    warrantyName: Type.String(),
    description: Type.Optional(Type.String()),
    revision: Type.String(),
    generatorLightColour: Type.Optional(Type.String()),
    termsAndConditions: Type.Optional(Type.String()),
    addType: Type.String(),
    warrantyToReplaceId: Type.Optional(Type.String()),
    inspectionInstructions: Type.Optional(Type.String()),
    isActive: Type.Boolean(),
    isDeleted: Type.Boolean(),
    created: Type.String(),
    modified: Type.String(),
    deletedAt: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    warrantyToReplace: Type.Optional(Type.Union([
      Type.Object({
        id: Type.String(),
        warrantyName: Type.String(),
        revision: Type.String(),
      }),
      Type.Null()
    ])),
  }, { additionalProperties: true });

  fastify.post(
    '/warranty-terms',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: WarrantyTermsBody,
        response: {
          201: SuccessResponse(WarrantyTermsData),
          400: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Create warranty terms',
        description: 'Create new warranty terms and conditions. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    createWarrantyTerms
  );

  fastify.get(
    '/warranty-terms',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        querystring: Type.Object({
          page: Type.Optional(Type.Number({ minimum: 1, description: 'Page number' })),
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, description: 'Items per page' })),
          isActive: Type.Optional(Type.Boolean({ description: 'Filter by active status' })),
          search: Type.Optional(Type.String({ description: 'Search term' })),
        }),
        response: {
          200: PaginatedResponse(WarrantyTermsData),
          403: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Get all warranty terms',
        description: 'Get all warranty terms with pagination and filters. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    getAllWarrantyTerms
  );

  fastify.get(
    '/warranty-terms/active',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: DataResponse(WarrantyTermsData),
          403: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Get active warranty terms',
        description: 'Get all active warranty terms for dropdown. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    getActiveWarrantyTerms
  );

  const ReplacementOptionData = Type.Object({
    id: Type.Union([Type.String(), Type.Null()]),
    name: Type.String(),
    value: Type.Union([Type.String(), Type.Literal('none')])
  });

  fastify.get(
    '/warranty-terms/replacement-options',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: DataResponse(ReplacementOptionData),
          403: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Get warranty terms for replacement dropdown',
        description: 'Get warranty terms options for replacement dropdown with None option. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    getWarrantyTermsForReplacement
  );

  fastify.get(
    '/warranty-terms/:warrantyTermsId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyTermsId: Type.String({ description: 'Warranty terms ID' })
        }),
        response: {
          200: SuccessResponse(WarrantyTermsData),
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Get warranty terms by ID',
        description: 'Get specific warranty terms by ID. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    getWarrantyTermsById
  );

  fastify.put(
    '/warranty-terms/:warrantyTermsId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyTermsId: Type.String({ description: 'Warranty terms ID' })
        }),
        body: Type.Partial(WarrantyTermsBody),
        response: {
          200: SuccessResponse(WarrantyTermsData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Update warranty terms',
        description: 'Update existing warranty terms. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    updateWarrantyTerms
  );

  fastify.delete(
    '/warranty-terms/:warrantyTermsId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyTermsId: Type.String({ description: 'Warranty terms ID' })
        }),
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Delete warranty terms',
        description: 'Delete warranty terms. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    deleteWarrantyTerms
  );

  fastify.patch(
    '/warranty-terms/:warrantyTermsId/status',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          warrantyTermsId: Type.String({ description: 'Warranty terms ID' })
        }),
        body: Type.Object({
          isActive: Type.Boolean({ description: 'Active status' }),
        }),
        response: {
          200: SuccessResponse(WarrantyTermsData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - Warranty Terms'],
        summary: 'Toggle warranty terms status',
        description: 'Activate or deactivate warranty terms. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    toggleWarrantyTermsStatus
  );

  // Agent and Inspector dropdown routes
  const UserDropdownData = Type.Object({
    id: Type.String(),
    name: Type.String(),
    businessName: Type.Optional(Type.String()),
    email: Type.String(),
    role: Type.String(),
  });

  fastify.get(
    '/agents/dropdown',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Array(UserDropdownData)),
          403: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Get agents for dropdown',
        description: 'Get all active agents for dropdown selection. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    getAgentsForDropdown
  );

  fastify.get(
    '/inspectors/dropdown',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Array(UserDropdownData)),
          403: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Get inspectors for dropdown',
        description: 'Get all active inspectors for dropdown selection. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    getInspectorsForDropdown
  );

  // Login as user route
  fastify.post(
    '/login-as/:userId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          userId: Type.String({ description: 'ID of the user to login as' })
        }),
        response: {
          200: SuccessResponse(Type.Object({
            token: Type.String(),
            user: UserData
          })),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin'],
        summary: 'Login as agent or inspector',
        description: 'Admin can login as any active agent or inspector. Returns JWT token for the target user.',
        security: [{ bearerAuth: [] }],
      },
    },
    loginAsUser
  );

  // ===== SYSTEM CONFIGURATION ROUTES =====
  
  const SystemConfigData = Type.Object({
    id: Type.String(),
    configCategory: Type.String(),
    configKey: Type.String(),
    configName: Type.String(),
    description: Type.Optional(Type.String()),
    stringValue: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    integerValue: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    booleanValue: Type.Optional(Type.Union([Type.Boolean(), Type.Null()])),
    dateValue: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    jsonValue: Type.Optional(Type.Any()),
    isActive: Type.Boolean(),
    isMandatory: Type.Boolean(),
    priorityOrder: Type.Number(),
    created: Type.String(),
    modified: Type.String(),
  });

  const CreateSystemConfigBody = Type.Object({
    configCategory: Type.String({ description: 'Configuration category (e.g., REMINDER, GRACE_PERIOD, PHOTO_VALIDATION)' }),
    configKey: Type.String({ description: 'Unique key within category' }),
    configName: Type.String({ description: 'Human-readable name' }),
    description: Type.Optional(Type.String({ description: 'Description of the configuration' })),
    stringValue: Type.Optional(Type.String({ description: 'String value' })),
    integerValue: Type.Optional(Type.Number({ description: 'Integer value' })),
    booleanValue: Type.Optional(Type.Boolean({ description: 'Boolean value' })),
    dateValue: Type.Optional(Type.String({ description: 'Date value (ISO string)' })),
    jsonValue: Type.Optional(Type.Any({ description: 'JSON value' })),
    isActive: Type.Boolean({ description: 'Whether the configuration is active' }),
    isMandatory: Type.Boolean({ description: 'Whether the configuration is mandatory' }),
    priorityOrder: Type.Number({ description: 'Display/processing order' }),
  });

  const UpdateSystemConfigBody = Type.Partial(Type.Omit(CreateSystemConfigBody, ['configCategory', 'configKey']));

  const SystemConfigSummaryData = Type.Object({
    configCategory: Type.String(),
    totalCount: Type.Number(),
    activeCount: Type.Number(),
    mandatoryCount: Type.Number(),
  });

  // Get all system configurations
  fastify.get(
    '/system-config',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        querystring: Type.Object({
          category: Type.Optional(Type.String({ description: 'Filter by category' })),
          isActive: Type.Optional(Type.Boolean({ description: 'Filter by active status' })),
          page: Type.Optional(Type.Number({ minimum: 1, description: 'Page number' })),
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, description: 'Items per page' })),
        }),
        response: {
          200: PaginatedResponse(SystemConfigData),
          403: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Get all system configurations',
        description: 'Get all system configurations with filtering and pagination. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.getAllSystemConfig.bind(systemConfigController)
  );

  // Get system configuration summary
  fastify.get(
    '/system-config/summary',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Array(SystemConfigSummaryData)),
          403: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Get system configuration summary',
        description: 'Get summary of system configurations by category. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.getConfigSummary.bind(systemConfigController)
  );

  // Get system configuration by category
  fastify.get(
    '/system-config/category/:category',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          category: Type.String({ description: 'Configuration category' })
        }),
        response: {
          200: SuccessResponse(Type.Array(SystemConfigData)),
          403: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Get system configuration by category',
        description: 'Get all configurations for a specific category. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.getConfigByCategory.bind(systemConfigController)
  );

  // Get system configuration by ID
  fastify.get(
    '/system-config/:configId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          configId: Type.String({ description: 'System configuration ID' })
        }),
        response: {
          200: SuccessResponse(SystemConfigData),
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Get system configuration by ID',
        description: 'Get specific system configuration by ID. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.getConfigById.bind(systemConfigController)
  );

  // Create system configuration
  fastify.post(
    '/system-config',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: CreateSystemConfigBody,
        response: {
          201: SuccessResponse(SystemConfigData),
          400: ErrorResponse,
          403: ErrorResponse,
          409: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Create system configuration',
        description: 'Create new system configuration entry. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.createSystemConfig.bind(systemConfigController)
  );

  // Update system configuration
  fastify.put(
    '/system-config/:configId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          configId: Type.String({ description: 'System configuration ID' })
        }),
        body: UpdateSystemConfigBody,
        response: {
          200: SuccessResponse(SystemConfigData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Update system configuration',
        description: 'Update existing system configuration. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.updateSystemConfig.bind(systemConfigController)
  );

  // Toggle system configuration status
  fastify.patch(
    '/system-config/:configId/status',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          configId: Type.String({ description: 'System configuration ID' })
        }),
        body: Type.Object({
          isActive: Type.Boolean({ description: 'Active status' }),
        }),
        response: {
          200: SuccessResponse(SystemConfigData),
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Toggle system configuration status',
        description: 'Activate or deactivate system configuration. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.toggleConfigStatus.bind(systemConfigController)
  );

  // Delete system configuration
  fastify.delete(
    '/system-config/:configId',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        params: Type.Object({
          configId: Type.String({ description: 'System configuration ID' })
        }),
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Delete system configuration',
        description: 'Delete system configuration entry. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.deleteSystemConfig.bind(systemConfigController)
  );

  // Initialize ERPS default configurations
  fastify.post(
    '/system-config/initialize-erps-defaults',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Admin - System Configuration'],
        summary: 'Initialize ERPS default configurations',
        description: 'Initialize system with ERPS-specific default configurations based on client specifications. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    systemConfigController.initializeERPSDefaults.bind(systemConfigController)
  );

  // ===== CRON JOB MANAGEMENT ROUTES =====

  const CronJobStatusData = Type.Object({
    jobName: Type.String(),
    isRunning: Type.Boolean(),
    intervalMinutes: Type.Optional(Type.Number()),
  });

  const ReminderStatisticsData = Type.Object({
    totalReminders: Type.Number(),
    pendingReminders: Type.Number(),
    sentReminders: Type.Number(),
    failedReminders: Type.Number(),
    cancelledReminders: Type.Number(),
    overdueReminders: Type.Number(),
  });

  const ReminderProcessingResultData = Type.Object({
    sent: Type.Number(),
    failed: Type.Number(),
  });

  const GracePeriodProcessingResultData = Type.Object({
    expiredCount: Type.Number(),
  });

  // Get cron job status
  fastify.get(
    '/cron-jobs/status',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(Type.Object({
            cronJobs: Type.Array(CronJobStatusData),
            reminderStatistics: ReminderStatisticsData,
          })),
          403: ErrorResponse,
        },
        tags: ['Admin - Cron Jobs'],
        summary: 'Get cron job status',
        description: 'Get status of all running cron jobs and reminder statistics. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    cronJobController.getCronJobStatus.bind(cronJobController)
  );

  // Start all cron jobs
  fastify.post(
    '/cron-jobs/start',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Admin - Cron Jobs'],
        summary: 'Start all cron jobs',
        description: 'Start all ERPS cron jobs (reminders, grace period processing, etc.). Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    cronJobController.startCronJobs.bind(cronJobController)
  );

  // Stop all cron jobs
  fastify.post(
    '/cron-jobs/stop',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: MessageResponse,
          400: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Admin - Cron Jobs'],
        summary: 'Stop all cron jobs',
        description: 'Stop all running ERPS cron jobs. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    cronJobController.stopCronJobs.bind(cronJobController)
  );

  // Manually trigger reminder processing
  fastify.post(
    '/cron-jobs/trigger/reminders',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(ReminderProcessingResultData),
          400: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Admin - Cron Jobs'],
        summary: 'Manually trigger reminder processing',
        description: 'Manually process all pending reminders immediately. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    cronJobController.triggerReminderProcessing.bind(cronJobController)
  );

  // Manually trigger grace period processing
  fastify.post(
    '/cron-jobs/trigger/grace-period',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(GracePeriodProcessingResultData),
          400: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Admin - Cron Jobs'],
        summary: 'Manually trigger grace period processing',
        description: 'Manually process grace period expiry for all warranties. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    cronJobController.triggerGracePeriodProcessing.bind(cronJobController)
  );

  // Get reminder statistics
  fastify.get(
    '/cron-jobs/reminders/statistics',
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        response: {
          200: SuccessResponse(ReminderStatisticsData),
          403: ErrorResponse,
        },
        tags: ['Admin - Cron Jobs'],
        summary: 'Get reminder statistics',
        description: 'Get detailed statistics about reminder processing. Only accessible by admins.',
        security: [{ bearerAuth: [] }],
      },
    },
    cronJobController.getReminderStatistics.bind(cronJobController)
  );
}