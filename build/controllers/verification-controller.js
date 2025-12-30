import { User } from "../entities/User.js";
import { Warranty } from "../entities/Warranty.js";
import { AnnualInspection } from "../entities/AnnualInspection.js";
import { VerificationService } from "../services/verification-service.js";
import Response from "../Traits/ApiResponser.js";
export const getVerificationDetails = async (req, reply) => {
  try {
    const { token } = req.params;
    const verificationDetails = VerificationService.getVerificationDetails(token);
    if (!verificationDetails) {
      return Response.errorResponse(reply, "Invalid or expired verification link", 404);
    }
    let recordDetails = null;
    if (verificationDetails.type === "WARRANTY") {
      const warrantyRepo = req.server.db.getRepository(Warranty);
      recordDetails = await warrantyRepo.findOne({
        where: { id: verificationDetails.recordId },
        select: [
          "id",
          "vin",
          "vehicleMake",
          "vehicleModel",
          "vehicleYear",
          "ownerName",
          "ownerEmail",
          "ownerPhone",
          "installationDate",
          "generatorSerialNumber",
          "productInstalled",
          "status"
        ]
      });
    } else if (verificationDetails.type === "INSPECTION") {
      const inspectionRepo = req.server.db.getRepository(AnnualInspection);
      recordDetails = await inspectionRepo.findOne({
        where: { id: verificationDetails.recordId },
        select: [
          "id",
          "warrantyId",
          "vin",
          "vehicleMake",
          "vehicleModel",
          "inspectionDate",
          "status"
        ]
      });
    }
    if (!recordDetails) {
      return Response.errorResponse(reply, "Record not found", 404);
    }
    return Response.showOne(reply, {
      success: true,
      message: "Verification details retrieved successfully",
      data: {
        verificationType: verificationDetails.type,
        expiresAt: verificationDetails.expiresAt,
        record: recordDetails
      }
    });
  } catch (err) {
    console.error("\u274C getVerificationDetails error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve verification details");
  }
};
export const processWarrantyVerification = async (req, reply) => {
  try {
    const { token } = req.params;
    const { action, declineReason } = req.body;
    if (!action || !["CONFIRM", "DECLINE"].includes(action)) {
      return Response.errorResponse(reply, "Valid action (CONFIRM or DECLINE) is required", 400);
    }
    if (action === "DECLINE" && !declineReason) {
      return Response.errorResponse(reply, "Decline reason is required when declining", 400);
    }
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const result = await VerificationService.verifyWarranty(
      token,
      action,
      declineReason,
      warrantyRepo
    );
    if (!result.success) {
      return Response.errorResponse(reply, result.message, 400);
    }
    return Response.showOne(reply, {
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    console.error("\u274C processWarrantyVerification error:", err);
    return Response.errorResponse(reply, err.message || "Failed to process warranty verification");
  }
};
export const processInspectionVerification = async (req, reply) => {
  try {
    const { token } = req.params;
    const { action, declineReason } = req.body;
    if (!action || !["CONFIRM", "DECLINE"].includes(action)) {
      return Response.errorResponse(reply, "Valid action (CONFIRM or DECLINE) is required", 400);
    }
    if (action === "DECLINE" && !declineReason) {
      return Response.errorResponse(reply, "Decline reason is required when declining", 400);
    }
    const inspectionRepo = req.server.db.getRepository(AnnualInspection);
    const result = await VerificationService.verifyInspection(
      token,
      action,
      declineReason,
      inspectionRepo
    );
    if (!result.success) {
      return Response.errorResponse(reply, result.message, 400);
    }
    return Response.showOne(reply, {
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    console.error("\u274C processInspectionVerification error:", err);
    return Response.errorResponse(reply, err.message || "Failed to process inspection verification");
  }
};
export const resendVerificationSMS = async (req, reply) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== "ERPS_ADMIN") {
      return Response.errorResponse(reply, "Only ERPS Admin can resend verification SMS", 403);
    }
    const { recordId, recordType } = req.body;
    if (!recordId || !recordType || !["WARRANTY", "INSPECTION"].includes(recordType)) {
      return Response.errorResponse(reply, "Valid record ID and type are required", 400);
    }
    const userRepo = req.server.db.getRepository(User);
    let installer = null;
    let record = null;
    if (recordType === "WARRANTY") {
      const warrantyRepo = req.server.db.getRepository(Warranty);
      record = await warrantyRepo.findOne({
        where: { id: recordId }
      });
      if (!record) {
        return Response.errorResponse(reply, "Warranty record not found", 404);
      }
      installer = await userRepo.findOneBy({ id: record.installedBy });
    } else {
      const inspectionRepo = req.server.db.getRepository(AnnualInspection);
      record = await inspectionRepo.findOne({
        where: { id: recordId },
        relations: ["inspector"]
      });
      if (!record) {
        return Response.errorResponse(reply, "Inspection record not found", 404);
      }
      installer = await userRepo.findOneBy({ id: record.inspectedBy });
    }
    if (!installer) {
      return Response.errorResponse(reply, "Installer/Inspector not found", 404);
    }
    if (installer.partnerRole !== "ACCOUNT_INSTALLER") {
      return Response.errorResponse(reply, "User is not an authorized installer", 400);
    }
    let result;
    if (recordType === "WARRANTY") {
      result = await VerificationService.sendWarrantyVerification(record, installer, userRepo);
    } else {
      result = await VerificationService.sendInspectionVerification(record, installer, userRepo);
    }
    if (!result.success) {
      return Response.errorResponse(reply, result.message, 400);
    }
    return Response.showOne(reply, {
      success: true,
      message: result.message,
      data: {
        recordId,
        recordType,
        sentTo: installer.mobileNumber,
        sentAt: /* @__PURE__ */ new Date()
      }
    });
  } catch (err) {
    console.error("\u274C resendVerificationSMS error:", err);
    return Response.errorResponse(reply, err.message || "Failed to resend verification SMS");
  }
};
export const getInstallerVerificationHistory = async (req, reply) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== "ERPS_ADMIN") {
      return Response.errorResponse(reply, "Only ERPS Admin can view verification history", 403);
    }
    const { installerId } = req.params;
    const userRepo = req.server.db.getRepository(User);
    const installer = await userRepo.findOneBy({
      id: installerId,
      partnerRole: "ACCOUNT_INSTALLER",
      isDeleted: false
    });
    if (!installer) {
      return Response.errorResponse(reply, "Installer not found", 404);
    }
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const warranties = await warrantyRepo.find({
      where: { installedBy: installerId },
      select: [
        "id",
        "vin",
        "vehicleMake",
        "vehicleModel",
        "status",
        "submittedAt",
        "verifiedAt",
        "declinedAt",
        "declineReason"
      ],
      order: { submittedAt: "DESC" }
    });
    const inspectionRepo = req.server.db.getRepository(AnnualInspection);
    const inspections = await inspectionRepo.find({
      where: { inspectedBy: installerId },
      select: [
        "id",
        "warrantyId",
        "vin",
        "vehicleMake",
        "vehicleModel",
        "status",
        "submittedAt",
        "verifiedAt",
        "declinedAt",
        "declineReason"
      ],
      order: { submittedAt: "DESC" }
    });
    return Response.showOne(reply, {
      success: true,
      message: "Installer verification history retrieved successfully",
      data: {
        installer: {
          id: installer.id,
          fullName: installer.fullName,
          email: installer.email,
          mobileNumber: installer.mobileNumber,
          verificationAttempts: installer.verificationAttempts,
          lastVerificationSent: installer.lastVerificationSent
        },
        warranties,
        inspections
      }
    });
  } catch (err) {
    console.error("\u274C getInstallerVerificationHistory error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve verification history");
  }
};
