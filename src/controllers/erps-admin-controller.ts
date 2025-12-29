import { FastifyRequest, FastifyReply } from 'fastify';
import { Repository } from 'typeorm';
import { User } from '../entities/User.js';
import { Warranty } from '../entities/Warranty.js';
import { AnnualInspection } from '../entities/AnnualInspection.js';
import { AuditHistory } from '../entities/AuditHistory.js';
import { AppDataSource } from '../plugins/typeorm.js';
import { CustomerNotificationService } from '../services/customer-notification-service.js';
import Response from '../Traits/ApiResponser.js';

/**
 * ERPS Admin Override Controller
 * Handles manual overrides for warranties and inspections when installer has left organization
 */
export class ERPSAdminController {
  
  /**
   * Manual warranty verification by ERPS Admin
   * Used when installer has left the organization before verifying
   */
  async adminVerifyWarranty(
    request: FastifyRequest<{
      Params: { warrantyId: string };
      Body: { reason: string; notes?: string; skipCustomerNotification?: boolean };
    }>,
    reply: FastifyReply
  ) {
    try {
      const adminUser = (request as any).user;
      const { warrantyId } = request.params;
      const { reason, notes, skipCustomerNotification = false } = request.body;

      if (!reason) {
        return Response.errorResponse(reply, 'Override reason is required', 400);
      }

      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const auditRepo = AppDataSource.getRepository(AuditHistory);

      const warranty = await warrantyRepo.findOne({
        where: { id: warrantyId, isDeleted: false }
      });

      if (!warranty) {
        return Response.errorResponse(reply, 'Warranty not found', 404);
      }

      // Store previous status for audit
      const previousStatus = warranty.verificationStatus;

      // Update warranty to PENDING_CUSTOMER_ACTIVATION (or ACTIVE if skipping customer notification)
      const newStatus = skipCustomerNotification ? 'ACTIVE' : 'PENDING_CUSTOMER_ACTIVATION';
      
      await warrantyRepo.update(warrantyId, {
        verificationStatus: newStatus,
        status: newStatus,
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
        isActive: skipCustomerNotification
      });

      // Create audit history entry with ADMIN_OVERRIDE flag
      await auditRepo.save({
        warrantyId,
        actionType: 'ADMIN_OVERRIDE_VERIFY',
        recordType: 'WARRANTY',
        versionNumber: 1,
        statusBefore: previousStatus,
        statusAfter: newStatus,
        performedBy: adminUser.id,
        performedAt: new Date(),
        reason,
        notes: notes || 'Manual verification by ERPS Admin - Installer unavailable',
        isCurrentVersion: true
      });

      // Send customer notification if not skipped
      if (!skipCustomerNotification && warranty.email && warranty.phoneNumber) {
        const activationToken = CustomerNotificationService.generateActivationToken(
          warrantyId,
          warranty.email,
          warranty.phoneNumber
        );

        // Send email to customer
        await CustomerNotificationService.sendCustomerActivationEmail(
          warranty.email,
          `${warranty.firstName} ${warranty.lastName}`,
          `${warranty.make} ${warranty.model} (${warranty.vinNumber})`,
          activationToken.token,
          warrantyId
        );

        // Send SMS reminder to customer
        await CustomerNotificationService.sendCustomerActivationSMS(
          warranty.phoneNumber,
          `${warranty.firstName} ${warranty.lastName}`,
          `${warranty.make} ${warranty.model}`
        );
      }

      const updatedWarranty = await warrantyRepo.findOne({ where: { id: warrantyId } });

      return Response.showOne(reply, {
        success: true,
        message: skipCustomerNotification 
          ? 'Warranty manually verified and activated by ERPS Admin'
          : 'Warranty manually verified by ERPS Admin. Customer notification sent.',
        data: {
          warranty: updatedWarranty,
          override: {
            performedBy: adminUser.email,
            performedAt: new Date(),
            reason,
            isManualOverride: true
          }
        }
      });

    } catch (error: any) {
      console.error('❌ adminVerifyWarranty error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to verify warranty');
    }
  }

