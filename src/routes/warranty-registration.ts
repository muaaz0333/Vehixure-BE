import { FastifyInstance } from 'fastify';
import { WarrantyRegistrationController } from '../controllers/warranty-registration-controller.js';

const warrantyController = new WarrantyRegistrationController();

export default async function warrantyRegistrationRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes
  fastify.addHook('preHandler', fastify.authenticate);

  // Create warranty registration (Draft)
  fastify.post('/warranties', {
    schema: {
      description: 'Create a new warranty registration',
      tags: ['Warranty Registration'],
      body: {
        type: 'object',
        required: [
          'firstName', 'lastName', 'phoneNumber', 'email',
          'make', 'model', 'buildDate', 'vinNumber',
          'installersName', 'installerId', 'dateInstalled',
          'generatorSerialNumber', 'corrosionFound', 'warrantyTermsId'
        ],
        properties: {
          // Vehicle Owner Details
          companyName: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string' },
          email: { type: 'string', format: 'email' },
          
          // Vehicle Details
          make: { type: 'string' },
          model: { type: 'string' },
          registrationNumber: { type: 'string' },
          buildDate: { type: 'string', format: 'date' },
          vinNumber: { type: 'string' },
          
          // Installation Details
          installersName: { type: 'string' },
          installerId: { type: 'string', format: 'uuid' },
          dateInstalled: { type: 'string', format: 'date' },
          generatorSerialNumber: { type: 'string' },
          numberOfCouplersInstalled: { type: 'integer' },
          voltageInCouplerSupplyLine: { type: 'number' },
          positionOfCouplers: { type: 'string' },
          
          // Corrosion Details
          corrosionFound: { type: 'boolean' },
          corrosionDetails: { type: 'string' },
          
          // Terms
          warrantyTermsId: { type: 'string', format: 'uuid' },
          
          // Photos
          photos: {
            type: 'array',
            items: {
              type: 'object',
              required: ['photoGroup', 'photoUrl'],
              properties: {
                photoGroup: { 
                  type: 'string', 
                  enum: ['GENERATOR', 'COUPLER', 'CORROSION', 'CLEAR_BODY'] 
                },
                photoUrl: { type: 'string' },
                photoDescription: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            warranty: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                verificationStatus: { type: 'string' },
                status: { type: 'string' },
                customerName: { type: 'string' },
                vehicle: { type: 'string' },
                vinNumber: { type: 'string' },
                installerName: { type: 'string' },
                created: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, warrantyController.createWarranty.bind(warrantyController));

  // Submit warranty for verification
  fastify.post('/warranties/:id/submit', {
    schema: {
      description: 'Submit warranty for installer verification',
      tags: ['Warranty Registration'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          submissionNotes: { type: 'string' }
        }
      }
    }
  }, warrantyController.submitWarranty.bind(warrantyController));

  // Validate warranty for submission
  fastify.get('/warranties/:id/validate', {
    schema: {
      description: 'Check if warranty is ready for submission',
      tags: ['Warranty Registration'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isReadyForSubmission: { type: 'boolean' },
            validation: {
              type: 'object',
              properties: {
                photos: {
                  type: 'object',
                  properties: {
                    current: { type: 'integer' },
                    required: { type: 'integer' },
                    missing: { type: 'integer' },
                    valid: { type: 'boolean' }
                  }
                }
              }
            },
            message: { type: 'string' },
            requiredPhotos: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }, warrantyController.validateWarrantyForSubmission.bind(warrantyController));

  // Get warranty details
  fastify.get('/warranties/:id', {
    schema: {
      description: 'Get warranty registration details',
      tags: ['Warranty Registration'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, warrantyController.getWarranty.bind(warrantyController));

  // List warranties for current user
  fastify.get('/warranties', {
    schema: {
      description: 'List warranty registrations for current user',
      tags: ['Warranty Registration']
    }
  }, warrantyController.listWarranties.bind(warrantyController));
}