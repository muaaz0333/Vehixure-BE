import { Client } from "pg";
import { dbConfig } from "../config/database.js";
export class SubmissionHistoryService {
  /**
   * Create submission history record when record is submitted
   */
  async createSubmissionHistory(recordId, recordType, submittedBy, recordData) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      await client.query("BEGIN");
      const versionResult = await client.query(`
        SELECT COALESCE(MAX(submission_version), 0) + 1 as next_version
        FROM submission_history
        WHERE record_id = $1 AND record_type = $2
      `, [recordId, recordType]);
      const nextVersion = versionResult.rows[0].next_version;
      const historyResult = await client.query(`
        INSERT INTO submission_history (
          id, record_id, record_type, submission_version, submitted_by,
          submitted_at, verification_status, record_data
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, CURRENT_TIMESTAMP, 
          'SUBMITTED_PENDING_VERIFICATION', $5
        ) RETURNING *
      `, [recordId, recordType, nextVersion, submittedBy, JSON.stringify(recordData)]);
      const history = historyResult.rows[0];
      const tableName = recordType === "WARRANTY" ? "warranties" : "annual_inspections";
      await client.query(`
        UPDATE ${tableName}
        SET submission_version = $1, current_submission_id = $2, modified = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [nextVersion, history.id, recordId]);
      await client.query("COMMIT");
      console.log(`\u2705 Submission history created: ${recordType} ${recordId} v${nextVersion}`);
      return {
        id: history.id,
        recordId: history.record_id,
        recordType: history.record_type,
        submissionVersion: history.submission_version,
        submittedBy: history.submitted_by,
        submittedAt: new Date(history.submitted_at),
        verificationStatus: history.verification_status,
        rejectionReason: history.rejection_reason,
        rejectedAt: history.rejected_at ? new Date(history.rejected_at) : void 0,
        rejectedBy: history.rejected_by,
        recordData: JSON.parse(history.record_data)
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("\u274C Error creating submission history:", error);
      throw error;
    } finally {
      await client.end();
    }
  }
  /**
   * Update submission history when record is rejected
   */
  async recordRejection(submissionHistoryId, rejectedBy, rejectionReason) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      await client.query(`
        UPDATE submission_history
        SET 
          verification_status = 'REJECTED_INSTALLER_DECLINED',
          rejection_reason = $1,
          rejected_at = CURRENT_TIMESTAMP,
          rejected_by = $2
        WHERE id = $3
      `, [rejectionReason, rejectedBy, submissionHistoryId]);
      console.log(`\u2705 Rejection recorded in submission history: ${submissionHistoryId}`);
    } finally {
      await client.end();
    }
  }
  /**
   * Update submission history when record is verified
   */
  async recordVerification(submissionHistoryId, verifiedBy, verificationStatus) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      await client.query(`
        UPDATE submission_history
        SET verification_status = $1
        WHERE id = $2
      `, [verificationStatus, submissionHistoryId]);
      console.log(`\u2705 Verification recorded in submission history: ${submissionHistoryId}`);
    } finally {
      await client.end();
    }
  }
  /**
   * Get complete submission history for a record
   */
  async getSubmissionHistory(recordId, recordType) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          sh.*,
          u1.full_name as submitted_by_name,
          u2.full_name as rejected_by_name
        FROM submission_history sh
        JOIN users u1 ON sh.submitted_by = u1.id
        LEFT JOIN users u2 ON sh.rejected_by = u2.id
        WHERE sh.record_id = $1 AND sh.record_type = $2 AND sh.is_deleted = false
        ORDER BY sh.submission_version DESC
      `, [recordId, recordType]);
      return result.rows.map((row) => ({
        version: row.submission_version,
        submittedBy: row.submitted_by_name,
        submittedAt: new Date(row.submitted_at),
        status: row.verification_status,
        data: JSON.parse(row.record_data),
        rejectionInfo: row.rejection_reason ? {
          reason: row.rejection_reason,
          rejectedAt: new Date(row.rejected_at),
          rejectedBy: row.rejected_by_name
        } : void 0
      }));
    } finally {
      await client.end();
    }
  }
  /**
   * Get current submission for a record
   */
  async getCurrentSubmission(recordId, recordType) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT sh.*
        FROM submission_history sh
        WHERE sh.record_id = $1 AND sh.record_type = $2 AND sh.is_deleted = false
        ORDER BY sh.submission_version DESC
        LIMIT 1
      `, [recordId, recordType]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        id: row.id,
        recordId: row.record_id,
        recordType: row.record_type,
        submissionVersion: row.submission_version,
        submittedBy: row.submitted_by,
        submittedAt: new Date(row.submitted_at),
        verificationStatus: row.verification_status,
        rejectionReason: row.rejection_reason,
        rejectedAt: row.rejected_at ? new Date(row.rejected_at) : void 0,
        rejectedBy: row.rejected_by,
        recordData: JSON.parse(row.record_data)
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Get submission history for a specific version
   */
  async getSubmissionVersion(recordId, recordType, version) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          sh.*,
          u1.full_name as submitted_by_name,
          u2.full_name as rejected_by_name
        FROM submission_history sh
        JOIN users u1 ON sh.submitted_by = u1.id
        LEFT JOIN users u2 ON sh.rejected_by = u2.id
        WHERE sh.record_id = $1 AND sh.record_type = $2 
        AND sh.submission_version = $3 AND sh.is_deleted = false
      `, [recordId, recordType, version]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      return {
        version: row.submission_version,
        submittedBy: row.submitted_by_name,
        submittedAt: new Date(row.submitted_at),
        status: row.verification_status,
        data: JSON.parse(row.record_data),
        rejectionInfo: row.rejection_reason ? {
          reason: row.rejection_reason,
          rejectedAt: new Date(row.rejected_at),
          rejectedBy: row.rejected_by_name
        } : void 0
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Get all rejected submissions requiring attention
   */
  async getRejectedSubmissions() {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          sh.record_id,
          sh.record_type,
          sh.submission_version,
          sh.rejection_reason,
          sh.rejected_at,
          u1.full_name as submitted_by_name,
          u2.full_name as rejected_by_name,
          CASE 
            WHEN sh.record_type = 'WARRANTY' THEN 
              CONCAT(w.make, ' ', w.model, ' (', w.vin_number, ')')
            WHEN sh.record_type = 'INSPECTION' THEN 
              CONCAT('Inspection for ', w2.make, ' ', w2.model, ' (', w2.vin_number, ')')
          END as record_description,
          CASE 
            WHEN sh.record_type = 'WARRANTY' THEN 
              CONCAT(w.first_name, ' ', w.last_name)
            WHEN sh.record_type = 'INSPECTION' THEN 
              CONCAT(w2.first_name, ' ', w2.last_name)
          END as customer_name
        FROM submission_history sh
        JOIN users u1 ON sh.submitted_by = u1.id
        LEFT JOIN users u2 ON sh.rejected_by = u2.id
        LEFT JOIN warranties w ON sh.record_id = w.id AND sh.record_type = 'WARRANTY'
        LEFT JOIN annual_inspections ai ON sh.record_id = ai.id AND sh.record_type = 'INSPECTION'
        LEFT JOIN warranties w2 ON ai.warranty_id = w2.id
        WHERE sh.verification_status = 'REJECTED_INSTALLER_DECLINED'
        AND sh.is_deleted = false
        ORDER BY sh.rejected_at DESC
      `);
      return result.rows;
    } finally {
      await client.end();
    }
  }
  /**
   * Get submission statistics for admin dashboard
   */
  async getSubmissionStatistics() {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          record_type,
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN verification_status = 'SUBMITTED_PENDING_VERIFICATION' THEN 1 END) as pending_submissions,
          COUNT(CASE WHEN verification_status LIKE 'VERIFIED_%' THEN 1 END) as verified_submissions,
          COUNT(CASE WHEN verification_status LIKE 'REJECTED_%' THEN 1 END) as rejected_submissions,
          COUNT(DISTINCT record_id) as unique_records,
          AVG(submission_version) as avg_submission_version
        FROM submission_history
        WHERE is_deleted = false
        GROUP BY record_type
        
        UNION ALL
        
        SELECT 
          'TOTAL' as record_type,
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN verification_status = 'SUBMITTED_PENDING_VERIFICATION' THEN 1 END) as pending_submissions,
          COUNT(CASE WHEN verification_status LIKE 'VERIFIED_%' THEN 1 END) as verified_submissions,
          COUNT(CASE WHEN verification_status LIKE 'REJECTED_%' THEN 1 END) as rejected_submissions,
          COUNT(DISTINCT record_id) as unique_records,
          AVG(submission_version) as avg_submission_version
        FROM submission_history
        WHERE is_deleted = false
      `);
      return result.rows;
    } finally {
      await client.end();
    }
  }
  /**
   * Compare two submission versions
   */
  async compareSubmissionVersions(recordId, recordType, version1, version2) {
    const [v1, v2] = await Promise.all([
      this.getSubmissionVersion(recordId, recordType, version1),
      this.getSubmissionVersion(recordId, recordType, version2)
    ]);
    if (!v1 || !v2) {
      throw new Error("One or both submission versions not found");
    }
    const differences = [];
    const keys1 = Object.keys(v1.data);
    const keys2 = Object.keys(v2.data);
    const allKeys = [.../* @__PURE__ */ new Set([...keys1, ...keys2])];
    for (const key of allKeys) {
      const val1 = v1.data[key];
      const val2 = v2.data[key];
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          field: key,
          version1Value: val1,
          version2Value: val2
        });
      }
    }
    return {
      version1: v1,
      version2: v2,
      differences
    };
  }
  /**
   * Archive old submission history (for maintenance)
   */
  async archiveOldSubmissions(olderThanDays = 365) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        UPDATE submission_history
        SET is_deleted = true
        WHERE submitted_at < CURRENT_DATE - INTERVAL '${olderThanDays} days'
        AND verification_status NOT IN ('SUBMITTED_PENDING_VERIFICATION')
        AND is_deleted = false
      `);
      const archivedCount = result.rowCount || 0;
      console.log(`\u2705 Archived ${archivedCount} old submission history records`);
      return archivedCount;
    } finally {
      await client.end();
    }
  }
  /**
   * Get audit trail for a record (formatted for display)
   */
  async getAuditTrail(recordId, recordType) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          sh.submission_version,
          sh.submitted_at,
          sh.verification_status,
          sh.rejection_reason,
          sh.rejected_at,
          u1.full_name as submitted_by_name,
          u2.full_name as rejected_by_name,
          'SUBMISSION' as event_type
        FROM submission_history sh
        JOIN users u1 ON sh.submitted_by = u1.id
        LEFT JOIN users u2 ON sh.rejected_by = u2.id
        WHERE sh.record_id = $1 AND sh.record_type = $2 AND sh.is_deleted = false
        
        UNION ALL
        
        SELECT 
          NULL as submission_version,
          created as submitted_at,
          'DRAFT' as verification_status,
          NULL as rejection_reason,
          NULL as rejected_at,
          u.full_name as submitted_by_name,
          NULL as rejected_by_name,
          'CREATION' as event_type
        FROM ${recordType === "WARRANTY" ? "warranties" : "annual_inspections"} r
        JOIN users u ON r.agent_id = u.id OR r.inspector_id = u.id
        WHERE r.id = $1
        
        ORDER BY submitted_at
      `, [recordId, recordType]);
      return result.rows.map((row) => ({
        eventType: row.event_type,
        timestamp: new Date(row.submitted_at),
        version: row.submission_version,
        status: row.verification_status,
        performedBy: row.submitted_by_name,
        rejectionInfo: row.rejection_reason ? {
          reason: row.rejection_reason,
          rejectedAt: new Date(row.rejected_at),
          rejectedBy: row.rejected_by_name
        } : null
      }));
    } finally {
      await client.end();
    }
  }
}
