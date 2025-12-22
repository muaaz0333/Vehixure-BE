import fastify from 'fastify';
import config from './plugins/config.js';
import multipart from '@fastify/multipart';
import routes from './routes/index.js';
import typeorm from './plugins/typeorm.js';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import authMiddleware from './plugins/auth-middleware.js';

const server = fastify({
  ajv: {
    customOptions: {
      removeAdditional: "all",
      coerceTypes: true,
      useDefaults: true,
    }
  },
  logger: {
    level: process.env.LOG_LEVEL,
  },
  pluginTimeout: 60000
});

await server.register(cors);
await server.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB file size limit
    files: 10, // Maximum 10 files
  }
});
await server.register(typeorm);
await server.register(config);
await server.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });
await server.register(authMiddleware);
await server.register(swagger, {
  openapi: {
    info: {
      title: 'papero API',
      description: 'API documentation for papero',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
});
await server.register(swaggerUI, { routePrefix: '/docs' });
await server.register(routes);
await server.ready();

export default server;
