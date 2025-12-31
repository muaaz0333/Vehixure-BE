import { AppDataSource } from "../plugins/typeorm.js";
import { Warranty } from "../entities/Warranty.js";
import { Photo } from "../entities/Photo.js";
import { AuditHistory } from "../entities/AuditHistory.js";
import { User } from "../entities/User.js";
import { WarrantyTerms } from "../entities/WarrantyTerms.js";
import { SMSService } from "../services/smsService.js";
export class WarrantyRegistrationController {
  get warrantyRepo() {
    return AppDataSource.getRepository(Warranty);
  }
  get photoRepo() {
    return AppDataSource.getRepository(Photo);
  }
  get userRepo() {
    return AppDataSource.getRepository(User);
  }
  get warrantyTermsRepo() {
    return AppDataSource.getRepository(WarrantyTerms);
  }
  /**
   * Create a new warranty registration (Draft state)
   */
  async createWarranty(request, reply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const {
        companyName,
        firstName,
        lastName,
        phoneNumber,
        email,
        make,
        model,
        registrationNumber,
        buildDate,
        vinNumber,
        installersName,
        installerId,
        dateInstalled,
        generatorSerialNumber,
        numberOfCouplersInstalled,
        voltageInCouplerSupplyLine,
        positionOfCouplers,
        corrosionFound,
        corrosionDetails,
        warrantyTermsId,
        photos = []
      } = request.body;
      const installer = await this.userRepo.findOne({
        where: { id: installerId, isAccreditedInstaller: true }
      });
      if (!installer) {
        return reply.status(400).send({
          error: "Invalid installer ID or installer is not accredited"
        });
      }
      const warrantyTerms = await this.warrantyTermsRepo.findOne({
        where: { id: warrantyTermsId }
      });
      if (!warrantyTerms) {
        return reply.status(400).send({ error: "Invalid warranty terms ID" });
      }
      const warranty = this.warrantyRepo.create({
        agentId: userId,
        warrantyTermsId,
        companyName,
        firstName,
        lastName,
        phoneNumber: SMSService.formatPhoneNumber(phoneNumber),
        email,
        make,
        model,
        registrationNumber,
        buildDate: new Date(buildDate),
        vinNumber,
        installersName,
        installerId,
        dateInstalled: new Date(dateInstalled),
        generatorSerialNumber,
        numberOfCouplersInstalled,
        voltageInCouplerSupplyLine,
        positionOfCouplers,
        corrosionFound,
        corrosionDetails,
        installationConfirmed: false,
        verificationStatus: "DRAFT",
        status: "DRAFT",
        isDeleted: false
      });
      const savedWarranty = await this.warrantyRepo.save(warranty);
      if (photos.length > 0) {
        const photoEntities = photos.map(
          (photo) => this.photoRepo.create({
            warrantyId: savedWarranty.id,
            photoCategory: photo.photoGroup,
            // Map photoGroup to photoCategory
            photoUrl: photo.photoUrl,
            description: photo.description,
            uploadedBy: userId,
            isDeleted: false
          })
        );
        await this.photoRepo.save(photoEntities);
      }
      console.log("Creating warranty with photos:", photos.length);
      return reply.status(201).send({
        message: "Warranty registration created successfully",
        warranty: {
          id: savedWarranty.id,
          verificationStatus: savedWarranty.verificationStatus,
          status: savedWarranty.status,
          customerName: `${firstName} ${lastName}`,
          vehicle: `${make} ${model}`,
          vinNumber,
          installerName: installersName,
          created: savedWarranty.created
        },
        debug: "This is a test field",
        photoCount: photos.length
      });
    } catch (error) {
      console.error("Error creating warranty:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Submit warranty for verification (triggers SMS to installer)
   */
  async submitWarranty(request, reply) {
    try {
      const userId = request.user?.id;
      const { id } = request.params;
      const { submissionNotes } = request.body;
      const warranty = await this.warrantyRepo.findOne({
        where: { id, agentId: userId, isDeleted: false }
      });
      if (!warranty) {
        return reply.status(404).send({ error: "Warranty not found" });
      }
      console.log("Warranty verification status:", warranty.verificationStatus);
      console.log("Warranty status:", warranty.status);
      if (warranty.verificationStatus !== "DRAFT") {
        console.log("Rejecting submission - not in DRAFT status");
        return reply.status(400).send({
          error: "Warranty can only be submitted from DRAFT status"
        });
      }
      const validationErrors = this.validateSubmissionRequirements(warranty);
      if (validationErrors.length > 0) {
        return reply.status(400).send({
          error: "Submission requirements not met",
          details: validationErrors
        });
      }
      const photoCount = await this.photoRepo.count({
        where: { warrantyId: id, isDeleted: false }
      });
      if (photoCount < 3) {
        return reply.status(400).send({
          error: "Minimum 3 photos required for submission",
          details: "Please upload photos for: (1) Generator with serial number visible, (2) Coupler pad/wiring, (3) Corrosion/stone chips OR clear vehicle body",
          currentPhotoCount: photoCount,
          requiredPhotoCount: 3
        });
      }
      const { token, expires } = SMSService.generateVerificationToken();
      warranty.verificationStatus = "SUBMITTED";
      warranty.status = "SUBMITTED";
      warranty.verificationToken = token;
      warranty.verificationTokenExpires = expires;
      warranty.submissionNotes = submissionNotes;
      await this.warrantyRepo.save(warranty);
      const installer = await this.userRepo.findOne({
        where: { id: warranty.installerId }
      });
      if (installer?.mobileNumber) {
        await SMSService.sendWarrantyVerificationSMS(
          installer.mobileNumber,
          warranty.installersName,
          `${warranty.firstName} ${warranty.lastName}`,
          `${warranty.make} ${warranty.model} (${warranty.vinNumber})`,
          token
        );
      }
      await this.logVerificationHistory(id, "SUBMITTED", userId, warranty.installerId);
      return reply.send({
        message: "Warranty submitted for verification. SMS sent to installer.",
        warranty: {
          id: warranty.id,
          verificationStatus: warranty.verificationStatus,
          status: warranty.status,
          installerName: warranty.installersName,
          submittedAt: /* @__PURE__ */ new Date()
        }
      });
    } catch (error) {
      console.error("Error submitting warranty:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Check if warranty is ready for submission
   */
  async validateWarrantyForSubmission(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      const warranty = await this.warrantyRepo.findOne({
        where: { id, agentId: userId, isDeleted: false }
      });
      if (!warranty) {
        return reply.status(404).send({ error: "Warranty not found" });
      }
      if (warranty.verificationStatus !== "DRAFT") {
        return reply.status(400).send({
          error: "Warranty has already been submitted",
          currentStatus: warranty.verificationStatus
        });
      }
      const photoCount = await this.photoRepo.count({
        where: { warrantyId: id, isDeleted: false }
      });
      const isValid = photoCount >= 3;
      const missingPhotos = Math.max(0, 3 - photoCount);
      return reply.send({
        isReadyForSubmission: isValid,
        validation: {
          photos: {
            current: photoCount,
            required: 3,
            missing: missingPhotos,
            valid: photoCount >= 3
          }
        },
        message: isValid ? "Warranty is ready for submission" : `Warranty needs ${missingPhotos} more photo(s) before submission`,
        requiredPhotos: [
          "Generator installed with serial number visible",
          "Coupler pad/wiring",
          "Corrosion/stone chips OR clear vehicle body"
        ]
      });
    } catch (error) {
      console.error("Error validating warranty:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Installer verification via SMS token
   */
  async verifyWarranty(request, reply) {
    try {
      const { token } = request.params;
      const { action, rejectionReason } = request.body;
      const warranty = await this.warrantyRepo.findOne({
        where: {
          verificationToken: token,
          verificationStatus: "SUBMITTED"
        }
      });
      if (!warranty) {
        return reply.status(404).send({
          error: "Invalid or expired verification token"
        });
      }
      if (warranty.verificationTokenExpires && warranty.verificationTokenExpires < /* @__PURE__ */ new Date()) {
        return reply.status(400).send({
          error: "Verification token has expired"
        });
      }
      if (action === "CONFIRM") {
        const { CustomerNotificationService } = await import("../services/customer-notification-service.js");
        warranty.verificationStatus = "PENDING_CUSTOMER_ACTIVATION";
        warranty.status = "PENDING_CUSTOMER_ACTIVATION";
        warranty.verifiedBy = warranty.installerId;
        warranty.verifiedAt = /* @__PURE__ */ new Date();
        warranty.verificationToken = void 0;
        warranty.verificationTokenExpires = void 0;
        warranty.isActive = false;
        await this.warrantyRepo.save(warranty);
        await this.logVerificationHistory(warranty.id, "INSTALLER_VERIFIED", warranty.installerId, warranty.installerId);
        if (warranty.email && warranty.phoneNumber) {
          const activationToken = await CustomerNotificationService.generateActivationToken(
            warranty.id,
            warranty.email,
            warranty.phoneNumber
          );
          await CustomerNotificationService.sendCustomerActivationEmail(
            warranty.email,
            `${warranty.firstName} ${warranty.lastName}`,
            `${warranty.make} ${warranty.model} (${warranty.vinNumber})`,
            activationToken.token,
            warranty.id
          );
          await CustomerNotificationService.sendCustomerActivationSMS(
            warranty.phoneNumber,
            `${warranty.firstName} ${warranty.lastName}`,
            `${warranty.make} ${warranty.model}`
          );
          console.log(`\u2705 Customer notification sent for warranty ${warranty.id}`);
        }
        return reply.send({
          message: "Warranty verified by installer. Customer notification sent for terms acceptance.",
          warranty: {
            id: warranty.id,
            verificationStatus: warranty.verificationStatus,
            status: warranty.status,
            verifiedAt: warranty.verifiedAt,
            customerName: `${warranty.firstName} ${warranty.lastName}`,
            vehicle: `${warranty.make} ${warranty.model}`,
            nextStep: "CUSTOMER_TERMS_ACCEPTANCE"
          }
        });
      } else if (action === "DECLINE") {
        if (!rejectionReason) {
          return reply.status(400).send({
            error: "Rejection reason is required when declining"
          });
        }
        warranty.verificationStatus = "REJECTED";
        warranty.status = "REJECTED";
        warranty.rejectionReason = rejectionReason;
        warranty.verificationToken = void 0;
        warranty.verificationTokenExpires = void 0;
        await this.warrantyRepo.save(warranty);
        await this.logVerificationHistory(warranty.id, "REJECTED", warranty.installerId, warranty.installerId, rejectionReason);
        return reply.send({
          message: "Warranty verification declined",
          warranty: {
            id: warranty.id,
            verificationStatus: warranty.verificationStatus,
            status: warranty.status,
            rejectionReason: warranty.rejectionReason,
            customerName: `${warranty.firstName} ${warranty.lastName}`,
            vehicle: `${warranty.make} ${warranty.model}`
          }
        });
      }
      return reply.status(400).send({ error: "Invalid action" });
    } catch (error) {
      console.error("Error verifying warranty:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Get warranty details
   */
  async getWarranty(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      const warranty = await this.warrantyRepo.findOne({
        where: { id, isDeleted: false }
      });
      if (!warranty) {
        return reply.status(404).send({ error: "Warranty not found" });
      }
      const hasAccess = warranty.agentId === userId || warranty.installerId === userId || warranty.verifiedBy === userId;
      if (!hasAccess) {
        return reply.status(403).send({ error: "Access denied" });
      }
      const photos = await this.photoRepo.find({
        where: { warrantyId: id, isDeleted: false }
      });
      return reply.send({
        warranty: {
          ...warranty,
          photos: photos.map((photo) => ({
            id: photo.id,
            photoGroup: photo.photoCategory,
            // Map photoCategory back to photoGroup for API response
            photoUrl: photo.photoUrl,
            photoDescription: photo.description,
            uploadedBy: "User",
            // Simplified for now
            created: photo.created
          }))
        }
      });
    } catch (error) {
      console.error("Error getting warranty:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * List warranties for current user
   */
  async listWarranties(request, reply) {
    try {
      const userId = request.user?.id;
      const user = request.user;
      let whereCondition = { isDeleted: false };
      if (user.isAccreditedInstaller) {
        whereCondition = [
          { agentId: userId, isDeleted: false },
          { installerId: userId, isDeleted: false }
        ];
      } else {
        whereCondition.agentId = userId;
      }
      const warranties = await this.warrantyRepo.find({
        where: whereCondition,
        order: { created: "DESC" }
      });
      const warrantyList = await Promise.all(
        warranties.map(async (warranty) => {
          const photoCount = await this.photoRepo.count({
            where: { warrantyId: warranty.id, isDeleted: false }
          });
          return {
            id: warranty.id,
            customerName: `${warranty.firstName} ${warranty.lastName}`,
            companyName: warranty.companyName,
            vehicle: `${warranty.make} ${warranty.model}`,
            vinNumber: warranty.vinNumber,
            installerName: warranty.installersName,
            verificationStatus: warranty.verificationStatus,
            status: warranty.status,
            corrosionFound: warranty.corrosionFound,
            photoCount,
            created: warranty.created,
            verifiedAt: warranty.verifiedAt,
            rejectionReason: warranty.rejectionReason
          };
        })
      );
      return reply.send({ warranties: warrantyList });
    } catch (error) {
      console.error("Error listing warranties:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Validate submission requirements
   */
  validateSubmissionRequirements(warranty) {
    const errors = [];
    if (!warranty.installerId) {
      errors.push("Installer must be selected");
    }
    if (!warranty.vinNumber) {
      errors.push("VIN number is required");
    }
    if (!warranty.generatorSerialNumber) {
      errors.push("Generator serial number is required");
    }
    if (!warranty.dateInstalled) {
      errors.push("Installation date is required");
    }
    if (warranty.corrosionFound === null || warranty.corrosionFound === void 0) {
      errors.push("Corrosion declaration is required");
    }
    if (warranty.corrosionFound && !warranty.corrosionDetails) {
      errors.push("Corrosion details are required when corrosion is found");
    }
    return errors;
  }
  /**
   * Log verification history for audit trail
   */
  async logVerificationHistory(warrantyId, action, performedBy, installerId, reason) {
    try {
      const historyRepo = AppDataSource.getRepository(AuditHistory);
      await historyRepo.save({
        warrantyId,
        actionType: action,
        recordType: "WARRANTY",
        versionNumber: 1,
        performedBy,
        reason,
        isCurrentVersion: true,
        created: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Error logging verification history:", error);
    }
  }
}
