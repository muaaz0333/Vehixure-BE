import fp from "fastify-plugin";
export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
    console.log("\u2705 JWT verified for user:", request.user);
  } catch (err) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
}
export async function authenticateAdmin(request, reply) {
  try {
    await request.jwtVerify();
    const user = request.user;
    console.log("User role for ERPS Admin check:", user.role);
    if (user.role !== "ERPS_ADMIN") {
      console.log("\u274C ERPS Admin authentication failed for user:", user);
      return reply.code(403).send({ message: "Forbidden: ERPS Admin only" });
    }
    console.log("\u2705 ERPS Admin authenticated:", user);
  } catch (err) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
}
export async function authenticatePartnerUser(request, reply) {
  try {
    await request.jwtVerify();
    const user = request.user;
    if (user.role !== "PARTNER_USER") {
      return reply.code(403).send({ message: "Forbidden: Partner users only" });
    }
    console.log("\u2705 Partner user authenticated:", user);
  } catch (err) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
}
export async function authenticateAccountInstaller(request, reply) {
  try {
    await request.jwtVerify();
    const user = request.user;
    if (user.role !== "PARTNER_USER" || user.partnerRole !== "ACCOUNT_INSTALLER") {
      return reply.code(403).send({ message: "Forbidden: Account Installers only" });
    }
    console.log("\u2705 Account Installer authenticated:", user);
  } catch (err) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
}
export async function authenticatePartnerUserOrAdmin(request, reply) {
  try {
    await request.jwtVerify();
    const user = request.user;
    if (user.role !== "PARTNER_USER" && user.role !== "ERPS_ADMIN") {
      return reply.code(403).send({ message: "Forbidden: Partner users or ERPS Admin only" });
    }
    console.log("\u2705 Partner user or ERPS Admin authenticated:", user);
  } catch (err) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
}
export async function authenticateOwnResourceOrAdmin(request, reply) {
  try {
    await request.jwtVerify();
    const user = request.user;
    const { userId } = request.params;
    if (user.role === "ERPS_ADMIN") {
      console.log("\u2705 ERPS Admin accessing resource:", user);
      return;
    }
    if (user.id !== userId) {
      return reply.code(403).send({ message: "Forbidden: Can only access your own resources" });
    }
    console.log("\u2705 User accessing own resource:", user);
  } catch (err) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
}
const authMiddleware = fp(async (fastify) => {
  fastify.decorate("authenticate", authenticate);
  fastify.decorate("authenticateAdmin", authenticateAdmin);
  fastify.decorate("authenticatePartnerUser", authenticatePartnerUser);
  fastify.decorate("authenticateAccountInstaller", authenticateAccountInstaller);
  fastify.decorate("authenticatePartnerUserOrAdmin", authenticatePartnerUserOrAdmin);
  fastify.decorate("authenticateOwnResourceOrAdmin", authenticateOwnResourceOrAdmin);
});
export default authMiddleware;
