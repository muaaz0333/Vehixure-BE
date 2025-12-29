import { Client } from 'pg';
import { dbConfig } from '../config/database.js';
import { ReminderService } from './reminder-service.js';

export interface WarrantyReinstatement {
  id: string;
  warrantyId: string;
  reinstatedBy: string;
  reinstatementDate: Date;
  reason: string;
  previousLapseDate?: Date;
  newExpiryDate: Date;
  inspectionId?: string;
  notes?: string;
}

export interface ReinstatementRequest {
  warrantyId: string;
  reinstatedBy: string;
  reason: string;
  inspectionId?: string;
  notes?: string;
}

export class WarrantyReinstatementService {
  private reminderService: ReminderService;

  constructor() {
    this.reminderService = new ReminderService();
  }

  /**
   * Reinstate a lapsed warranty (ERPS Admin only)
   */
  async reinstateWarranty(request: ReinstatementRequest): Promise<WarrantyReinstatement> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      await client.query('BEGIN');
      
      // Use the new database function for admin-only reinstatement with strict validation
      const result = await client.query(
        'SELECT reinstate_warranty($1, $2, $3, $4) as success',
        [request.warrantyId, request.reinstatedBy, request.reason, request.notes || null]
      );

      if (!result.rows[0]?.success) {
        throw new Error('Warranty reinstatement failed - admin validation or business rules violated');
      }

      // Get the reinstatement record that was created
      const reinstatementResult = await client.query(`
        SELECT * FROM warranty_reinstatements 
        WHERE warranty_id = $1 
        ORDER BY reinstated_at DESC 
        LIMIT 1
      `, [request.warrantyId]);

      if (reinstatementResult.rows.length === 0) {
        throw new Error('Reinstatement record not found after successful reinstatement');
      }

      const reinstatement = reinstatementResult.rows[0];
      
      await client.query('COMMIT');
      
      // Schedule new reminders for the reinstated warranty
      await this.reminderService.scheduleWarrantyReminders(request.warrantyId);
      
      console.log(`✅ Warranty reinstated: ${request.warrantyId}`);
      console.log(`   Reinstated by: ${request.reinstatedBy}`);
      
