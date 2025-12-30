import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import uploadRoutes from "./upload.js";
import adminRoutes from "./admin.js";
import partnerRoutes from "./partner-simple.js";
import warrantyRegistrationRoutes from "./warranty-registration.js";
import annualInspectionRoutes from "./annual-inspection.js";
import verificationRoutes from "./verification.js";
import verificationEndpoints from "./verification-endpoints.js";
import dashboardRoutes from "./dashboard.js";
import erpsAdminRoutes from "./erps-admin.js";
import customerActivationRoutes from "./customer-activation.js";
const routes = async (server) => {
  server.get("/", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            timestamp: { type: "string" }
          }
        }
      },
      tags: ["Health"],
      summary: "API Health Check"
    }
  }, async () => ({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }));
  await server.register(verificationEndpoints, { prefix: "/api/v1" });
  await server.register(customerActivationRoutes, { prefix: "/api/v1/customer" });
  await server.register(authRoutes, { prefix: "/api/v1/auth" });
  await server.register(userRoutes, { prefix: "/api/v1/users" });
  await server.register(uploadRoutes, { prefix: "/api/v1/upload" });
  await server.register(adminRoutes, { prefix: "/api/v1/admin" });
  await server.register(partnerRoutes, { prefix: "/api/v1/admin" });
  await server.register(erpsAdminRoutes, { prefix: "/api/v1/erps-admin" });
  await server.register(warrantyRegistrationRoutes, { prefix: "/api/v1" });
  await server.register(annualInspectionRoutes, { prefix: "/api/v1" });
  await server.register(verificationRoutes, { prefix: "/api/v1/verify" });
  await server.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });
};
export default routes;
