import { FastifyInstance } from 'fastify';
import { AnnualInspectionController } from '../controllers/annual-inspection-controller.js';
import { WarrantyRegistrationController } from '../controllers/warranty-registration-controller.js';

const inspectionController = new AnnualInspectionController();
const warrantyController = new WarrantyRegistrationController();

export default async function verificationEndpoints(fastify: FastifyInstance) {
  // Test endpoint to verify no authentication is required
  fastify.get('/test-verification-auth', async (request, reply) => {
    return { message: 'Verification endpoints work without authentication', timestamp: new Date() };
  });

  // Inspector verification endpoint (no auth required - uses token)
  fastify.post('/verify-inspection/:token', {
    schema: {
      description: 'Inspector verification via SMS token',
      tags: ['Inspection Verification'],
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['CONFIRM', 'DECLINE'] },
          rejectionReason: { type: 'string' }
        }
      }
    }
  }, inspectionController.verifyInspection.bind(inspectionController));

  // Installer verification endpoint (no auth required - uses token)
  fastify.post('/verify-warranty/:token', {
    schema: {
      description: 'Installer verification via SMS token',
      tags: ['Warranty Verification'],
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['CONFIRM', 'DECLINE'] },
          rejectionReason: { type: 'string' }
        }
      }
    }
  }, warrantyController.verifyWarranty.bind(warrantyController));
}