import Response from "../Traits/ApiResponser.js";
export const requireAuth = async (req, reply) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return Response.errorResponse(reply, "Authentication token required", 401);
    }
    const decoded = req.server.jwt.verify(token);
    req.user = decoded;
  } catch (err) {
    return Response.errorResponse(reply, "Invalid or expired token", 401);
  }
};
export const requireERPSAdmin = async (req, reply) => {
  const user = req.user;
  if (!user) {
    return Response.errorResponse(reply, "Authentication required", 401);
  }
  if (user.role !== "ERPS_ADMIN") {
    return Response.errorResponse(reply, "ERPS Admin access required", 403);
  }
};
export const requirePartnerUser = async (req, reply) => {
  const user = req.user;
  if (!user) {
    return Response.errorResponse(reply, "Authentication required", 401);
  }
  if (user.role !== "PARTNER_USER") {
    return Response.errorResponse(reply, "Partner user access required", 403);
  }
  if (!user.partnerAccountId) {
    return Response.errorResponse(reply, "Partner account association required", 403);
  }
};
export const requireAccountAdmin = async (req, reply) => {
  const user = req.user;
  if (!user) {
    return Response.errorResponse(reply, "Authentication required", 401);
  }
  const isERPSAdmin = user.role === "ERPS_ADMIN";
  const isAccountAdmin = user.role === "PARTNER_USER" && user.partnerRole === "ACCOUNT_ADMIN";
  if (!isERPSAdmin && !isAccountAdmin) {
    return Response.errorResponse(reply, "Account Admin or ERPS Admin access required", 403);
  }
};
export const requireAccountInstaller = async (req, reply) => {
  const user = req.user;
  if (!user) {
    return Response.errorResponse(reply, "Authentication required", 401);
  }
  if (user.role !== "PARTNER_USER" || user.partnerRole !== "ACCOUNT_INSTALLER") {
    return Response.errorResponse(reply, "Account Installer access required", 403);
  }
};
export const requirePartnerAccess = (paramName = "partnerId") => {
  return async (req, reply) => {
    const user = req.user;
    const targetPartnerId = req.params[paramName];
    if (!user) {
      return Response.errorResponse(reply, "Authentication required", 401);
    }
    if (user.role === "ERPS_ADMIN") {
      return;
    }
    if (user.role === "PARTNER_USER") {
      if (!user.partnerAccountId) {
        return Response.errorResponse(reply, "Partner account association required", 403);
      }
      if (user.partnerAccountId !== targetPartnerId) {
        return Response.errorResponse(reply, "Access denied to this partner account", 403);
      }
      return;
    }
    return Response.errorResponse(reply, "Invalid user role", 403);
  };
};
export const requireUserManagement = (paramName = "partnerId") => {
  return async (req, reply) => {
    const user = req.user;
    const targetPartnerId = req.params[paramName];
    if (!user) {
      return Response.errorResponse(reply, "Authentication required", 401);
    }
    if (user.role === "ERPS_ADMIN") {
      return;
    }
    if (user.role === "PARTNER_USER" && user.partnerRole === "ACCOUNT_ADMIN") {
      if (!user.partnerAccountId) {
        return Response.errorResponse(reply, "Partner account association required", 403);
      }
      if (user.partnerAccountId !== targetPartnerId) {
        return Response.errorResponse(reply, "Access denied to this partner account", 403);
      }
      return;
    }
    return Response.errorResponse(reply, "User management access required", 403);
  };
};
export const requireVerificationAccess = async (req, reply) => {
  const user = req.user;
  if (!user) {
    return Response.errorResponse(reply, "Authentication required", 401);
  }
  if (user.role !== "PARTNER_USER" || user.partnerRole !== "ACCOUNT_INSTALLER") {
    return Response.errorResponse(reply, "Only Account Installers can verify work", 403);
  }
};
export const hasPermission = (user, permission) => {
  switch (permission) {
    case "MANAGE_PARTNERS":
      return user.role === "ERPS_ADMIN";
    case "MANAGE_USERS":
      return user.role === "ERPS_ADMIN" || user.role === "PARTNER_USER" && user.partnerRole === "ACCOUNT_ADMIN";
    case "CREATE_WARRANTY":
    case "CREATE_INSPECTION":
      return user.role === "ERPS_ADMIN" || user.role === "PARTNER_USER";
    case "VERIFY_WORK":
      return user.role === "PARTNER_USER" && user.partnerRole === "ACCOUNT_INSTALLER";
    case "VIEW_ALL_DATA":
      return user.role === "ERPS_ADMIN";
    case "ADMIN_OVERRIDE":
      return user.role === "ERPS_ADMIN";
    default:
      return false;
  }
};
export const getAccessiblePartnerIds = (user) => {
  if (user.role === "ERPS_ADMIN") {
    return ["*"];
  }
  if (user.role === "PARTNER_USER" && user.partnerAccountId) {
    return [user.partnerAccountId];
  }
  return [];
};
