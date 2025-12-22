import { FastifyPluginAsync } from 'fastify';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import uploadRoutes from './upload.js';

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

  // Register route modules
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(userRoutes, { prefix: '/api/v1/users' });
  await server.register(uploadRoutes, { prefix: '/api/v1/upload' });
};

export default routes;