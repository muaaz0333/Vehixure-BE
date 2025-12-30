import crypto from "crypto";
import { SMSService } from "./smsService.js";
const TOKEN_EXPIRY_MS = 60 * 24 * 60 * 60 * 1e3;
export class VerificationService {
  static verificationLinks = /* @__PURE__ */ new Map();
  /**
   * Send SMS verification to installer for warranty registration
   */
  static async sendWarrantyVerification(warranty, installer, userRepo) {
    try {
      if (!installer.mobileNumber) {
        return { success: false, message: "Installer mobile number not found" };
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
      this.verificationLinks.set(token, {
        token,
        expiresAt,
        type: "WARRANTY",
        recordId: warranty.id,
        installerId: installer.id
      });
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/warranty/${token}`;
      await SMSService.sendWarrantyVerificationSMS(
        installer.mobileNumber,
        installer.fullName || installer.email,
        warranty.ownerName || "Customer",
        `${warranty.vehicleMake} ${warranty.vehicleModel} (${warranty.vin})`,
        token
      );
      await userRepo.update(installer.id, {
        lastVerificationSent: /* @__PURE__ */ new Date(),
        verificationAttempts: (installer.verificationAttempts || 0) + 1
      });
      return { success: true, message: "Verification SMS sent successfully" };
    } catch (error) {
      console.error("\u274C Error sending warranty verification:", error);
      return { success: false, message: "Failed to send verification SMS" };
    }
  }
  /**
   * Send SMS verification to inspector for annual inspection
   */
  static async sendInspectionVerification(inspection, inspector, userRepo) {
    try {
      if (!inspector.mobileNumber) {
        return { success: false, message: "Inspector mobile number not found" };
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
      this.verificationLinks.set(token, {
        token,
        expiresAt,
        type: "INSPECTION",
        recordId: inspection.id,
        installerId: inspector.id
      });
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/inspection/${token}`;
      await SMSService.sendInspectionVerificationSMS(
        inspector.mobileNumber,
        inspector.fullName || inspector.email,
        inspection.ownerName || "Customer",
        `${inspection.vehicleMake} ${inspection.vehicleModel} (${inspection.vin})`,
        token
      );
      await userRepo.update(inspector.id, {
        lastVerificationSent: /* @__PURE__ */ new Date(),
        verificationAttempts: (inspector.verificationAttempts || 0) + 1
      });
      return { success: true, message: "Verification SMS sent successfully" };
    } catch (error) {
      console.error("\u274C Error sending inspection verification:", error);
      return { success: false, message: "Failed to send verification SMS" };
    }
  }
  /**
   * Verify warranty registration via SMS token
   */
  static async verifyWarranty(token, action, declineReason, warrantyRepo) {
    try {
      const verificationLink = this.verificationLinks.get(token);
      if (!verificationLink) {
        return { success: false, message: "Invalid or expired verification link" };
      }
      if (verificationLink.type !== "WARRANTY") {
        return { success: false, message: "Invalid verification type" };
      }
      if (/* @__PURE__ */ new Date() > verificationLink.expiresAt) {
        this.verificationLinks.delete(token);
        return { success: false, message: "Verification link has expired" };
      }
      if (!warrantyRepo) {
        return { success: false, message: "Warranty repository not provided" };
      }
      const warranty = await warrantyRepo.findOne({
        where: { id: verificationLink.recordId }
      });
      if (!warranty) {
        return { success: false, message: "Warranty record not found" };
      }
      if (action === "CONFIRM") {
        await warrantyRepo.update(warranty.id, {
          status: "PENDING_CUSTOMER_ACTIVATION",
          verificationStatus: "PENDING_CUSTOMER_ACTIVATION",
          verifiedAt: /* @__PURE__ */ new Date(),
          verifiedBy: verificationLink.installerId,
          isActive: false
          // Not active until customer accepts terms
        });
        this.verificationLinks.delete(token);
        return {
          success: true,
          message: "Warranty verified by installer. Customer notification will be sent.",
          data: {
            warrantyId: warranty.id,
            status: "PENDING_CUSTOMER_ACTIVATION",
            nextStep: "CUSTOMER_TERMS_ACCEPTANCE"
          }
        };
      } else {
        await warrantyRepo.update(warranty.id, {
          status: "REJECTED",
          verificationStatus: "REJECTED",
          declinedAt: /* @__PURE__ */ new Date(),
          declinedBy: verificationLink.installerId,
          rejectionReason: declineReason || "No reason provided"
        });
        this.verificationLinks.delete(token);
        return {
          success: true,
          message: "Warranty declined successfully",
          data: { warrantyId: warranty.id, status: "REJECTED" }
        };
      }
    } catch (error) {
      console.error("\u274C Error verifying warranty:", error);
      return { success: false, message: "Failed to process verification" };
    }
  }
  /**
   * Verify annual inspection via SMS token
   */
  static async verifyInspection(token, action, declineReason, inspectionRepo) {
    try {
      const verificationLink = this.verificationLinks.get(token);
      if (!verificationLink) {
        return { success: false, message: "Invalid or expired verification link" };
      }
      if (verificationLink.type !== "INSPECTION") {
        return { success: false, message: "Invalid verification type" };
      }
      if (/* @__PURE__ */ new Date() > verificationLink.expiresAt) {
        this.verificationLinks.delete(token);
        return { success: false, message: "Verification link has expired" };
      }
      if (!inspectionRepo) {
        return { success: false, message: "Inspection repository not provided" };
      }
      const inspection = await inspectionRepo.findOne({
        where: { id: verificationLink.recordId }
      });
      if (!inspection) {
        return { success: false, message: "Inspection record not found" };
      }
      if (action === "CONFIRM") {
        await inspectionRepo.update(inspection.id, {
          status: "VERIFIED",
          verificationStatus: "VERIFIED",
          verifiedAt: /* @__PURE__ */ new Date(),
          verifiedBy: verificationLink.installerId
        });
        this.verificationLinks.delete(token);
        return {
          success: true,
          message: "Inspection verified successfully",
          data: { inspectionId: inspection.id, status: "VERIFIED" }
        };
      } else {
        await inspectionRepo.update(inspection.id, {
          status: "REJECTED",
          verificationStatus: "REJECTED",
          declinedAt: /* @__PURE__ */ new Date(),
          declinedBy: verificationLink.installerId,
          rejectionReason: declineReason || "No reason provided"
        });
        this.verificationLinks.delete(token);
        return {
          success: true,
          message: "Inspection declined successfully",
          data: { inspectionId: inspection.id, status: "REJECTED" }
        };
      }
    } catch (error) {
      console.error("\u274C Error verifying inspection:", error);
      return { success: false, message: "Failed to process verification" };
    }
  }
  /**
   * Get verification details for display (without processing)
   */
  static getVerificationDetails(token) {
    const verificationLink = this.verificationLinks.get(token);
    if (!verificationLink) {
      return null;
    }
    if (/* @__PURE__ */ new Date() > verificationLink.expiresAt) {
      this.verificationLinks.delete(token);
      return null;
    }
    return verificationLink;
  }
  /**
   * Clean up expired verification links
   */
  static cleanupExpiredLinks() {
    const now = /* @__PURE__ */ new Date();
    for (const [token, link] of this.verificationLinks.entries()) {
      if (now > link.expiresAt) {
        this.verificationLinks.delete(token);
      }
    }
  }
}
setInterval(() => {
  VerificationService.cleanupExpiredLinks();
}, 60 * 60 * 1e3);
