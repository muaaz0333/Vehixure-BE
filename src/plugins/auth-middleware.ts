import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    console.log('✅ JWT verified for user:', (request as any).user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticateSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    console.log('User role for Super Admin check:', user.role);
    if (user.role !== 'SUPER_ADMIN') {
      console.log('❌ Super Admin authentication failed for user:', user);
      return reply.code(403).send({ message: 'Forbidden: Super Admins only' });
    }
    console.log('✅ Super Admin authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticateStoreAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    if (user.role !== 'STORE_ADMIN') {
      return reply.code(403).send({ message: 'Forbidden: Store Admins only' });
    }
    console.log('✅ Store Admin authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticateInfluencer(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    if (user.role !== 'INFLUENCER') {
      return reply.code(403).send({ message: 'Forbidden: Influencers only' });
    }
    console.log('✅ Influencer authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticateSuperOrStoreAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'STORE_ADMIN') {
      return reply.code(403).send({ message: 'Forbidden: Super Admins or Store Admins only' });
    }
    console.log('✅ Super Admin or Store Admin authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

const authMiddleware = fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('authenticateSuperAdmin', authenticateSuperAdmin);
  fastify.decorate('authenticateStoreAdmin', authenticateStoreAdmin);
  fastify.decorate('authenticateInfluencer', authenticateInfluencer);
  fastify.decorate('authenticateSuperOrStoreAdmin', authenticateSuperOrStoreAdmin);
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    authenticateSuperAdmin: typeof authenticateSuperAdmin;
    authenticateStoreAdmin: typeof authenticateStoreAdmin;
    authenticateInfluencer: typeof authenticateInfluencer;
    authenticateSuperOrStoreAdmin: typeof authenticateSuperOrStoreAdmin;
  }
}

export default authMiddleware; 