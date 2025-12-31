import { FastifyPluginAsync } from 'fastify';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import uploadRoutes from './upload.js';
import adminRoutes from './admin.js';
import partnerRoutes from './partner-simple.js';
import warrantyRegistrationRoutes from './warranty-registration.js';
import annualInspectionRoutes from './annual-inspection.js';
import verificationRoutes from './verification.js';
import verificationEndpoints from './verification-endpoints.js';
import dashboardRoutes from './dashboard.js';
import erpsAdminRoutes from './erps-admin.js';
import customerActivationRoutes from './customer-activation.js';
import { SMSService } from '../services/smsService.js';

const routes: FastifyPluginAsync = async (server) => {
  // Health check
  server.get('/', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
      tags: ['Health'],
      summary: 'API Health Check',
    },
  }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Test SMS endpoint (for testing Twilio configuration)
  server.post('/api/v1/test-sms', {
    schema: {
      body: {
        type: 'object',
        required: ['phoneNumber'],
        properties: {
          phoneNumber: { type: 'string', description: 'Phone number in E.164 format (e.g., +923314205166)' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            sid: { type: 'string' }
          }
        }
      },
      tags: ['Test'],
      summary: 'Test SMS functionality'
    }
  }, async (request, reply) => {
    const { phoneNumber } = request.body as { phoneNumber: string };
    
    // Format the phone number
    const formattedNumber = SMSService.formatPhoneNumber(phoneNumber);
    
    // Validate phone number
    if (!SMSService.validatePhoneNumber(formattedNumber)) {
      return reply.code(400).send({
        success: false,
        message: `Invalid phone number format. Please use E.164 format (e.g., +923314205166). Got: ${formattedNumber}`
      });
    }
    
    const result = await SMSService.sendTestSMS(formattedNumber);
    return reply.code(result.success ? 200 : 500).send(result);
  });

  // Register verification endpoints first (no authentication)
  await server.register(verificationEndpoints, { prefix: '/api/v1' });
  
  // Register customer activation routes (public endpoints)
  await server.register(customerActivationRoutes, { prefix: '/api/v1/customer' });
  
  // Register route modules
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(userRoutes, { prefix: '/api/v1/users' });
  await server.register(uploadRoutes, { prefix: '/api/v1/upload' });
  await server.register(adminRoutes, { prefix: '/api/v1/admin' });
  await server.register(partnerRoutes, { prefix: '/api/v1/admin' });
  await server.register(erpsAdminRoutes, { prefix: '/api/v1/erps-admin' });
  await server.register(warrantyRegistrationRoutes, { prefix: '/api/v1' });
  await server.register(annualInspectionRoutes, { prefix: '/api/v1' });
  await server.register(verificationRoutes, { prefix: '/api/v1/verify' });
  await server.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
};

export default routes;