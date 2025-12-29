import { FastifyRequest, FastifyReply } from 'fastify';
import Response from '../Traits/ApiResponser.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ERPS_ADMIN' | 'PARTNER_USER';
  partnerRole?: 'ACCOUNT_ADMIN' | 'ACCOUNT_STAFF' | 'ACCOUNT_INSTALLER';
  partnerAccountId?: string;
  adminLoginAs?: boolean;
  originalAdminId?: string;
}

/**
 * Middleware to ensure user is authenticated
 */
export const requireAuth = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return Response.errorResponse(reply, 'Authentication token required', 401);
    }

    const decoded = req.server.jwt.verify(token) as AuthenticatedUser;
    (req as any).user = decoded;
  } catch (err: any) {
    return Response.errorResponse(reply, 'Invalid or expired token', 401);
  }
};

/**
 * Middleware to ensure user is ERPS Admin
 */
export const requireERPSAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = (req as any).user as AuthenticatedUser;
  
  if (!user) {
    return Response.errorResponse(reply, 'Authentication required', 401);
  }

  if (user.role !== 'ERPS_ADMIN') {
    return Response.errorResponse(reply, 'ERPS Admin access required', 403);
  }
};

/**
 * Middleware to ensure user is a Partner User
 */
export const requirePartnerUser = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = (req as any).user as AuthenticatedUser;
  
  if (!user) {
    return Response.errorResponse(reply, 'Authentication required', 401);
  }

  if (user.role !== 'PARTNER_USER') {
    return Response.errorResponse(reply, 'Partner user access required', 403);
  }

  if (!user.partnerAccountId) {
    return Response.errorResponse(reply, 'Partner account association required', 403);
  }
};

/**
 * Middleware to ensure user is Account Admin or ERPS Admin
 */
export const requireAccountAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = (req as any).user as AuthenticatedUser;
  
  if (!user) {
    return Response.errorResponse(reply, 'Authentication required', 401);
  }

  const isERPSAdmin = user.role === 'ERPS_ADMIN';
  const isAccountAdmin = user.role === 'PARTNER_USER' && user.partnerRole === 'ACCOUNT_ADMIN';

  if (!isERPSAdmin && !isAccountAdmin) {
    return Response.errorResponse(reply, 'Account Admin or ERPS Admin access required', 403);
  }
};

/**
 * Middleware to ensure user is Account Installer
 */
export const requireAccountInstaller = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = (req as any).user as AuthenticatedUser;
  
  if (!user) {
    return Response.errorResponse(reply, 'Authentication required', 401);
  }

  if (user.role !== 'PARTNER_USER' || user.partnerRole !== 'ACCOUNT_INSTALLER') {
    return Response.errorResponse(reply, 'Account Installer access required', 403);
  }
};

/**
 * Middleware to ensure user can access partner account data
 * (ERPS Admin can access any, Partner Users can only access their own)
 */
export const requirePartnerAccess = (paramName: string = 'partnerId') => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user as AuthenticatedUser;
    const targetPartnerId = (req.params as any)[paramName];
    
    if (!user) {
      return Response.errorResponse(reply, 'Authentication required', 401);
    }

    // ERPS Admin can access any partner account
    if (user.role === 'ERPS_ADMIN') {
      return;
    }

    // Partner users can only access their own account
    if (user.role === 'PARTNER_USER') {
      if (!user.partnerAccountId) {
        return Response.errorResponse(reply, 'Partner account association required', 403);
      }

      if (user.partnerAccountId !== targetPartnerId) {
        return Response.errorResponse(reply, 'Access denied to this partner account', 403);
      }

      return;
    }

    return Response.errorResponse(reply, 'Invalid user role', 403);
  };
};

/**
 * Middleware to ensure user can manage users within a partner account
 * (ERPS Admin or Account Admin only)
 */
export const requireUserManagement = (paramName: string = 'partnerId') => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user as AuthenticatedUser;
    const targetPartnerId = (req.params as any)[paramName];
    
    if (!user) {
      return Response.errorResponse(reply, 'Authentication required', 401);
    }

    // ERPS Admin can manage users in any partner account
    if (user.role === 'ERPS_ADMIN') {
      return;
    }

    // Account Admin can manage users in their own partner account
    if (user.role === 'PARTNER_USER' && user.partnerRole === 'ACCOUNT_ADMIN') {
      if (!user.partnerAccountId) {
        return Response.errorResponse(reply, 'Partner account association required', 403);
      }

      if (user.partnerAccountId !== targetPartnerId) {
        return Response.errorResponse(reply, 'Access denied to this partner account', 403);
      }

      return;
    }

    return Response.errorResponse(reply, 'User management access required', 403);
  };
};

/**
 * Middleware to check if user can verify installations/inspections
 * Only Account Installers can verify their own work
 */
export const requireVerificationAccess = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = (req as any).user as AuthenticatedUser;
  
  if (!user) {
    return Response.errorResponse(reply, 'Authentication required', 401);
  }

  if (user.role !== 'PARTNER_USER' || user.partnerRole !== 'ACCOUNT_INSTALLER') {
    return Response.errorResponse(reply, 'Only Account Installers can verify work', 403);
  }
};

/**
 * Helper function to check if user has specific permissions
 */
export const hasPermission = (user: AuthenticatedUser, permission: string): boolean => {
  switch (permission) {
    case 'MANAGE_PARTNERS':
      return user.role === 'ERPS_ADMIN';
    
    case 'MANAGE_USERS':
      return user.role === 'ERPS_ADMIN' || 
             (user.role === 'PARTNER_USER' && user.partnerRole === 'ACCOUNT_ADMIN');
    
    case 'CREATE_WARRANTY':
    case 'CREATE_INSPECTION':
      return user.role === 'ERPS_ADMIN' || user.role === 'PARTNER_USER';
    
    case 'VERIFY_WORK':
      return user.role === 'PARTNER_USER' && user.partnerRole === 'ACCOUNT_INSTALLER';
    
    case 'VIEW_ALL_DATA':
      return user.role === 'ERPS_ADMIN';
    
    case 'ADMIN_OVERRIDE':
      return user.role === 'ERPS_ADMIN';
    
    default:
      return false;
  }
};

/**
 * Helper function to get user's accessible partner account IDs
 */
export const getAccessiblePartnerIds = (user: AuthenticatedUser): string[] => {
  if (user.role === 'ERPS_ADMIN') {
    return ['*']; // Admin can access all
  }
  
  if (user.role === 'PARTNER_USER' && user.partnerAccountId) {
    return [user.partnerAccountId];
  }
  
  return [];
};