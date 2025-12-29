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

export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    console.log('User role for ERPS Admin check:', user.role);
    if (user.role !== 'ERPS_ADMIN') {
      console.log('❌ ERPS Admin authentication failed for user:', user);
      return reply.code(403).send({ message: 'Forbidden: ERPS Admin only' });
    }
    console.log('✅ ERPS Admin authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticatePartnerUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    if (user.role !== 'PARTNER_USER') {
      return reply.code(403).send({ message: 'Forbidden: Partner users only' });
    }
    console.log('✅ Partner user authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticateAccountInstaller(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    if (user.role !== 'PARTNER_USER' || user.partnerRole !== 'ACCOUNT_INSTALLER') {
      return reply.code(403).send({ message: 'Forbidden: Account Installers only' });
    }
    console.log('✅ Account Installer authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticatePartnerUserOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    if (user.role !== 'PARTNER_USER' && user.role !== 'ERPS_ADMIN') {
      return reply.code(403).send({ message: 'Forbidden: Partner users or ERPS Admin only' });
    }
    console.log('✅ Partner user or ERPS Admin authenticated:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

export async function authenticateOwnResourceOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    const { userId } = request.params as any;
    
    // ERPS Admin can access any resource
    if (user.role === 'ERPS_ADMIN') {
      console.log('✅ ERPS Admin accessing resource:', user);
      return;
    }
    
    // Users can only access their own resources
    if (user.id !== userId) {
      return reply.code(403).send({ message: 'Forbidden: Can only access your own resources' });
    }
    
    console.log('✅ User accessing own resource:', user);
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}

const authMiddleware = fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('authenticateAdmin', authenticateAdmin);
  fastify.decorate('authenticatePartnerUser', authenticatePartnerUser);
  fastify.decorate('authenticateAccountInstaller', authenticateAccountInstaller);
  fastify.decorate('authenticatePartnerUserOrAdmin', authenticatePartnerUserOrAdmin);
  fastify.decorate('authenticateOwnResourceOrAdmin', authenticateOwnResourceOrAdmin);
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    authenticateAdmin: typeof authenticateAdmin;
    authenticatePartnerUser: typeof authenticatePartnerUser;
    authenticateAccountInstaller: typeof authenticateAccountInstaller;
    authenticatePartnerUserOrAdmin: typeof authenticatePartnerUserOrAdmin;
    authenticateOwnResourceOrAdmin: typeof authenticateOwnResourceOrAdmin;
  }
}

export default authMiddleware; 