import { FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '../plugins/typeorm.js';
import { Warranty } from '../entities/Warranty.js';
import { AuditHistory } from '../entities/AuditHistory.js';
import { CustomerNotificationService } from '../services/customer-notification-service.js';
import Response from '../Traits/ApiResponser.js';

/**
 * Customer Warranty Activation Controller
 * Handles customer terms acceptance and warranty activation
 * These endpoints are PUBLIC (no authentication required)
 */
export class CustomerActivationController {

  /**
   * Get warranty details for customer activation page
   * Public endpoint - accessed via activation token
   */
  async getActivationDetails(
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { token } = request.params;

      // Validate token
      const activationData = CustomerNotificationService.validateActivationToken(token);
      
      if (!activationData) {
        return Response.errorResponse(reply, 'Invalid or expired activation link', 400);
      }

      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const warranty = await warrantyRepo.findOne({
        where: { id: activationData.warrantyId, isDeleted: false }
      });

      if (!warranty) {
        return Response.errorResponse(reply, 'Warranty not found', 404);
      }

      // Check if already activated
      if (warranty.verificationStatus === 'ACTIVE' || warranty.isActive) {
        return Response.showOne(reply, {
          success: true,
          message: 'Warranty is already activated',
          data: {
            alreadyActivated: true,
            warranty: {
              id: warranty.id,
              customerName: `${warranty.firstName} ${warranty.lastName}`,
              vehicle: `${warranty.make} ${warranty.model}`,
              vinNumber: warranty.vinNumber,
              status: warranty.verificationStatus,
              activatedAt: warranty.activatedAt
            }
          }
        });
      }

      return Response.showOne(reply, {
        success: true,
        message: 'Activation details retrieved successfully',
        data: {
          alreadyActivated: false,
          warranty: {
            id: warranty.id,
            customerName: `${warranty.firstName} ${warranty.lastName}`,
            companyName: warranty.companyName,
            vehicle: `${warranty.make} ${warranty.model}`,
            vinNumber: warranty.vinNumber,
            registrationNumber: warranty.registrationNumber,
            installationDate: warranty.dateInstalled,
            installerName: warranty.installersName,
            generatorSerialNumber: warranty.generatorSerialNumber,
            status: warranty.verificationStatus
          },
          tokenExpiresAt: activationData.expiresAt
        }
      });

    } catch (error: any) {
      console.error('❌ getActivationDetails error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to retrieve activation details');
    }
  }

  /**
   * Get warranty terms and conditions for customer review
   * Public endpoint
   */
  async getWarrantyTerms(
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { token } = request.params;

      // Validate token
      const activationData = CustomerNotificationService.validateActivationToken(token);
      
      if (!activationData) {
        return Response.errorResponse(reply, 'Invalid or expired activation link', 400);
      }

      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const warranty = await warrantyRepo.findOne({
        where: { id: activationData.warrantyId, isDeleted: false },
        relations: ['warrantyTerms']
      });

      if (!warranty) {
        return Response.errorResponse(reply, 'Warranty not found', 404);
      }

      // Get warranty terms
      const terms = (warranty as any).warrantyTerms;

      return Response.showOne(reply, {
        success: true,
        message: 'Warranty terms retrieved successfully',
        data: {
          warrantyId: warranty.id,
          terms: terms ? {
            warrantyName: terms.warrantyName,
            description: terms.description,
            termsAndConditions: terms.termsAndConditions,
            revision: terms.revision
          } : {
            warrantyName: 'ERPS Standard Warranty',
            description: 'Electronic Rust Protection System Warranty',
            termsAndConditions: `
ERPS WARRANTY TERMS AND CONDITIONS

1. WARRANTY COVERAGE
This warranty covers the ERPS (Electronic Rust Protection System) installed in your vehicle against defects in materials and workmanship.

2. WARRANTY PERIOD
The warranty is valid for the period specified at the time of installation, subject to annual inspections being completed on time.

3. ANNUAL INSPECTION REQUIREMENT
To maintain warranty coverage, you must complete an annual inspection within 12 months of installation and each subsequent year. A 60-day grace period is provided after the due date.

4. CUSTOMER RESPONSIBILITIES
- Ensure annual inspections are completed on time
- Report any issues promptly to your ERPS installer
- Maintain the vehicle in reasonable condition
- Not tamper with or modify the ERPS system

5. EXCLUSIONS
This warranty does not cover:
- Damage caused by accidents, misuse, or neglect
- Modifications made to the ERPS system
- Damage from unauthorized repairs
- Normal wear and tear
- Consequential damages

6. CLAIMS PROCESS
To make a warranty claim, contact your ERPS installer or ERPS support at support@erps.com.au

7. LIMITATION OF LIABILITY
ERPS liability is limited to repair or replacement of the ERPS system at our discretion.

By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by these warranty terms and conditions.
            `.trim(),
            revision: '1.0'
          }
        }
      });

    } catch (error: any) {
      console.error('❌ getWarrantyTerms error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to retrieve warranty terms');
    }
  }

  /**
   * Accept warranty terms and activate warranty
   * Public endpoint - accessed via activation token
   */
  async acceptTermsAndActivate(
    request: FastifyRequest<{
      Params: { token: string };
      Body: {
        acceptTerms: boolean;
        customerSignature?: string;
        customerIpAddress?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { token } = request.params;
      const { acceptTerms, customerSignature } = request.body;

      if (!acceptTerms) {
        return Response.errorResponse(reply, 'You must accept the terms and conditions to activate your warranty', 400);
      }

      // Validate token
      const activationData = CustomerNotificationService.validateActivationToken(token);
      
      if (!activationData) {
        return Response.errorResponse(reply, 'Invalid or expired activation link', 400);
      }

      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const auditRepo = AppDataSource.getRepository(AuditHistory);

      const warranty = await warrantyRepo.findOne({
        where: { id: activationData.warrantyId, isDeleted: false }
      });

      if (!warranty) {
        return Response.errorResponse(reply, 'Warranty not found', 404);
      }

      // Check if already activated
      if (warranty.verificationStatus === 'ACTIVE' || warranty.isActive) {
        return Response.errorResponse(reply, 'Warranty is already activated', 400);
      }

      const previousStatus = warranty.verificationStatus;

      // Calculate inspection due date (12 months from installation)
      const inspectionDueDate = new Date(warranty.dateInstalled || new Date());
      inspectionDueDate.setFullYear(inspectionDueDate.getFullYear() + 1);

      // Get customer IP address
      const customerIpAddress = request.ip || request.headers['x-forwarded-for'] || 'unknown';

      // Activate warranty
      await warrantyRepo.update(activationData.warrantyId, {
        verificationStatus: 'ACTIVE',
        status: 'ACTIVE',
        isActive: true,
        activatedAt: new Date(),
        customerTermsAcceptedAt: new Date(),
        customerTermsAcceptedIp: customerIpAddress as string,
        inspectionDueDate
      });

      // Create audit history entry
      await auditRepo.save({
        warrantyId: activationData.warrantyId,
        actionType: 'CUSTOMER_TERMS_ACCEPTED',
        recordType: 'WARRANTY',
        versionNumber: 1,
        statusBefore: previousStatus,
        statusAfter: 'ACTIVE',
        performedBy: activationData.warrantyId, // Use warranty ID as performer for customer actions
        performedAt: new Date(),
        reason: 'Customer accepted terms and conditions',
        notes: JSON.stringify({
          customerEmail: activationData.customerEmail,
          customerIpAddress,
          acceptedAt: new Date().toISOString(),
          hasSignature: !!customerSignature
        }),
        ipAddress: customerIpAddress as string,
        isCurrentVersion: true
      });

      // Remove activation token
      CustomerNotificationService.removeActivationToken(token);

      const updatedWarranty = await warrantyRepo.findOne({ where: { id: activationData.warrantyId } });

      return Response.showOne(reply, {
        success: true,
        message: 'Warranty activated successfully! Your ERPS warranty is now active.',
        data: {
          warranty: {
            id: updatedWarranty?.id,
            customerName: `${updatedWarranty?.firstName} ${updatedWarranty?.lastName}`,
            vehicle: `${updatedWarranty?.make} ${updatedWarranty?.model}`,
            vinNumber: updatedWarranty?.vinNumber,
            status: updatedWarranty?.verificationStatus,
            isActive: updatedWarranty?.isActive,
            activatedAt: updatedWarranty?.activatedAt,
            inspectionDueDate
          },
          nextSteps: {
            message: 'Your warranty is now active. Remember to complete your annual inspection to maintain coverage.',
            inspectionDueDate,
            reminderNote: 'You will receive a reminder email 30 days before your inspection is due.'
          }
        }
      });

    } catch (error: any) {
      console.error('❌ acceptTermsAndActivate error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to activate warranty');
    }
  }

  /**
   * Resend activation email to customer
   * Can be called by ERPS Admin or Partner Admin
   */
  async resendActivationEmail(
    request: FastifyRequest<{ Params: { warrantyId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { warrantyId } = request.params;
      const currentUser = (request as any).user;

      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const warranty = await warrantyRepo.findOne({
        where: { id: warrantyId, isDeleted: false }
      });

      if (!warranty) {
        return Response.errorResponse(reply, 'Warranty not found', 404);
      }

      // Check if warranty is in correct state
      if (warranty.verificationStatus !== 'PENDING_CUSTOMER_ACTIVATION') {
        return Response.errorResponse(
          reply, 
          `Cannot resend activation email. Warranty status is: ${warranty.verificationStatus}`, 
          400
        );
      }

      if (!warranty.email || !warranty.phoneNumber) {
        return Response.errorResponse(reply, 'Customer email or phone number not found', 400);
      }

      // Generate new activation token
      const activationToken = CustomerNotificationService.generateActivationToken(
        warrantyId,
        warranty.email,
        warranty.phoneNumber
      );

      // Send email
      await CustomerNotificationService.sendCustomerActivationEmail(
        warranty.email,
        `${warranty.firstName} ${warranty.lastName}`,
        `${warranty.make} ${warranty.model} (${warranty.vinNumber})`,
        activationToken.token,
        warrantyId
      );

      // Send SMS
      await CustomerNotificationService.sendCustomerActivationSMS(
        warranty.phoneNumber,
        `${warranty.firstName} ${warranty.lastName}`,
        `${warranty.make} ${warranty.model}`
      );

      return Response.showOne(reply, {
        success: true,
        message: 'Activation email and SMS resent successfully',
        data: {
          warrantyId,
          sentTo: {
            email: warranty.email,
            phone: warranty.phoneNumber
          },
          tokenExpiresAt: activationToken.expiresAt
        }
      });

    } catch (error: any) {
      console.error('❌ resendActivationEmail error:', error);
      return Response.errorResponse(reply, error.message || 'Failed to resend activation email');
    }
  }
}

export const customerActivationController = new CustomerActivationController();
