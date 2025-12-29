import { FastifyRequest, FastifyReply } from 'fastify';
import { PhotoValidationService } from '../services/photo-validation-service.js';
import { InspectionChecklistService } from '../services/inspection-checklist-service.js';
import { SubmissionHistoryService } from '../services/submission-history-service.js';

const photoValidationService = new PhotoValidationService();
const checklistService = new InspectionChecklistService();
const submissionHistoryService = new SubmissionHistoryService();

/**
 * Get photo categories for a record type
 */
export async function getPhotoCategories(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { recordType } = request.params as { recordType: 'WARRANTY' | 'INSPECTION' };
    
    const categories = await photoValidationService.getPhotoCategories(recordType);
    
    return reply.code(200).send({
      success: true,
      data: categories,
      message: `Photo categories retrieved for ${recordType}`
    });
    
  } catch (error) {
    console.error('Error getting photo categories:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get photo categories',
      error: error.message
    });
  }
}

/**
 * Validate warranty photos
 */
export async function validateWarrantyPhotos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { warrantyId } = request.params as { warrantyId: string };
    
    const validation = await photoValidationService.validateWarrantyPhotos(warrantyId);
    
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isValid ? 'All photos valid' : 'Photo validation failed'
    });
    
  } catch (error) {
    console.error('Error validating warranty photos:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to validate warranty photos',
      error: error.message
    });
  }
}

/**
 * Validate inspection photos
 */
export async function validateInspectionPhotos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { inspectionId } = request.params as { inspectionId: string };
    
    const validation = await photoValidationService.validateInspectionPhotos(inspectionId);
    
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isValid ? 'All photos valid' : 'Photo validation failed'
    });
    
  } catch (error) {
    console.error('Error validating inspection photos:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to validate inspection photos',
      error: error.message
    });
  }
}

/**
 * Validate corrosion requirements
 */
export async function validateCorrosionRequirements(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { recordId, recordType } = request.params as { 
      recordId: string; 
      recordType: 'WARRANTY' | 'INSPECTION' 
    };
    
    const validation = await photoValidationService.validateCorrosionRequirements(recordId, recordType);
    
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isValid ? 'Corrosion requirements satisfied' : 'Corrosion validation failed'
    });
    
  } catch (error) {
    console.error('Error validating corrosion requirements:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to validate corrosion requirements',
      error: error.message
    });
  }
}

/**
 * Update photo category
 */
export async function updatePhotoCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { photoId, recordType } = request.params as { 
      photoId: string; 
      recordType: 'WARRANTY' | 'INSPECTION' 
    };
    const { category } = request.body as { category: string };
    
    await photoValidationService.updatePhotoCategory(photoId, category, recordType);
    
    return reply.code(200).send({
      success: true,
      message: 'Photo category updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating photo category:', error);
    return reply.code(400).send({
      success: false,
      message: 'Failed to update photo category',
      error: error.message
    });
  }
}

/**
 * Validate photo upload
 */
export async function validatePhotoUpload(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { recordId, recordType, category } = request.params as { 
      recordId: string; 
      recordType: 'WARRANTY' | 'INSPECTION';
      category: string;
    };
    const { photoCount } = request.body as { photoCount: number };
    
    const validation = await photoValidationService.validatePhotoUpload(
      recordId, recordType, category, photoCount
    );
    
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.valid ? 'Upload allowed' : 'Upload validation failed'
    });
    
  } catch (error) {
    console.error('Error validating photo upload:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to validate photo upload',
      error: error.message
    });
  }
}

/**
 * Update photo validation status (ERPS Admin only)
 */
export async function updatePhotoValidationStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { photoId, recordType } = request.params as { 
      photoId: string; 
      recordType: 'WARRANTY' | 'INSPECTION' 
    };
    const { status, notes } = request.body as { 
      status: 'APPROVED' | 'REJECTED'; 
      notes?: string 
    };
    
    await photoValidationService.updatePhotoValidationStatus(photoId, recordType, status, notes);
    
    return reply.code(200).send({
      success: true,
      message: `Photo ${status.toLowerCase()} successfully`
    });
    
  } catch (error) {
    console.error('Error updating photo validation status:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to update photo validation status',
      error: error.message
    });
  }
}

/**
 * Create inspection checklist
 */
export async function createInspectionChecklist(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { inspectionId } = request.params as { inspectionId: string };
    
    const checklist = await checklistService.createInspectionChecklist(inspectionId);
    
    return reply.code(201).send({
      success: true,
      data: checklist,
      message: 'Inspection checklist created successfully'
    });
    
  } catch (error) {
    console.error('Error creating inspection checklist:', error);
    return reply.code(400).send({
      success: false,
      message: 'Failed to create inspection checklist',
      error: error.message
    });
  }
}

