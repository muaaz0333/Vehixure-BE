import { FastifyInstance } from 'fastify';
import { partnerAccountController } from '../controllers/partner-account-controller.js';

export default async function partnerRoutes(fastify: FastifyInstance) {
  // Partner Account Management Routes (Admin Only)
  
  // Create new partner account with admin user
  fastify.post('/partner-accounts', {
    preHandler: [fastify.authenticate, fastify.authenticateAdmin],
    handler: async (request: any, reply: any) => {
      return partnerAccountController.createPartnerAccount(request, reply);
    }
  });

  // Get all partner accounts
  fastify.get('/partner-accounts', {
    preHandler: [fastify.authenticate, fastify.authenticateAdmin],
    handler: async (request: any, reply: any) => {
      return partnerAccountController.getPartnerAccounts(request, reply);
    }
  });

  // Get partner account by ID
  fastify.get('/partner-accounts/:accountId', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      // Check if user can access this partner account
      const user = request.user;
      const accountId = request.params.accountId;
      
      // ERPS Admin can access any partner account
      if (user.role === 'ERPS_ADMIN') {
        return partnerAccountController.getPartnerAccountById(request, reply);
      }
      
      // Partner users can only access their own account
      if (user.role === 'PARTNER_USER' && user.partnerAccountId === accountId) {
        return partnerAccountController.getPartnerAccountById(request, reply);
      }
      
      return reply.code(403).send({ success: false, message: 'Access denied' });
    }
  });

  // Update partner account
  fastify.put('/partner-accounts/:accountId', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      // Check if user can update this partner account
      const user = request.user;
      const accountId = request.params.accountId;
      
      // ERPS Admin can update any partner account
      if (user.role === 'ERPS_ADMIN') {
        return partnerAccountController.updatePartnerAccount(request, reply);
      }
      
      // Account Admin can update their own partner account
      if (user.role === 'PARTNER_USER' && user.partnerRole === 'ACCOUNT_ADMIN' && user.partnerAccountId === accountId) {
        return partnerAccountController.updatePartnerAccount(request, reply);
      }
      
      return reply.code(403).send({ success: false, message: 'Access denied' });
    }
  });

  // Create partner user
  fastify.post('/partner-accounts/:accountId/users', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      // Check if user can create users in this partner account
      const user = request.user;
      const accountId = request.params.accountId;
      
      // ERPS Admin can create users in any partner account
      if (user.role === 'ERPS_ADMIN') {
        return partnerAccountController.createPartnerUser(request, reply);
      }
      
      // Account Admin can create users in their own partner account
      if (user.role === 'PARTNER_USER' && user.partnerRole === 'ACCOUNT_ADMIN' && user.partnerAccountId === accountId) {
        return partnerAccountController.createPartnerUser(request, reply);
      }
      
      return reply.code(403).send({ success: false, message: 'Access denied' });
    }
  });

  // Get partner users
  fastify.get('/partner-accounts/:accountId/users', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      // Check if user can manage users in this partner account
      const user = request.user;
      const accountId = request.params.accountId;
      
      // ERPS Admin can access any partner account
      if (user.role === 'ERPS_ADMIN') {
        return partnerAccountController.getPartnerUsers(request, reply);
      }
      
      // Account Admin can manage users in their own partner account
      if (user.role === 'PARTNER_USER' && user.partnerRole === 'ACCOUNT_ADMIN' && user.partnerAccountId === accountId) {
        return partnerAccountController.getPartnerUsers(request, reply);
      }
      
      return reply.code(403).send({ success: false, message: 'Access denied' });
    }
  });

  // Delete partner account
  fastify.delete('/partner-accounts/:accountId', {
    preHandler: [fastify.authenticate, fastify.authenticateAdmin],
    handler: async (request: any, reply: any) => {
      return partnerAccountController.deletePartnerAccount(request, reply);
    }
  });
}