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
import { SystemConfigService } from './services/system-config-service.js';
import { CronJobService } from './services/cron-job-service.js';

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
      title: 'ERPS API',
      description: 'API documentation for ERPS',
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

// Initialize system configuration after database connection
server.addHook('onReady', async () => {
  try {
    // Initialize ERPS system configuration
    const systemConfigService = new SystemConfigService();
    await systemConfigService.initializeERPSDefaults();
    server.log.info('✅ ERPS system configuration initialized');

    // Check if auto-start cron jobs is enabled
    const autoStartCronJobs = await systemConfigService.getConfigValue('CRON_JOBS', 'AUTO_START_CRON_JOBS');
    
    if (autoStartCronJobs !== false) { // Default to true if not set
      // Start ERPS cron jobs automatically
      const cronJobService = new CronJobService();
      await cronJobService.startAllCronJobs();
      server.log.info('✅ ERPS cron jobs started automatically');
      
      // Store cron job service instance for graceful shutdown
      server.decorate('cronJobService', cronJobService);
    } else {
      server.log.info('⏸️ ERPS cron jobs auto-start disabled');
    }
    
  } catch (error) {
    server.log.error({ err: error }, '❌ Failed to initialize ERPS system');
    // Don't throw error to prevent server startup failure
  }
});

// Graceful shutdown - stop cron jobs
server.addHook('onClose', async () => {
  try {
    if (server.cronJobService) {
      server.cronJobService.stopAllCronJobs();
      server.log.info('✅ ERPS cron jobs stopped gracefully');
    }
  } catch (error) {
    server.log.error({ err: error }, '❌ Error stopping cron jobs during shutdown');
  }
});

await server.ready();

export default server;
