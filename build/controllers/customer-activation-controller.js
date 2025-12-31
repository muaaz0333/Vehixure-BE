import { AppDataSource } from "../plugins/typeorm.js";
import { Warranty } from "../entities/Warranty.js";
import { AuditHistory } from "../entities/AuditHistory.js";
import { CustomerNotificationService } from "../services/customer-notification-service.js";
import Response from "../Traits/ApiResponser.js";
export class CustomerActivationController {
  /**
   * Get warranty details for customer activation page
   * Public endpoint - accessed via activation token
   */
  async getActivationDetails(request, reply) {
    try {
      const { token } = request.params;
      const activationData = await CustomerNotificationService.validateActivationToken(token);
      if (!activationData) {
        return Response.errorResponse(reply, "Invalid or expired activation link", 400);
      }
      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const warranty = await warrantyRepo.findOne({
        where: { id: activationData.warrantyId, isDeleted: false }
      });
      if (!warranty) {
        return Response.errorResponse(reply, "Warranty not found", 404);
      }
      if (warranty.verificationStatus === "ACTIVE" || warranty.isActive) {
        return Response.showOne(reply, {
          success: true,
          message: "Warranty is already activated",
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
        message: "Activation details retrieved successfully",
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
    } catch (error) {
      console.error("\u274C getActivationDetails error:", error);
      return Response.errorResponse(reply, error.message || "Failed to retrieve activation details");
    }
  }
  /**
   * Get warranty terms and conditions for customer review
   * Public endpoint
   */
  async getWarrantyTerms(request, reply) {
    try {
      const { token } = request.params;
      const activationData = await CustomerNotificationService.validateActivationToken(token);
      if (!activationData) {
        return Response.errorResponse(reply, "Invalid or expired activation link", 400);
      }
      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const warranty = await warrantyRepo.findOne({
        where: { id: activationData.warrantyId, isDeleted: false },
        relations: ["warrantyTerms"]
      });
      if (!warranty) {
        return Response.errorResponse(reply, "Warranty not found", 404);
      }
      const terms = warranty.warrantyTerms;
      return Response.showOne(reply, {
        success: true,
        message: "Warranty terms retrieved successfully",
        data: {
          warrantyId: warranty.id,
          terms: terms ? {
            warrantyName: terms.warrantyName,
            description: terms.description,
            termsAndConditions: terms.termsAndConditions,
            revision: terms.revision
          } : {
            warrantyName: "ERPS Standard Warranty",
            description: "Electronic Rust Protection System Warranty",
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
            revision: "1.0"
          }
        }
      });
    } catch (error) {
      console.error("\u274C getWarrantyTerms error:", error);
      return Response.errorResponse(reply, error.message || "Failed to retrieve warranty terms");
    }
  }
  /**
   * Accept warranty terms and activate warranty
   * Public endpoint - accessed via activation token
   */
  async acceptTermsAndActivate(request, reply) {
    try {
      const { token } = request.params;
      const { acceptTerms, customerSignature } = request.body;
      if (!acceptTerms) {
        return Response.errorResponse(reply, "You must accept the terms and conditions to activate your warranty", 400);
      }
      const activationData = await CustomerNotificationService.validateActivationToken(token);
      if (!activationData) {
        return Response.errorResponse(reply, "Invalid or expired activation link", 400);
      }
      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const auditRepo = AppDataSource.getRepository(AuditHistory);
      const warranty = await warrantyRepo.findOne({
        where: { id: activationData.warrantyId, isDeleted: false }
      });
      if (!warranty) {
        return Response.errorResponse(reply, "Warranty not found", 404);
      }
      if (warranty.verificationStatus === "ACTIVE" || warranty.isActive) {
        return Response.errorResponse(reply, "Warranty is already activated", 400);
      }
      const previousStatus = warranty.verificationStatus;
      const inspectionDueDate = new Date(warranty.dateInstalled || /* @__PURE__ */ new Date());
      inspectionDueDate.setFullYear(inspectionDueDate.getFullYear() + 1);
      const customerIpAddress = request.ip || request.headers["x-forwarded-for"] || "unknown";
      await warrantyRepo.update(activationData.warrantyId, {
        verificationStatus: "ACTIVE",
        status: "ACTIVE",
        isActive: true,
        activatedAt: /* @__PURE__ */ new Date(),
        customerTermsAcceptedAt: /* @__PURE__ */ new Date(),
        customerTermsAcceptedIp: customerIpAddress,
        inspectionDueDate
      });
      await auditRepo.save({
        warrantyId: activationData.warrantyId,
        actionType: "CUSTOMER_TERMS_ACCEPTED",
        recordType: "WARRANTY",
        versionNumber: 1,
        statusBefore: previousStatus,
        statusAfter: "ACTIVE",
        performedBy: activationData.warrantyId,
        // Use warranty ID as performer for customer actions
        performedAt: /* @__PURE__ */ new Date(),
        reason: "Customer accepted terms and conditions",
        notes: JSON.stringify({
          customerEmail: activationData.customerEmail,
          customerIpAddress,
          acceptedAt: (/* @__PURE__ */ new Date()).toISOString(),
          hasSignature: !!customerSignature
        }),
        ipAddress: customerIpAddress,
        isCurrentVersion: true
      });
      await CustomerNotificationService.removeActivationToken(token);
      const updatedWarranty = await warrantyRepo.findOne({ where: { id: activationData.warrantyId } });
      return Response.showOne(reply, {
        success: true,
        message: "Warranty activated successfully! Your ERPS warranty is now active.",
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
            message: "Your warranty is now active. Remember to complete your annual inspection to maintain coverage.",
            inspectionDueDate,
            reminderNote: "You will receive a reminder email 30 days before your inspection is due."
          }
        }
      });
    } catch (error) {
      console.error("\u274C acceptTermsAndActivate error:", error);
      return Response.errorResponse(reply, error.message || "Failed to activate warranty");
    }
  }
  /**
   * Resend activation email to customer
   * Can be called by ERPS Admin or Partner Admin
   */
  async resendActivationEmail(request, reply) {
    try {
      const { warrantyId } = request.params;
      const currentUser = request.user;
      const warrantyRepo = AppDataSource.getRepository(Warranty);
      const warranty = await warrantyRepo.findOne({
        where: { id: warrantyId, isDeleted: false }
      });
      if (!warranty) {
        return Response.errorResponse(reply, "Warranty not found", 404);
      }
      if (warranty.verificationStatus !== "PENDING_CUSTOMER_ACTIVATION") {
        return Response.errorResponse(
          reply,
          `Cannot resend activation email. Warranty status is: ${warranty.verificationStatus}`,
          400
        );
      }
      if (!warranty.email || !warranty.phoneNumber) {
        return Response.errorResponse(reply, "Customer email or phone number not found", 400);
      }
      const activationToken = await CustomerNotificationService.generateActivationToken(
        warrantyId,
        warranty.email,
        warranty.phoneNumber
      );
      await CustomerNotificationService.sendCustomerActivationEmail(
        warranty.email,
        `${warranty.firstName} ${warranty.lastName}`,
        `${warranty.make} ${warranty.model} (${warranty.vinNumber})`,
        activationToken.token,
        warrantyId
      );
      await CustomerNotificationService.sendCustomerActivationSMS(
        warranty.phoneNumber,
        `${warranty.firstName} ${warranty.lastName}`,
        `${warranty.make} ${warranty.model}`
      );
      return Response.showOne(reply, {
        success: true,
        message: "Activation email and SMS resent successfully",
        data: {
          warrantyId,
          sentTo: {
            email: warranty.email,
            phone: warranty.phoneNumber
          },
          tokenExpiresAt: activationToken.expiresAt
        }
      });
    } catch (error) {
      console.error("\u274C resendActivationEmail error:", error);
      return Response.errorResponse(reply, error.message || "Failed to resend activation email");
    }
  }
}
export const customerActivationController = new CustomerActivationController();