  /**
   * Manual inspection verification by ERPS Admin
   */
  async adminVerifyInspection(
    request: FastifyRequest<{
      Params: { inspectionId: string };
      Body: { reason: string; notes?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const adminUser = (request as any).user;
      const { inspectionId } = request.params;
      const { reason, notes } = request.body;

      if (!reason) {
        return Response.errorResponse(reply, 'Override reason is required', 400);
      }

      const inspectionRepo = AppDataSource.getRepository(AnnualInspection);
      const auditRepo = AppDataSource.getRepository(AuditHistory);

      const inspection = await inspectionRepo.findOne({
        where: { id: inspectionId, isDeleted: false }
      });

      if (!inspection) {
        return Response.errorResponse(reply, 'Inspection not found', 404);
      }

      const previousStatus = inspection.verificationStatus;

      // Calculate warranty extension (12 months from inspection date)
      const warrantyExtendedUntil = new Date(inspection.inspectionDate || new Date());
      warrantyExtendedUntil.setFullYear(warrantyExtendedUntil.getFullYear() + 1);

      await inspectionRepo.update(inspectionId, {
        verificationStatus: 'VERIFIED',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
        warrantyExtendedUntil
      });

      // Create audit history entry
      await auditRepo.save({
        inspectionId,
        actionType: 'ADMIN_OVERRIDE_VERIFY',
        recordType: 'INSPECTION',
        versionNumber: 1,
        statusBefore: previousStatus,
        statusAfter: 'VERIFIED',
        performedBy: adminUser.id,
        performedAt: new Date(),
        reason,
        notes: notes || 'Manual verification by ERPS Admin - Inspector unavailable',
        isCurrentVersion: true
      });

      const updatedInspection = await inspectionRepo.findOne({ where: { id: inspectionId } });

      return Response.showOne(reply, {
        success: true,
        message: 'Inspection manually verified by ERPS Admin',
        data: {
          inspection: updatedInspection,
          override: {
            performedBy: adminUser.email,
            performedAt: new Date(),
            reason,
            isManualOverride: true,
            warrantyExtendedUntil
          }
        }
      });

    } catch (error: any) {
      console.error('❌ adminVerifyInspection error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to verify inspection');
    }
  }

  /**
   * Manual warranty activation by ERPS Admin (skip customer terms acceptance)
   */
  async adminActivateWarranty(
    request: FastifyRequest<{
      Params: { warrantyId: string };
      Body: { reason: string; notes?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const adminUser = (request as any).user;
      const { warrantyId } = request.params;
      const { reason, notes } = request.body;

      if (!reason) {
        return Response.errorResponse(reply, 'Activation reason is required', 400);
      }

      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const auditRepo = AppDataSource.getRepository(AuditHistory);

      const warranty = await warrantyRepo.findOne({
        where: { id: warrantyId, isDeleted: false }
      });

      if (!warranty) {
        return Response.errorResponse(reply, 'Warranty not found', 404);
      }

      const previousStatus = warranty.verificationStatus;

      // Calculate inspection due date (12 months from installation)
      const inspectionDueDate = new Date(warranty.dateInstalled || new Date());
      inspectionDueDate.setFullYear(inspectionDueDate.getFullYear() + 1);

      await warrantyRepo.update(warrantyId, {
        verificationStatus: 'ACTIVE',
        status: 'ACTIVE',
        isActive: true,
        activatedAt: new Date(),
        activatedBy: adminUser.id,
        customerTermsAcceptedAt: new Date(),
        inspectionDueDate
      });

      // Create audit history entry
      await auditRepo.save({
        warrantyId,
        actionType: 'ADMIN_OVERRIDE_ACTIVATE',
        recordType: 'WARRANTY',
        versionNumber: 1,
        statusBefore: previousStatus,
        statusAfter: 'ACTIVE',
        performedBy: adminUser.id,
        performedAt: new Date(),
        reason,
        notes: notes || 'Manual activation by ERPS Admin',
        isCurrentVersion: true
      });

      const updatedWarranty = await warrantyRepo.findOne({ where: { id: warrantyId } });

      return Response.showOne(reply, {
        success: true,
        message: 'Warranty manually activated by ERPS Admin',
        data: {
          warranty: updatedWarranty,
          override: {
            performedBy: adminUser.email,
            performedAt: new Date(),
            reason,
            isManualOverride: true,
            inspectionDueDate
          }
        }
      });

    } catch (error: any) {
      console.error('❌ adminActivateWarranty error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to activate warranty');
    }
  }

  /**
   * Update user role (ERPS Admin only)
   * Allows changing partnerRole (Staff <-> Installer) and reassigning to different account
   */
  async updateUserRole(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: {
        partnerRole?: 'ACCOUNT_ADMIN' | 'ACCOUNT_STAFF' | 'ACCOUNT_INSTALLER';
        partnerAccountId?: string;
        accountStatus?: 'Active' | 'InActive';
        isAccreditedInstaller?: boolean;
        isAuthorisedInspector?: boolean;
        mobileNumber?: string;
        reason: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const adminUser = (request as any).user;
      const { userId } = request.params;
      const { 
        partnerRole, 
        partnerAccountId, 
        accountStatus,
        isAccreditedInstaller,
        isAuthorisedInspector,
        mobileNumber,
        reason 
      } = request.body;

      if (!reason) {
        return Response.errorResponse(reply, 'Change reason is required for audit trail', 400);
      }

      const userRepo = AppDataSource.getRepository(User);
      const auditRepo = AppDataSource.getRepository(AuditHistory);

      const user = await userRepo.findOne({
        where: { id: userId, isDeleted: false }
      });

      if (!user) {
        return Response.errorResponse(reply, 'User not found', 404);
      }

      // Store previous values for audit
      const previousValues = {
        partnerRole: user.partnerRole,
        partnerAccountId: user.partnerAccountId,
        accountStatus: user.accountStatus,
        isAccreditedInstaller: user.isAccreditedInstaller,
        isAuthorisedInspector: user.isAuthorisedInspector
      };

      // Build update object
      const updateData: any = {};
      
      if (partnerRole !== undefined) {
        updateData.partnerRole = partnerRole;
        
        // If changing to ACCOUNT_INSTALLER, ensure mobile number is set
        if (partnerRole === 'ACCOUNT_INSTALLER' && !user.mobileNumber && !mobileNumber) {
          return Response.errorResponse(
            reply, 
            'Mobile number is required for Account Installer role (for SMS verification)', 
            400
          );
        }
      }
      
      if (partnerAccountId !== undefined) {
        updateData.partnerAccountId = partnerAccountId;
      }
      
      if (accountStatus !== undefined) {
        updateData.accountStatus = accountStatus;
      }
      
      if (isAccreditedInstaller !== undefined) {
        updateData.isAccreditedInstaller = isAccreditedInstaller;
      }
      
      if (isAuthorisedInspector !== undefined) {
        updateData.isAuthorisedInspector = isAuthorisedInspector;
      }
      
      if (mobileNumber !== undefined) {
        updateData.mobileNumber = mobileNumber;
      }

      if (Object.keys(updateData).length === 0) {
        return Response.errorResponse(reply, 'No update fields provided', 400);
      }

      await userRepo.update(userId, updateData);

      // Create audit entry for user role change
      await auditRepo.save({
        actionType: 'ADMIN_USER_ROLE_CHANGE',
        recordType: 'USER',
        versionNumber: 1,
        performedBy: adminUser.id,
        performedAt: new Date(),
        reason,
        notes: JSON.stringify({
          userId,
          previousValues,
          newValues: updateData
        }),
        isCurrentVersion: true
      });

      const updatedUser = await userRepo.findOne({ where: { id: userId } });

      // Remove password from response
      if (updatedUser) {
        delete (updatedUser as any).password;
      }

      return Response.showOne(reply, {
        success: true,
        message: 'User role updated successfully',
        data: {
          user: updatedUser,
          changes: {
            previousValues,
            newValues: updateData,
            performedBy: adminUser.email,
            performedAt: new Date(),
            reason
          }
        }
      });

    } catch (error: any) {
      console.error('❌ updateUserRole error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to update user role');
    }
  }

  /**
   * Reassign user to different partner account
   */
  async reassignUserAccount(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: { newPartnerAccountId: string; reason: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const adminUser = (request as any).user;
      const { userId } = request.params;
      const { newPartnerAccountId, reason } = request.body;

      if (!newPartnerAccountId || !reason) {
        return Response.errorResponse(reply, 'New partner account ID and reason are required', 400);
      }

      const userRepo = AppDataSource.getRepository(User);
      const auditRepo = AppDataSource.getRepository(AuditHistory);

      const user = await userRepo.findOne({
        where: { id: userId, isDeleted: false }
      });

      if (!user) {
        return Response.errorResponse(reply, 'User not found', 404);
      }

      const previousAccountId = user.partnerAccountId;

      await userRepo.update(userId, {
        partnerAccountId: newPartnerAccountId
      });

      // Create audit entry
      await auditRepo.save({
        actionType: 'ADMIN_USER_ACCOUNT_REASSIGN',
        recordType: 'USER',
        versionNumber: 1,
        performedBy: adminUser.id,
        performedAt: new Date(),
        reason,
        notes: JSON.stringify({
          userId,
          previousAccountId,
          newAccountId: newPartnerAccountId
        }),
        isCurrentVersion: true
      });

      const updatedUser = await userRepo.findOne({ where: { id: userId } });
      if (updatedUser) {
        delete (updatedUser as any).password;
      }

      return Response.showOne(reply, {
        success: true,
        message: 'User reassigned to new partner account successfully',
        data: {
          user: updatedUser,
          reassignment: {
            previousAccountId,
            newAccountId: newPartnerAccountId,
            performedBy: adminUser.email,
            performedAt: new Date(),
            reason
          }
        }
      });

    } catch (error: any) {
      console.error('❌ reassignUserAccount error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to reassign user');
    }
  }

  /**
   * Get audit history for a warranty (ERPS Admin only)
   */
  async getWarrantyAuditHistory(
    request: FastifyRequest<{ Params: { warrantyId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { warrantyId } = request.params;

      const auditRepo = AppDataSource.getRepository(AuditHistory);
      const userRepo = AppDataSource.getRepository(User);

      const auditEntries = await auditRepo.find({
        where: { warrantyId },
        order: { performedAt: 'DESC' }
      });

      // Enrich with user details
      const enrichedEntries = await Promise.all(
        auditEntries.map(async (entry) => {
          const performer = await userRepo.findOne({
            where: { id: entry.performedBy },
            select: ['id', 'email', 'fullName', 'role', 'partnerRole']
          });
          return {
            ...entry,
            performedByUser: performer
          };
        })
      );

      return Response.showOne(reply, {
        success: true,
        message: 'Audit history retrieved successfully',
        data: {
          warrantyId,
          totalEntries: enrichedEntries.length,
          auditHistory: enrichedEntries
        }
      });

    } catch (error: any) {
      console.error('❌ getWarrantyAuditHistory error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to retrieve audit history');
    }
  }

  /**
   * Get audit history for an inspection (ERPS Admin only)
   */
  async getInspectionAuditHistory(
    request: FastifyRequest<{ Params: { inspectionId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { inspectionId } = request.params;

      const auditRepo = AppDataSource.getRepository(AuditHistory);
      const userRepo = AppDataSource.getRepository(User);

      const auditEntries = await auditRepo.find({
        where: { inspectionId },
        order: { performedAt: 'DESC' }
      });

      const enrichedEntries = await Promise.all(
        auditEntries.map(async (entry) => {
          const performer = await userRepo.findOne({
            where: { id: entry.performedBy },
            select: ['id', 'email', 'fullName', 'role', 'partnerRole']
          });
          return {
            ...entry,
            performedByUser: performer
          };
        })
      );

      return Response.showOne(reply, {
        success: true,
        message: 'Audit history retrieved successfully',
        data: {
          inspectionId,
          totalEntries: enrichedEntries.length,
          auditHistory: enrichedEntries
        }
      });

    } catch (error: any) {
      console.error('❌ getInspectionAuditHistory error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to retrieve audit history');
    }
  }
}

export const erpsAdminController = new ERPSAdminController();
