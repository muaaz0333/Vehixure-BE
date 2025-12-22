import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { DataSource } from 'typeorm';
import 'reflect-metadata';
import { User } from '../entities/User.js';

const typeormPlugin: FastifyPluginAsync = async (server) => {
  try {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      synchronize: true, // use migrations in production
      logging: true,
      entities: [
        User,
      ],
    });

    await dataSource.initialize();
    server.log.info('✅ Database connected');
    server.decorate('db', dataSource);
  } catch (err) {
    server.log.error({ err }, '❌ Database connection failed');
    throw err; // let Fastify fail early with clear error
  }
};

declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource;
  }
}

export default fp(typeormPlugin);