import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { DataSource } from 'typeorm';
import 'reflect-metadata';
import { User } from '../entities/User.js';
import { Warranty } from '../entities/Warranty.js';
import { WarrantyTerms } from '../entities/WarrantyTerms.js';
import { Photo } from '../entities/Photo.js';
import { AnnualInspection } from '../entities/AnnualInspection.js';
import { AuditHistory } from '../entities/AuditHistory.js';
import { SystemConfig } from '../entities/SystemConfig.js';
import { PartnerAccount } from '../entities/PartnerAccount.js';

import { CronJobService } from '../services/cron-job-service.js';

// Global DataSource instance
export let AppDataSource: DataSource;

const typeormPlugin: FastifyPluginAsync = async (server) => {
  try {
    AppDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      synchronize: false, // disabled to avoid timeout issues
      logging: false, // Disable logging for cleaner output
      entities: [
        User,
        PartnerAccount,
        Warranty,
        WarrantyTerms,
        Photo,
        AnnualInspection,
        AuditHistory,
        SystemConfig,
      ],
    });

    await AppDataSource.initialize();
    server.log.info('✅ Database connected');
    server.decorate('db', AppDataSource);
  } catch (err) {
    server.log.error({ err }, '❌ Database connection failed');
    throw err; // let Fastify fail early with clear error
  }
};

declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource;
    cronJobService?: CronJobService;
  }
}

export default fp(typeormPlugin);