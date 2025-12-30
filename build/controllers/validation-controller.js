import { PhotoValidationService } from "../services/photo-validation-service.js";
import { InspectionChecklistService } from "../services/inspection-checklist-service.js";
import { SubmissionHistoryService } from "../services/submission-history-service.js";
const photoValidationService = new PhotoValidationService();
const checklistService = new InspectionChecklistService();
const submissionHistoryService = new SubmissionHistoryService();
export async function getPhotoCategories(request, reply) {
  try {
    const { recordType } = request.params;
    const categories = await photoValidationService.getPhotoCategories(recordType);
    return reply.code(200).send({
      success: true,
      data: categories,
      message: `Photo categories retrieved for ${recordType}`
    });
  } catch (error) {
    console.error("Error getting photo categories:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get photo categories",
      error: error.message
    });
  }
}
export async function validateWarrantyPhotos(request, reply) {
  try {
    const { warrantyId } = request.params;
    const validation = await photoValidationService.validateWarrantyPhotos(warrantyId);
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isValid ? "All photos valid" : "Photo validation failed"
    });
  } catch (error) {
    console.error("Error validating warranty photos:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to validate warranty photos",
      error: error.message
    });
  }
}
export async function validateInspectionPhotos(request, reply) {
  try {
    const { inspectionId } = request.params;
    const validation = await photoValidationService.validateInspectionPhotos(inspectionId);
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isValid ? "All photos valid" : "Photo validation failed"
    });
  } catch (error) {
    console.error("Error validating inspection photos:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to validate inspection photos",
      error: error.message
    });
  }
}
export async function validateCorrosionRequirements(request, reply) {
  try {
    const { recordId, recordType } = request.params;
    const validation = await photoValidationService.validateCorrosionRequirements(recordId, recordType);
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isValid ? "Corrosion requirements satisfied" : "Corrosion validation failed"
    });
  } catch (error) {
    console.error("Error validating corrosion requirements:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to validate corrosion requirements",
      error: error.message
    });
  }
}
export async function updatePhotoCategory(request, reply) {
  try {
    const { photoId, recordType } = request.params;
    const { category } = request.body;
    await photoValidationService.updatePhotoCategory(photoId, category, recordType);
    return reply.code(200).send({
      success: true,
      message: "Photo category updated successfully"
    });
  } catch (error) {
    console.error("Error updating photo category:", error);
    return reply.code(400).send({
      success: false,
      message: "Failed to update photo category",
      error: error.message
    });
  }
}
export async function validatePhotoUpload(request, reply) {
  try {
    const { recordId, recordType, category } = request.params;
    const { photoCount } = request.body;
    const validation = await photoValidationService.validatePhotoUpload(
      recordId,
      recordType,
      category,
      photoCount
    );
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.valid ? "Upload allowed" : "Upload validation failed"
    });
  } catch (error) {
    console.error("Error validating photo upload:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to validate photo upload",
      error: error.message
    });
  }
}
export async function updatePhotoValidationStatus(request, reply) {
  try {
    const { photoId, recordType } = request.params;
    const { status, notes } = request.body;
    await photoValidationService.updatePhotoValidationStatus(photoId, recordType, status, notes);
    return reply.code(200).send({
      success: true,
      message: `Photo ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error("Error updating photo validation status:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to update photo validation status",
      error: error.message
    });
  }
}
export async function createInspectionChecklist(request, reply) {
  try {
    const { inspectionId } = request.params;
    const checklist = await checklistService.createInspectionChecklist(inspectionId);
    return reply.code(201).send({
      success: true,
      data: checklist,
      message: "Inspection checklist created successfully"
    });
  } catch (error) {
    console.error("Error creating inspection checklist:", error);
    return reply.code(400).send({
      success: false,
      message: "Failed to create inspection checklist",
      error: error.message
    });
  }
}
export async function getInspectionChecklist(request, reply) {
  try {
    const { inspectionId } = request.params;
    const checklist = await checklistService.getInspectionChecklist(inspectionId);
    return reply.code(200).send({
      success: true,
      data: checklist,
      message: "Inspection checklist retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting inspection checklist:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get inspection checklist",
      error: error.message
    });
  }
}
export async function updateChecklistItem(request, reply) {
  try {
    const { itemId } = request.params;
    const { conditionStatus, notes } = request.body;
    const updatedItem = await checklistService.updateChecklistItem(itemId, conditionStatus, notes);
    return reply.code(200).send({
      success: true,
      data: updatedItem,
      message: "Checklist item updated successfully"
    });
  } catch (error) {
    console.error("Error updating checklist item:", error);
    return reply.code(400).send({
      success: false,
      message: "Failed to update checklist item",
      error: error.message
    });
  }
}
export async function validateInspectionChecklist(request, reply) {
  try {
    const { inspectionId } = request.params;
    const validation = await checklistService.validateInspectionChecklist(inspectionId);
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isComplete ? "Checklist complete" : "Checklist validation failed"
    });
  } catch (error) {
    console.error("Error validating inspection checklist:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to validate inspection checklist",
      error: error.message
    });
  }
}
export async function getChecklistTemplate(request, reply) {
  try {
    const template = checklistService.getChecklistTemplate();
    return reply.code(200).send({
      success: true,
      data: template,
      message: "Checklist template retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting checklist template:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get checklist template",
      error: error.message
    });
  }
}
export async function getSubmissionHistory(request, reply) {
  try {
    const { recordId, recordType } = request.params;
    const history = await submissionHistoryService.getSubmissionHistory(recordId, recordType);
    return reply.code(200).send({
      success: true,
      data: history,
      message: "Submission history retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting submission history:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get submission history",
      error: error.message
    });
  }
}
export async function getSubmissionVersion(request, reply) {
  try {
    const { recordId, recordType, version } = request.params;
    const submission = await submissionHistoryService.getSubmissionVersion(
      recordId,
      recordType,
      parseInt(version)
    );
    if (!submission) {
      return reply.code(404).send({
        success: false,
        message: "Submission version not found"
      });
    }
    return reply.code(200).send({
      success: true,
      data: submission,
      message: "Submission version retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting submission version:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get submission version",
      error: error.message
    });
  }
}
export async function getAuditTrail(request, reply) {
  try {
    const { recordId, recordType } = request.params;
    const auditTrail = await submissionHistoryService.getAuditTrail(recordId, recordType);
    return reply.code(200).send({
      success: true,
      data: auditTrail,
      message: "Audit trail retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting audit trail:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get audit trail",
      error: error.message
    });
  }
}
export async function getValidationSummary(request, reply) {
  try {
    const [photoSummary, checklistSummary, submissionStats] = await Promise.all([
      photoValidationService.getPhotoValidationSummary(),
      checklistService.getChecklistValidationSummary(),
      submissionHistoryService.getSubmissionStatistics()
    ]);
    return reply.code(200).send({
      success: true,
      data: {
        photos: photoSummary,
        checklists: checklistSummary,
        submissions: submissionStats
      },
      message: "Validation summary retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting validation summary:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get validation summary",
      error: error.message
    });
  }
}
export async function getRejectedSubmissions(request, reply) {
  try {
    const rejectedSubmissions = await submissionHistoryService.getRejectedSubmissions();
    return reply.code(200).send({
      success: true,
      data: rejectedSubmissions,
      message: "Rejected submissions retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting rejected submissions:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get rejected submissions",
      error: error.message
    });
  }
}
export async function getIncompleteChecklists(request, reply) {
  try {
    const incompleteChecklists = await checklistService.getIncompleteChecklists();
    return reply.code(200).send({
      success: true,
      data: incompleteChecklists,
      message: "Incomplete checklists retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting incomplete checklists:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get incomplete checklists",
      error: error.message
    });
  }
}