/**
 * Get inspection checklist
 */
export async function getInspectionChecklist(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { inspectionId } = request.params as { inspectionId: string };
    
    const checklist = await checklistService.getInspectionChecklist(inspectionId);
    
    return reply.code(200).send({
      success: true,
      data: checklist,
      message: 'Inspection checklist retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting inspection checklist:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get inspection checklist',
      error: error.message
    });
  }
}

/**
 * Update checklist item
 */
export async function updateChecklistItem(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { itemId } = request.params as { itemId: string };
    const { conditionStatus, notes } = request.body as { 
      conditionStatus: 'PASS' | 'ISSUE_OBSERVED'; 
      notes?: string 
    };
    
    const updatedItem = await checklistService.updateChecklistItem(itemId, conditionStatus, notes);
    
    return reply.code(200).send({
      success: true,
      data: updatedItem,
      message: 'Checklist item updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating checklist item:', error);
    return reply.code(400).send({
      success: false,
      message: 'Failed to update checklist item',
      error: error.message
    });
  }
}

/**
 * Validate inspection checklist
 */
export async function validateInspectionChecklist(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { inspectionId } = request.params as { inspectionId: string };
    
    const validation = await checklistService.validateInspectionChecklist(inspectionId);
    
    return reply.code(200).send({
      success: true,
      data: validation,
      message: validation.isComplete ? 'Checklist complete' : 'Checklist validation failed'
    });
    
  } catch (error) {
    console.error('Error validating inspection checklist:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to validate inspection checklist',
      error: error.message
    });
  }
}

/**
 * Get checklist template
 */
export async function getChecklistTemplate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const template = checklistService.getChecklistTemplate();
    
    return reply.code(200).send({
      success: true,
      data: template,
      message: 'Checklist template retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting checklist template:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get checklist template',
      error: error.message
    });
  }
}

/**
 * Get submission history
 */
export async function getSubmissionHistory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { recordId, recordType } = request.params as { 
      recordId: string; 
      recordType: 'WARRANTY' | 'INSPECTION' 
    };
    
    const history = await submissionHistoryService.getSubmissionHistory(recordId, recordType);
    
    return reply.code(200).send({
      success: true,
      data: history,
      message: 'Submission history retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting submission history:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get submission history',
      error: error.message
    });
  }
}

/**
 * Get submission version
 */
export async function getSubmissionVersion(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { recordId, recordType, version } = request.params as { 
      recordId: string; 
      recordType: 'WARRANTY' | 'INSPECTION';
      version: string;
    };
    
    const submission = await submissionHistoryService.getSubmissionVersion(
      recordId, recordType, parseInt(version)
    );
    
    if (!submission) {
      return reply.code(404).send({
        success: false,
        message: 'Submission version not found'
      });
    }
    
    return reply.code(200).send({
      success: true,
      data: submission,
      message: 'Submission version retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting submission version:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get submission version',
      error: error.message
    });
  }
}

/**
 * Get audit trail
 */
export async function getAuditTrail(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { recordId, recordType } = request.params as { 
      recordId: string; 
      recordType: 'WARRANTY' | 'INSPECTION' 
    };
    
    const auditTrail = await submissionHistoryService.getAuditTrail(recordId, recordType);
    
    return reply.code(200).send({
      success: true,
      data: auditTrail,
      message: 'Audit trail retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting audit trail:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get audit trail',
      error: error.message
    });
  }
}

/**
 * Get validation summary (ERPS Admin only)
 */
export async function getValidationSummary(request: FastifyRequest, reply: FastifyReply) {
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
      message: 'Validation summary retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting validation summary:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get validation summary',
      error: error.message
    });
  }
}

/**
 * Get rejected submissions (ERPS Admin only)
 */
export async function getRejectedSubmissions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const rejectedSubmissions = await submissionHistoryService.getRejectedSubmissions();
    
    return reply.code(200).send({
      success: true,
      data: rejectedSubmissions,
      message: 'Rejected submissions retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting rejected submissions:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get rejected submissions',
      error: error.message
    });
  }
}

/**
 * Get incomplete checklists (ERPS Admin only)
 */
export async function getIncompleteChecklists(request: FastifyRequest, reply: FastifyReply) {
  try {
    const incompleteChecklists = await checklistService.getIncompleteChecklists();
    
    return reply.code(200).send({
      success: true,
      data: incompleteChecklists,
      message: 'Incomplete checklists retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting incomplete checklists:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get incomplete checklists',
      error: error.message
    });
  }
}