      return {
        id: reinstatement.id,
        warrantyId: reinstatement.warranty_id,
        reinstatedBy: reinstatement.admin_user_id,
        reinstatementDate: new Date(reinstatement.reinstated_at),
        reason: reinstatement.reinstatement_reason,
        previousLapseDate: undefined, // Will be tracked in reinstatement history
        newExpiryDate: new Date(), // Will be calculated by system
        inspectionId: request.inspectionId,
        notes: reinstatement.reinstatement_notes
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error reinstating warranty:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * Get all lapsed warranties eligible for reinstatement
   */
  async getLapsedWarranties(): Promise<any[]> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          w.id, w.make, w.model, w.vin_number as "vinNumber",
          CONCAT(w.first_name, ' ', w.last_name) as customer_name,
          w.email, w.warranty_lapsed_at as "warrantyLapsedAt",
          w.grace_period_end as "gracePeriodEnd",
          pa.business_name as "businessName",
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM annual_inspections ai 
              WHERE ai.warranty_id = w.id 
              AND ai.verification_status = 'VERIFIED_INSPECTION_COMPLETE'
              AND ai.verified_at > w.warranty_lapsed_at
            ) THEN true 
            ELSE false 
          END as has_completed_inspection,
          (
            SELECT COUNT(*) FROM warranty_reinstatements wr 
            WHERE wr.warranty_id = w.id AND wr.is_deleted = false
          ) as reinstatement_count
        FROM warranties w
        JOIN partner_accounts pa ON w.partner_account_id = pa.id
        WHERE w.grace_period_expired = true
        AND w.is_deleted = false
        AND w.verification_status != 'VERIFIED_ACTIVE'
        ORDER BY w.warranty_lapsed_at DESC
      `);
      
      return result.rows;
      
    } finally {
      await client.end();
    }
  }

  /**
   * Get reinstatement history for a warranty
   */
  async getWarrantyReinstatementHistory(warrantyId: string): Promise<WarrantyReinstatement[]> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          wr.*,
          u.full_name as reinstated_by_name,
          ai.inspection_date
        FROM warranty_reinstatements wr
        JOIN users u ON wr.reinstated_by = u.id
        LEFT JOIN annual_inspections ai ON wr.inspection_id = ai.id
        WHERE wr.warranty_id = $1 AND wr.is_deleted = false
        ORDER BY wr.reinstatement_date DESC
      `, [warrantyId]);
      
      return result.rows.map(row => ({
        id: row.id,
        warrantyId: row.warranty_id,
        reinstatedBy: row.reinstated_by,
        reinstatementDate: new Date(row.reinstatement_date),
        reason: row.reason,
        previousLapseDate: row.previous_lapse_date ? new Date(row.previous_lapse_date) : undefined,
        newExpiryDate: new Date(row.new_expiry_date),
        inspectionId: row.inspection_id,
        notes: row.notes
      }));
      
    } finally {
      await client.end();
    }
  }

  /**
   * Check if a warranty is eligible for reinstatement
   */
  async checkReinstatementEligibility(warrantyId: string): Promise<{
    eligible: boolean;
    reason: string;
    hasCompletedInspection: boolean;
    inspectionId?: string;
    lapsedDate?: Date;
  }> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Get warranty status
      const warrantyResult = await client.query(`
        SELECT 
          id, verification_status, grace_period_expired, warranty_lapsed_at,
          is_reinstated
        FROM warranties 
        WHERE id = $1 AND is_deleted = false
      `, [warrantyId]);
      
      if (warrantyResult.rows.length === 0) {
        return {
          eligible: false,
          reason: 'Warranty not found',
          hasCompletedInspection: false
        };
      }
      
      const warranty = warrantyResult.rows[0];
      
      // Check if already active
      if (warranty.verification_status === 'VERIFIED_ACTIVE' && !warranty.grace_period_expired) {
        return {
          eligible: false,
          reason: 'Warranty is already active',
          hasCompletedInspection: false
        };
      }
      
      // Check if lapsed
      if (!warranty.grace_period_expired) {
        return {
          eligible: false,
          reason: 'Warranty has not lapsed and does not require reinstatement',
          hasCompletedInspection: false
        };
      }
      
      // Check for completed inspection after lapse
      const inspectionResult = await client.query(`
        SELECT id, verified_at
        FROM annual_inspections 
        WHERE warranty_id = $1 
        AND verification_status = 'VERIFIED_INSPECTION_COMPLETE'
        AND verified_at > $2
        ORDER BY verified_at DESC
        LIMIT 1
      `, [warrantyId, warranty.warranty_lapsed_at]);
      
      const hasCompletedInspection = inspectionResult.rows.length > 0;
      const inspectionId = hasCompletedInspection ? inspectionResult.rows[0].id : undefined;
      
      return {
        eligible: true,
        reason: hasCompletedInspection 
          ? 'Eligible for reinstatement with completed inspection'
          : 'Eligible for reinstatement (admin discretion)',
        hasCompletedInspection,
        inspectionId,
        lapsedDate: warranty.warranty_lapsed_at ? new Date(warranty.warranty_lapsed_at) : undefined
      };
      
    } finally {
      await client.end();
    }
  }

  /**
   * Get reinstatement statistics for admin dashboard
   */
  async getReinstatementStatistics(): Promise<any> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          COUNT(DISTINCT w.id) as total_lapsed_warranties,
          COUNT(DISTINCT wr.warranty_id) as total_reinstated_warranties,
          COUNT(DISTINCT CASE WHEN w.grace_period_expired = true AND w.verification_status != 'VERIFIED_ACTIVE' THEN w.id END) as eligible_for_reinstatement,
          COUNT(DISTINCT CASE WHEN wr.reinstatement_date >= CURRENT_DATE - INTERVAL '30 days' THEN wr.warranty_id END) as reinstated_last_30_days,
          COUNT(DISTINCT CASE WHEN w.grace_period_expired = true AND EXISTS (
            SELECT 1 FROM annual_inspections ai 
            WHERE ai.warranty_id = w.id 
            AND ai.verification_status = 'VERIFIED_INSPECTION_COMPLETE'
            AND ai.verified_at > w.warranty_lapsed_at
          ) THEN w.id END) as lapsed_with_completed_inspection
        FROM warranties w
        LEFT JOIN warranty_reinstatements wr ON w.id = wr.warranty_id AND wr.is_deleted = false
        WHERE w.is_deleted = false
      `);
      
      return result.rows[0];
      
    } finally {
      await client.end();
    }
  }

  /**
   * Bulk reinstate warranties (for system maintenance)
   */
  async bulkReinstateWarranties(
    warrantyIds: string[], 
    reinstatedBy: string, 
    reason: string
  ): Promise<{ successful: string[]; failed: { warrantyId: string; error: string }[] }> {
    const successful: string[] = [];
    const failed: { warrantyId: string; error: string }[] = [];
    
    for (const warrantyId of warrantyIds) {
      try {
        await this.reinstateWarranty({
          warrantyId,
          reinstatedBy,
          reason,
          notes: 'Bulk reinstatement operation'
        });
        successful.push(warrantyId);
      } catch (error) {
        failed.push({
          warrantyId,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Bulk reinstatement complete: ${successful.length} successful, ${failed.length} failed`);
    
    return { successful, failed };
  }
}