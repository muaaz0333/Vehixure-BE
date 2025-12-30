import { partnerAccountController } from "../controllers/partner-account-controller.js";
export default async function partnerRoutes(fastify) {
  fastify.post("/partner-accounts", {
    preHandler: [fastify.authenticate, fastify.authenticateAdmin],
    handler: async (request, reply) => {
      return partnerAccountController.createPartnerAccount(request, reply);
    }
  });
  fastify.get("/partner-accounts", {
    preHandler: [fastify.authenticate, fastify.authenticateAdmin],
    handler: async (request, reply) => {
      return partnerAccountController.getPartnerAccounts(request, reply);
    }
  });
  fastify.get("/partner-accounts/:accountId", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user;
      const accountId = request.params.accountId;
      if (user.role === "ERPS_ADMIN") {
        return partnerAccountController.getPartnerAccountById(request, reply);
      }
      if (user.role === "PARTNER_USER" && user.partnerAccountId === accountId) {
        return partnerAccountController.getPartnerAccountById(request, reply);
      }
      return reply.code(403).send({ success: false, message: "Access denied" });
    }
  });
  fastify.put("/partner-accounts/:accountId", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user;
      const accountId = request.params.accountId;
      if (user.role === "ERPS_ADMIN") {
        return partnerAccountController.updatePartnerAccount(request, reply);
      }
      if (user.role === "PARTNER_USER" && user.partnerRole === "ACCOUNT_ADMIN" && user.partnerAccountId === accountId) {
        return partnerAccountController.updatePartnerAccount(request, reply);
      }
      return reply.code(403).send({ success: false, message: "Access denied" });
    }
  });
  fastify.post("/partner-accounts/:accountId/users", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user;
      const accountId = request.params.accountId;
      if (user.role === "ERPS_ADMIN") {
        return partnerAccountController.createPartnerUser(request, reply);
      }
      if (user.role === "PARTNER_USER" && user.partnerRole === "ACCOUNT_ADMIN" && user.partnerAccountId === accountId) {
        return partnerAccountController.createPartnerUser(request, reply);
      }
      return reply.code(403).send({ success: false, message: "Access denied" });
    }
  });
  fastify.get("/partner-accounts/:accountId/users", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user;
      const accountId = request.params.accountId;
      if (user.role === "ERPS_ADMIN") {
        return partnerAccountController.getPartnerUsers(request, reply);
      }
      if (user.role === "PARTNER_USER" && user.partnerRole === "ACCOUNT_ADMIN" && user.partnerAccountId === accountId) {
        return partnerAccountController.getPartnerUsers(request, reply);
      }
      return reply.code(403).send({ success: false, message: "Access denied" });
    }
  });
  fastify.delete("/partner-accounts/:accountId", {
    preHandler: [fastify.authenticate, fastify.authenticateAdmin],
    handler: async (request, reply) => {
      return partnerAccountController.deletePartnerAccount(request, reply);
    }
  });
}
