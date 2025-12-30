import { AppDataSource } from "../plugins/typeorm.js";
import { AnnualInspection } from "../entities/AnnualInspection.js";
import { Photo } from "../entities/Photo.js";
import { AuditHistory } from "../entities/AuditHistory.js";
import { Warranty } from "../entities/Warranty.js";
import { User } from "../entities/User.js";
import { SMSService } from "../services/smsService.js";
export class AnnualInspectionController {
  get inspectionRepo() {
    return AppDataSource.getRepository(AnnualInspection);
  }
  get photoRepo() {
    return AppDataSource.getRepository(Photo);
  }
  get warrantyRepo() {
    return AppDataSource.getRepository(Warranty);
  }
  get userRepo() {
    return AppDataSource.getRepository(User);
  }
  /**
   * Create a new annual inspection (Draft state)
   */
  async createInspection(request, reply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const {
        warrantyId,
        inspectorId,
        inspectionDate,
        generatorMountedCorrectly,
        redLightIlluminated,
        couplersSecureSealed,
        roofTurretCondition,
        roofTurretNotes,
        pillarsCondition,
        pillarsNotes,
        sillsCondition,
        sillsNotes,
        guardsLfCondition,
        guardsLfNotes,
        guardsRfCondition,
        guardsRfNotes,
        guardsLrCondition,
        guardsLrNotes,
        guardsRrCondition,
        guardsRrNotes,
        innerGuardsCondition,
        innerGuardsNotes,
        underBonnetCondition,
        underBonnetNotes,
        firewallCondition,
        firewallNotes,
        bootWaterIngressCondition,
        bootWaterIngressNotes,
        underbodySeamsCondition,
        underbodySeamsNotes,
        ownerAdvisedPaintDamage,
        ownerUnderstandsOperation,
        corrosionFound,
        corrosionDetails,
        photos = []
      } = request.body;
      const warranty = await this.warrantyRepo.findOne({
        where: { id: warrantyId, status: "ACTIVE", isDeleted: false }
      });
      if (!warranty) {
        return reply.status(400).send({
          error: "Invalid warranty ID or warranty is not active"
        });
      }
      const inspector = await this.userRepo.findOne({
        where: { id: inspectorId, isAuthorisedInspector: true }
      });
      if (!inspector) {
        return reply.status(400).send({
          error: "Invalid inspector ID or inspector is not authorised"
        });
      }
      const inspection = this.inspectionRepo.create({
        warrantyId,
        inspectorId,
        inspectionDate: new Date(inspectionDate),
        generatorMountedCorrectly,
        redLightIlluminated,
        couplersSecureSealed,
        roofTurretCondition,
        roofTurretNotes,
        pillarsCondition,
        pillarsNotes,
        sillsCondition,
        sillsNotes,
        guardsLfCondition,
        guardsLfNotes,
        guardsRfCondition,
        guardsRfNotes,
        guardsLrCondition,
        guardsLrNotes,
        guardsRrCondition,
        guardsRrNotes,
        innerGuardsCondition,
        innerGuardsNotes,
        underBonnetCondition,
        underBonnetNotes,
        firewallCondition,
        firewallNotes,
        bootWaterIngressCondition,
        bootWaterIngressNotes,
        underbodySeamsCondition,
        underbodySeamsNotes,
        ownerAdvisedPaintDamage,
        ownerUnderstandsOperation,
        corrosionFound,
        corrosionDetails,
        verificationStatus: "DRAFT",
        isDeleted: false
      });
      const savedInspection = await this.inspectionRepo.save(inspection);
      if (photos.length > 0) {
        const photoEntities = photos.map(
          (photo) => this.photoRepo.create({
            inspectionId: savedInspection.id,
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
      return reply.status(201).send({
        message: "Annual inspection created successfully",
        inspection: {
          id: savedInspection.id,
          warrantyId: savedInspection.warrantyId,
          verificationStatus: savedInspection.verificationStatus,
          inspectionDate: savedInspection.inspectionDate,
          inspectorName: inspector.fullName,
          created: savedInspection.created
        },
        nextSteps: {
          photosUploaded: photos.length,
          photosRequired: 3,
          readyForSubmission: photos.length >= 3,
          message: photos.length >= 3 ? "Inspection is ready for submission" : `Upload ${3 - photos.length} more photo(s) before submission`,
          requiredPhotos: [
            "Generator with RED LIGHT visible and operational",
            "Couplers/pads condition and security",
            "Corrosion/stone chips OR clear vehicle body"
          ]
        }
      });
    } catch (error) {
      console.error("Error creating inspection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Submit inspection for verification (triggers SMS to inspector)
   */
  async submitInspection(request, reply) {
    try {
      const userId = request.user?.id;
      const { id } = request.params;
      const inspection = await this.inspectionRepo.findOne({
        where: { id, isDeleted: false }
      });
      if (!inspection) {
        return reply.status(404).send({ error: "Inspection not found" });
      }
      if (inspection.verificationStatus !== "DRAFT") {
        return reply.status(400).send({
          error: "Inspection can only be submitted from DRAFT status"
        });
      }
      const validationErrors = this.validateSubmissionRequirements(inspection);
      if (validationErrors.length > 0) {
        return reply.status(400).send({
          error: "Submission requirements not met",
          details: validationErrors
        });
      }
      const photoCount = await this.photoRepo.count({
        where: { inspectionId: id, isDeleted: false }
      });
      if (photoCount < 3) {
        return reply.status(400).send({
          error: "Minimum 3 photos required for submission",
          details: "Please upload photos for: (1) Generator with RED LIGHT visible, (2) Couplers/pads condition, (3) Corrosion/stone chips OR clear vehicle body",
          currentPhotoCount: photoCount,
          requiredPhotoCount: 3
        });
      }
      const { token, expires } = SMSService.generateVerificationToken();
      inspection.verificationStatus = "SUBMITTED";
      inspection.verificationToken = token;
      inspection.verificationTokenExpires = expires;
      await this.inspectionRepo.save(inspection);
      const inspector = await this.userRepo.findOne({
        where: { id: inspection.inspectorId }
      });
      const warranty = await this.warrantyRepo.findOne({
        where: { id: inspection.warrantyId }
      });
      if (inspector?.mobileNumber && warranty) {
        await SMSService.sendInspectionVerificationSMS(
          inspector.mobileNumber,
          inspector.fullName || "Inspector",
          `${warranty.firstName} ${warranty.lastName}`,
          `${warranty.make} ${warranty.model} (${warranty.vinNumber})`,
          token
        );
      }
      await this.logVerificationHistory(id, "SUBMITTED", userId, inspection.inspectorId);
      return reply.send({
        message: "Inspection submitted for verification. SMS sent to inspector.",
        inspection: {
          id: inspection.id,
          verificationStatus: inspection.verificationStatus,
          inspectorName: inspector?.fullName,
          submittedAt: /* @__PURE__ */ new Date()
        }
      });
    } catch (error) {
      console.error("Error submitting inspection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Check if inspection is ready for submission
   */
  async validateInspectionForSubmission(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      const inspection = await this.inspectionRepo.findOne({
        where: { id, inspectorId: userId, isDeleted: false }
      });
      if (!inspection) {
        return reply.status(404).send({ error: "Inspection not found" });
      }
      if (inspection.verificationStatus !== "DRAFT") {
        return reply.status(400).send({
          error: "Inspection has already been submitted",
          currentStatus: inspection.verificationStatus
        });
      }
      const photoCount = await this.photoRepo.count({
        where: { inspectionId: id, isDeleted: false }
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
        message: isValid ? "Inspection is ready for submission" : `Inspection needs ${missingPhotos} more photo(s) before submission`,
        requiredPhotos: [
          "Generator with RED LIGHT visible and operational",
          "Couplers/pads condition and security",
          "Corrosion/stone chips OR clear vehicle body"
        ]
      });
    } catch (error) {
      console.error("Error validating inspection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Inspector verification via SMS token
   */
  async verifyInspection(request, reply) {
    try {
      const { token } = request.params;
      const { action, rejectionReason } = request.body;
      const inspection = await this.inspectionRepo.findOne({
        where: {
          verificationToken: token,
          verificationStatus: "SUBMITTED"
        }
      });
      if (!inspection) {
        return reply.status(404).send({
          error: "Invalid or expired verification token"
        });
      }
      if (inspection.verificationTokenExpires && inspection.verificationTokenExpires < /* @__PURE__ */ new Date()) {
        return reply.status(400).send({
          error: "Verification token has expired"
        });
      }
      if (action === "CONFIRM") {
        const warrantyExtendedUntil = new Date(inspection.inspectionDate);
        warrantyExtendedUntil.setFullYear(warrantyExtendedUntil.getFullYear() + 1);
        inspection.verificationStatus = "VERIFIED";
        inspection.verifiedBy = inspection.inspectorId;
        inspection.verifiedAt = /* @__PURE__ */ new Date();
        inspection.warrantyExtendedUntil = warrantyExtendedUntil;
        inspection.verificationToken = void 0;
        inspection.verificationTokenExpires = void 0;
        await this.inspectionRepo.save(inspection);
        await this.logVerificationHistory(inspection.id, "VERIFIED", inspection.inspectorId, inspection.inspectorId);
        const warranty = await this.warrantyRepo.findOne({
          where: { id: inspection.warrantyId }
        });
        return reply.send({
          message: "Inspection verified successfully. Warranty extended by 12 months.",
          inspection: {
            id: inspection.id,
            verificationStatus: inspection.verificationStatus,
            verifiedAt: inspection.verifiedAt,
            warrantyExtendedUntil: inspection.warrantyExtendedUntil,
            customerName: warranty ? `${warranty.firstName} ${warranty.lastName}` : "Unknown",
            vehicle: warranty ? `${warranty.make} ${warranty.model}` : "Unknown"
          }
        });
      } else if (action === "DECLINE") {
        if (!rejectionReason) {
          return reply.status(400).send({
            error: "Rejection reason is required when declining"
          });
        }
        inspection.verificationStatus = "REJECTED";
        inspection.rejectionReason = rejectionReason;
        inspection.verificationToken = void 0;
        inspection.verificationTokenExpires = void 0;
        await this.inspectionRepo.save(inspection);
        await this.logVerificationHistory(inspection.id, "REJECTED", inspection.inspectorId, inspection.inspectorId, rejectionReason);
        const warranty = await this.warrantyRepo.findOne({
          where: { id: inspection.warrantyId }
        });
        return reply.send({
          message: "Inspection verification declined",
          inspection: {
            id: inspection.id,
            verificationStatus: inspection.verificationStatus,
            rejectionReason: inspection.rejectionReason,
            customerName: warranty ? `${warranty.firstName} ${warranty.lastName}` : "Unknown",
            vehicle: warranty ? `${warranty.make} ${warranty.model}` : "Unknown"
          }
        });
      }
      return reply.status(400).send({ error: "Invalid action" });
    } catch (error) {
      console.error("Error verifying inspection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Get inspection details
   */
  async getInspection(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      const inspection = await this.inspectionRepo.findOne({
        where: { id, isDeleted: false }
      });
      if (!inspection) {
        return reply.status(404).send({ error: "Inspection not found" });
      }
      const warranty = await this.warrantyRepo.findOne({
        where: { id: inspection.warrantyId }
      });
      const hasAccess = warranty?.agentId === userId || inspection.inspectorId === userId || inspection.verifiedBy === userId;
      if (!hasAccess) {
        return reply.status(403).send({ error: "Access denied" });
      }
      const photos = await this.photoRepo.find({
        where: { inspectionId: id, isDeleted: false }
      });
      return reply.send({
        inspection: {
          ...inspection,
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
      console.error("Error getting inspection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * List inspections for current user
   */
  async listInspections(request, reply) {
    try {
      const userId = request.user?.id;
      const user = request.user;
      let inspections = [];
      if (user.isAuthorisedInspector) {
        inspections = await this.inspectionRepo.find({
          where: { inspectorId: userId, isDeleted: false },
          order: { created: "DESC" }
        });
      } else {
        const userWarranties = await this.warrantyRepo.find({
          where: { agentId: userId, isDeleted: false },
          select: ["id"]
        });
        const warrantyIds = userWarranties.map((w) => w.id);
        if (warrantyIds.length === 0) {
          return reply.send({ inspections: [] });
        }
        if (warrantyIds.length > 1) {
          inspections = await this.inspectionRepo.createQueryBuilder("inspection").where("inspection.warrantyId IN (:...warrantyIds)", { warrantyIds }).andWhere("inspection.isDeleted = :isDeleted", { isDeleted: false }).orderBy("inspection.created", "DESC").getMany();
        } else if (warrantyIds.length === 1) {
          inspections = await this.inspectionRepo.find({
            where: {
              warrantyId: warrantyIds[0],
              isDeleted: false
            },
            order: { created: "DESC" }
          });
        }
      }
      const inspectionList = await Promise.all(
        inspections.map(async (inspection) => {
          const photoCount = await this.photoRepo.count({
            where: { inspectionId: inspection.id, isDeleted: false }
          });
          let warranty;
          if (inspection.warranty) {
            warranty = inspection.warranty;
          } else {
            warranty = await this.warrantyRepo.findOne({
              where: { id: inspection.warrantyId }
            });
          }
          let inspector;
          if (inspection.inspector) {
            inspector = inspection.inspector;
          } else {
            inspector = await this.userRepo.findOne({
              where: { id: inspection.inspectorId }
            });
          }
          return {
            id: inspection.id,
            warrantyId: inspection.warrantyId,
            customerName: warranty ? `${warranty.firstName} ${warranty.lastName}` : "Unknown",
            vehicle: warranty ? `${warranty.make} ${warranty.model}` : "Unknown",
            vinNumber: warranty?.vinNumber,
            inspectorName: inspector?.fullName,
            inspectionDate: inspection.inspectionDate,
            verificationStatus: inspection.verificationStatus,
            corrosionFound: inspection.corrosionFound,
            warrantyExtendedUntil: inspection.warrantyExtendedUntil,
            photoCount,
            created: inspection.created,
            verifiedAt: inspection.verifiedAt,
            rejectionReason: inspection.rejectionReason
          };
        })
      );
      return reply.send({ inspections: inspectionList });
    } catch (error) {
      console.error("Error listing inspections:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Get warranty inspection history
   */
  async getWarrantyInspectionHistory(request, reply) {
    try {
      const { warrantyId } = request.params;
      const userId = request.user?.id;
      const warranty = await this.warrantyRepo.findOne({
        where: { id: warrantyId, isDeleted: false }
      });
      if (!warranty) {
        return reply.status(404).send({ error: "Warranty not found" });
      }
      const hasAccess = warranty.agentId === userId || warranty.installerId === userId;
      if (!hasAccess) {
        return reply.status(403).send({ error: "Access denied" });
      }
      const inspections = await this.inspectionRepo.find({
        where: { warrantyId, isDeleted: false },
        order: { inspectionDate: "DESC" }
      });
      const inspectionHistory = await Promise.all(
        inspections.map(async (inspection) => {
          let inspector;
          if (inspection.inspector) {
            inspector = inspection.inspector;
          } else {
            inspector = await this.userRepo.findOne({
              where: { id: inspection.inspectorId }
            });
          }
          return {
            id: inspection.id,
            inspectionDate: inspection.inspectionDate,
            inspectorName: inspector?.fullName || "Unknown",
            verificationStatus: inspection.verificationStatus,
            verifiedAt: inspection.verifiedAt,
            warrantyExtendedUntil: inspection.warrantyExtendedUntil,
            corrosionFound: inspection.corrosionFound,
            rejectionReason: inspection.rejectionReason
          };
        })
      );
      return reply.send({
        warrantyId,
        inspectionHistory,
        totalInspections: inspections.length,
        lastInspection: inspections[0] || null
      });
    } catch (error) {
      console.error("Error getting warranty inspection history:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
  /**
   * Validate submission requirements
   */
  validateSubmissionRequirements(inspection) {
    const errors = [];
    if (!inspection.inspectorId) {
      errors.push("Inspector must be selected");
    }
    if (!inspection.inspectionDate) {
      errors.push("Inspection date is required");
    }
    if (inspection.generatorMountedCorrectly === null || inspection.generatorMountedCorrectly === void 0) {
      errors.push("Generator mounting check is required");
    }
    if (inspection.redLightIlluminated === null || inspection.redLightIlluminated === void 0) {
      errors.push("RED LIGHT check is required");
    }
    if (inspection.couplersSecureSealed === null || inspection.couplersSecureSealed === void 0) {
      errors.push("Couplers security check is required");
    }
    if (inspection.ownerAdvisedPaintDamage === null || inspection.ownerAdvisedPaintDamage === void 0) {
      errors.push("Owner paint damage advisory confirmation is required");
    }
    if (inspection.ownerUnderstandsOperation === null || inspection.ownerUnderstandsOperation === void 0) {
      errors.push("Owner operation understanding confirmation is required");
    }
    if (inspection.corrosionFound === null || inspection.corrosionFound === void 0) {
      errors.push("Corrosion declaration is required");
    }
    if (inspection.corrosionFound && !inspection.corrosionDetails) {
      errors.push("Corrosion details are required when corrosion is found");
    }
    const conditionFields = [
      { field: "roofTurretCondition", notes: "roofTurretNotes", name: "Roof turret" },
      { field: "pillarsCondition", notes: "pillarsNotes", name: "Pillars" },
      { field: "sillsCondition", notes: "sillsNotes", name: "Sills" },
      { field: "guardsLfCondition", notes: "guardsLfNotes", name: "Guards LF" },
      { field: "guardsRfCondition", notes: "guardsRfNotes", name: "Guards RF" },
      { field: "guardsLrCondition", notes: "guardsLrNotes", name: "Guards LR" },
      { field: "guardsRrCondition", notes: "guardsRrNotes", name: "Guards RR" },
      { field: "innerGuardsCondition", notes: "innerGuardsNotes", name: "Inner guards" },
      { field: "underBonnetCondition", notes: "underBonnetNotes", name: "Under bonnet" },
      { field: "firewallCondition", notes: "firewallNotes", name: "Firewall" },
      { field: "bootWaterIngressCondition", notes: "bootWaterIngressNotes", name: "Boot water ingress" },
      { field: "underbodySeamsCondition", notes: "underbodySeamsNotes", name: "Underbody seams" }
    ];
    for (const { field, notes, name } of conditionFields) {
      if (inspection[field] === "ISSUE" && !inspection[notes]) {
        errors.push(`${name} notes are required when condition is marked as ISSUE`);
      }
    }
    return errors;
  }
  /**
   * Log verification history for audit trail
   */
  async logVerificationHistory(inspectionId, action, performedBy, inspectorId, reason) {
    try {
      const historyRepo = AppDataSource.getRepository(AuditHistory);
      await historyRepo.save({
        inspectionId,
        actionType: action,
        recordType: "INSPECTION",
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
