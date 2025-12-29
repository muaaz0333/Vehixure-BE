import {
  getDashboardStats,
  getDashboardSummary,
  getRecentActivity,
} from '../controllers/dashboard-controller.js';
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  SuccessResponse,
  ErrorResponse,
} from '../schemas/responseSchemas.js';

// 🔹 Response data schemas
const DashboardSummaryData = Type.Object({
  warranties: Type.Object({
    total: Type.Number(),
    active: Type.Number(),
    withCorrosion: Type.Number(),
    pendingVerification: Type.Number(),
  }),
  inspections: Type.Object({
    total: Type.Number(),
    completed: Type.Number(),
    pendingVerification: Type.Number(),
  }),
  users: Type.Object({
    totalPartnerUsers: Type.Number(),
    totalInstallers: Type.Number(),
  }),
  partnerAccounts: Type.Number(),
  pendingVerifications: Type.Number(),
}, { additionalProperties: true });

const WarrantyItemData = Type.Object({
  id: Type.String(),
  ownerName: Type.String(),
  vehicle: Type.String(),
  vinNumber: Type.String(),
  installerName: Type.String(),
  dateInstalled: Type.String(),
  verificationStatus: Type.String(),
  status: Type.String(),
  corrosionFound: Type.Boolean(),
  created: Type.String(),
}, { additionalProperties: true });

const CorrosionWarrantyData = Type.Object({
  id: Type.String(),
  ownerName: Type.String(),
  vehicle: Type.String(),
  vinNumber: Type.String(),
  installerName: Type.String(),
  dateInstalled: Type.String(),
  corrosionDetails: Type.Optional(Type.String()),
  created: Type.String(),
}, { additionalProperties: true });

const InspectionItemData = Type.Object({
  id: Type.String(),
  warrantyId: Type.String(),
  inspectionDate: Type.String(),
  corrosionFound: Type.Boolean(),
  verificationStatus: Type.String(),
  verifiedAt: Type.Optional(Type.String()),
  warrantyExtendedUntil: Type.Optional(Type.String()),
  warranty: Type.Optional(Type.Object({
    ownerName: Type.String(),
    vehicle: Type.String(),
    vinNumber: Type.String(),
  })),
}, { additionalProperties: true });

const AccountStaffData = Type.Object({
  id: Type.String(),
  fullName: Type.Optional(Type.String()),
  email: Type.String(),
  partnerBusinessName: Type.Optional(Type.String()),
  warrantyCount: Type.Number(),
}, { additionalProperties: true });

const InstallerData = Type.Object({
  id: Type.String(),
  fullName: Type.Optional(Type.String()),
  email: Type.String(),
  mobileNumber: Type.Optional(Type.String()),
  isAccreditedInstaller: Type.Boolean(),
  isAuthorisedInspector: Type.Boolean(),
  partnerBusinessName: Type.Optional(Type.String()),
  installationCount: Type.Number(),
  inspectionCount: Type.Number(),
  totalWork: Type.Number(),
}, { additionalProperties: true });

const DashboardStatsData = Type.Object({
  summary: Type.Object({
    totalWarranties: Type.Number(),
    totalInspections: Type.Number(),
    totalCorrosionCases: Type.Number(),
    pendingVerifications: Type.Number(),
  }),
  lastWarranties: Type.Array(WarrantyItemData),
  corrosionWarranties: Type.Array(CorrosionWarrantyData),
  lastInspections: Type.Array(InspectionItemData),
  topAccountStaff: Type.Array(AccountStaffData),
  topInstallers: Type.Array(InstallerData),
}, { additionalProperties: true });

const ActivityItemData = Type.Object({
  type: Type.Union([Type.Literal('WARRANTY'), Type.Literal('INSPECTION')]),
  id: Type.String(),
  title: Type.String(),
  subtitle: Type.String(),
  status: Type.String(),
  corrosionFound: Type.Optional(Type.Boolean()),
  created: Type.String(),
  modified: Type.String(),
}, { additionalProperties: true });

const RecentActivityData = Type.Object({
  activities: Type.Array(ActivityItemData),
  total: Type.Number(),
}, { additionalProperties: true });

// 🔹 Query parameters
const RecentActivityQuery = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
});

// 🔹 Routes
export default async function dashboardRoutes(fastify: FastifyInstance) {

  fastify.get(
    '/stats',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: SuccessResponse(DashboardStatsData),
          401: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Dashboard'],
        summary: 'Get comprehensive dashboard statistics',
        description: 'Retrieve dashboard statistics including last 10 warranties, corrosion cases, inspections, top staff and installers. Data is filtered by partner account for non-admin users.',
        security: [{ bearerAuth: [] }],
      },
    },
    getDashboardStats
  );

  fastify.get(
    '/summary',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: SuccessResponse(DashboardSummaryData),
          401: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Dashboard'],
        summary: 'Get dashboard summary statistics',
        description: 'Retrieve quick summary statistics for dashboard overview. Data is filtered by partner account for non-admin users.',
        security: [{ bearerAuth: [] }],
      },
    },
    getDashboardSummary
  );

  fastify.get(
    '/activity',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: RecentActivityQuery,
        response: {
          200: SuccessResponse(RecentActivityData),
          401: ErrorResponse,
          403: ErrorResponse,
        },
        tags: ['Dashboard'],
        summary: 'Get recent activity',
        description: 'Retrieve recent warranty and inspection activity. Data is filtered by partner account for non-admin users.',
        security: [{ bearerAuth: [] }],
      },
    },
    getRecentActivity
  );

}