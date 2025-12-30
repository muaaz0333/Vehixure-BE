import { Client } from "pg";
import { dbConfig } from "../config/database.js";
export class InspectionChecklistService {
  /**
   * Get standard inspection checklist template
   */
  getChecklistTemplate() {
    return [
      {
        itemCode: "GENERATOR_MOUNTED",
        itemName: "Generator mounted correctly and fused",
        description: "Verify generator is properly mounted and electrical connections are fused",
        category: "GENERATOR",
        displayOrder: 1,
        isRequired: true
      },
      {
        itemCode: "RED_LIGHT_ILLUMINATED",
        itemName: "RED LIGHT illuminated",
        description: "Confirm the RED warning light is functioning and illuminated",
        category: "GENERATOR",
        displayOrder: 2,
        isRequired: true
      },
      {
        itemCode: "COUPLERS_SECURE",
        itemName: "Couplers secure and sealed",
        description: "Check all coupler connections are secure and properly sealed",
        category: "COUPLERS",
        displayOrder: 3,
        isRequired: true
      },
      {
        itemCode: "ROOF_TURRET",
        itemName: "Roof turret condition",
        description: "Inspect roof turret area for corrosion or damage",
        category: "CORROSION_INSPECTION",
        displayOrder: 4,
        isRequired: true
      },
      {
        itemCode: "PILLARS",
        itemName: "Pillars condition",
        description: "Inspect all pillars (A, B, C) for corrosion or damage",
        category: "CORROSION_INSPECTION",
        displayOrder: 5,
        isRequired: true
      },
      {
        itemCode: "SILLS",
        itemName: "Sills condition",
        description: "Inspect door sills and thresholds for corrosion",
        category: "CORROSION_INSPECTION",
        displayOrder: 6,
        isRequired: true
      },
      {
        itemCode: "GUARDS_LF",
        itemName: "Guards (Left Front) condition",
        description: "Inspect left front guard/fender for corrosion or stone chips",
        category: "CORROSION_INSPECTION",
        displayOrder: 7,
        isRequired: true
      },
      {
        itemCode: "GUARDS_RF",
        itemName: "Guards (Right Front) condition",
        description: "Inspect right front guard/fender for corrosion or stone chips",
        category: "CORROSION_INSPECTION",
        displayOrder: 8,
        isRequired: true
      },
      {
        itemCode: "GUARDS_LR",
        itemName: "Guards (Left Rear) condition",
        description: "Inspect left rear guard/fender for corrosion or stone chips",
        category: "CORROSION_INSPECTION",
        displayOrder: 9,
        isRequired: true
      },
      {
        itemCode: "GUARDS_RR",
        itemName: "Guards (Right Rear) condition",
        description: "Inspect right rear guard/fender for corrosion or stone chips",
        category: "CORROSION_INSPECTION",
        displayOrder: 10,
        isRequired: true
      },
      {
        itemCode: "INNER_GUARDS",
        itemName: "Inner guards condition",
        description: "Inspect inner guard areas and wheel wells",
        category: "CORROSION_INSPECTION",
        displayOrder: 11,
        isRequired: true
      },
      {
        itemCode: "UNDER_BONNET",
        itemName: "Under bonnet condition",
        description: "Inspect engine bay and under bonnet areas",
        category: "CORROSION_INSPECTION",
        displayOrder: 12,
        isRequired: true
      },
      {
        itemCode: "FIREWALL",
        itemName: "Firewall condition",
        description: "Inspect firewall and bulkhead areas",
        category: "CORROSION_INSPECTION",
        displayOrder: 13,
        isRequired: true
      },
      {
        itemCode: "BOOT_WATER_INGRESS",
        itemName: "Boot (water ingress) condition",
        description: "Check boot/trunk area for water ingress and corrosion",
        category: "CORROSION_INSPECTION",
        displayOrder: 14,
        isRequired: true
      },
      {
        itemCode: "UNDERBODY_SEAMS",
        itemName: "Under-body, seams, sharp edges condition",
        description: "Inspect underbody, seams, and sharp edges for corrosion",
        category: "CORROSION_INSPECTION",
        displayOrder: 15,
        isRequired: true
      },
      {
        itemCode: "OWNER_ADVISED_DAMAGE",
        itemName: "Owner advised of paint damage",
        description: "Confirm owner has been advised of any paint damage found",
        category: "CUSTOMER_COMMUNICATION",
        displayOrder: 16,
        isRequired: true
      },
      {
        itemCode: "OWNER_UNDERSTANDS_OPERATION",
        itemName: "Owner understands system operation and monthly RED LIGHT check",
        description: "Confirm owner understands system operation and monthly light check requirement",
        category: "CUSTOMER_COMMUNICATION",
        displayOrder: 17,
        isRequired: true
      }
    ];
  }
  /**
   * Create checklist items for an inspection
   */
  async createInspectionChecklist(inspectionId) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const inspectionResult = await client.query(`
        SELECT id FROM annual_inspections WHERE id = $1 AND is_deleted = false
      `, [inspectionId]);
      if (inspectionResult.rows.length === 0) {
        throw new Error(`Inspection not found: ${inspectionId}`);
      }
      const existingResult = await client.query(`
        SELECT COUNT(*) as count FROM inspection_checklist_items WHERE inspection_id = $1
      `, [inspectionId]);
      if (parseInt(existingResult.rows[0].count) > 0) {
        throw new Error("Checklist already exists for this inspection");
      }
      const template = this.getChecklistTemplate();
      const createdItems = [];
      for (const templateItem of template) {
        const result = await client.query(`
          INSERT INTO inspection_checklist_items (
            id, inspection_id, item_code, item_name, condition_status, notes
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, 'PASS', NULL
          ) RETURNING *
        `, [inspectionId, templateItem.itemCode, templateItem.itemName]);
        const item = result.rows[0];
        createdItems.push({
          id: item.id,
          inspectionId: item.inspection_id,
          itemCode: item.item_code,
          itemName: item.item_name,
          conditionStatus: item.condition_status,
          notes: item.notes,
          isNotesRequired: item.is_notes_required,
          notesProvided: item.notes_provided,
          validationComplete: item.validation_complete
        });
      }
      console.log(`\u2705 Inspection checklist created: ${inspectionId} (${createdItems.length} items)`);
      return createdItems;
    } finally {
      await client.end();
    }
  }
  /**
   * Update checklist item
   */
  async updateChecklistItem(itemId, conditionStatus, notes) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      if (conditionStatus === "ISSUE_OBSERVED" && (!notes || notes.trim().length === 0)) {
        throw new Error("Notes are required when issue is observed");
      }
      const result = await client.query(`
        UPDATE inspection_checklist_items
        SET condition_status = $1, notes = $2, modified = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [conditionStatus, notes || null, itemId]);
      if (result.rows.length === 0) {
        throw new Error(`Checklist item not found: ${itemId}`);
      }
      const item = result.rows[0];
      console.log(`\u2705 Checklist item updated: ${itemId} -> ${conditionStatus}`);
      return {
        id: item.id,
        inspectionId: item.inspection_id,
        itemCode: item.item_code,
        itemName: item.item_name,
        conditionStatus: item.condition_status,
        notes: item.notes,
        isNotesRequired: item.is_notes_required,
        notesProvided: item.notes_provided,
        validationComplete: item.validation_complete
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Get checklist items for an inspection
   */
  async getInspectionChecklist(inspectionId) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT *
        FROM inspection_checklist_items
        WHERE inspection_id = $1
        ORDER BY created
      `, [inspectionId]);
      return result.rows.map((item) => ({
        id: item.id,
        inspectionId: item.inspection_id,
        itemCode: item.item_code,
        itemName: item.item_name,
        conditionStatus: item.condition_status,
        notes: item.notes,
        isNotesRequired: item.is_notes_required,
        notesProvided: item.notes_provided,
        validationComplete: item.validation_complete
      }));
    } finally {
      await client.end();
    }
  }
  /**
   * Validate inspection checklist completion using strict client requirements
   */
  async validateInspectionChecklist(inspectionId) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const checklistResult = await client.query(`
        SELECT item_code, condition_status, notes
        FROM inspection_checklist_items
        WHERE inspection_id = $1
      `, [inspectionId]);
      const checklistData = {};
      for (const item of checklistResult.rows) {
        checklistData[item.item_code] = item.condition_status;
        if (item.notes) {
          checklistData[`${item.item_code}_notes`] = item.notes;
        }
      }
      const validationResult = await client.query(
        "SELECT * FROM validate_checklist_submission($1)",
        [JSON.stringify(checklistData)]
      );
      const incompleteItems = [];
      let totalItems = 0;
      let completedItems = 0;
      let itemsWithIssues = 0;
      for (const row of validationResult.rows) {
        totalItems++;
        if (row.is_valid) {
          completedItems++;
        } else {
          incompleteItems.push(row.item_name);
        }
        if (row.status === "Issue Observed") {
          itemsWithIssues++;
        }
      }
      const isComplete = incompleteItems.length === 0;
      return {
        isComplete,
        incompleteItems,
        validationMessage: isComplete ? "All checklist items completed with required notes" : `Incomplete items requiring notes: ${incompleteItems.join(", ")}`,
        totalItems,
        completedItems,
        itemsWithIssues
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Bulk update checklist items from inspection data
   */
  async updateChecklistFromInspectionData(inspectionId, inspectionData) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      await client.query("BEGIN");
      const fieldMapping = {
        "generatorMountedCorrectly": "GENERATOR_MOUNTED",
        "redLightIlluminated": "RED_LIGHT_ILLUMINATED",
        "couplersSecureSealed": "COUPLERS_SECURE",
        "roofTurretCondition": "ROOF_TURRET",
        "pillarsCondition": "PILLARS",
        "sillsCondition": "SILLS",
        "guardsLfCondition": "GUARDS_LF",
        "guardsRfCondition": "GUARDS_RF",
        "guardsLrCondition": "GUARDS_LR",
        "guardsRrCondition": "GUARDS_RR",
        "innerGuardsCondition": "INNER_GUARDS",
        "underBonnetCondition": "UNDER_BONNET",
        "firewallCondition": "FIREWALL",
        "bootWaterIngressCondition": "BOOT_WATER_INGRESS",
        "underbodySeamsCondition": "UNDERBODY_SEAMS",
        "ownerAdvisedPaintDamage": "OWNER_ADVISED_DAMAGE",
        "ownerUnderstandsOperation": "OWNER_UNDERSTANDS_OPERATION"
      };
      for (const [field, itemCode] of Object.entries(fieldMapping)) {
        if (inspectionData[field] !== void 0) {
          let conditionStatus;
          let notes = null;
          if (typeof inspectionData[field] === "boolean") {
            conditionStatus = inspectionData[field] ? "PASS" : "ISSUE_OBSERVED";
            if (!inspectionData[field]) {
              notes = `Issue observed with ${field}`;
            }
          } else {
            conditionStatus = inspectionData[field] === "PASS" ? "PASS" : "ISSUE_OBSERVED";
            const notesField = field.replace("Condition", "Notes");
            if (inspectionData[notesField]) {
              notes = inspectionData[notesField];
            }
          }
          await client.query(`
            UPDATE inspection_checklist_items
            SET condition_status = $1, notes = $2, modified = CURRENT_TIMESTAMP
            WHERE inspection_id = $3 AND item_code = $4
          `, [conditionStatus, notes, inspectionId, itemCode]);
        }
      }
      await client.query("COMMIT");
      console.log(`\u2705 Checklist updated from inspection data: ${inspectionId}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("\u274C Error updating checklist:", error);
      throw error;
    } finally {
      await client.end();
    }
  }
  /**
   * Get checklist validation summary for admin dashboard
   */
  async getChecklistValidationSummary() {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          COUNT(DISTINCT inspection_id) as total_inspections_with_checklist,
          COUNT(*) as total_checklist_items,
          COUNT(CASE WHEN validation_complete = true THEN 1 END) as completed_items,
          COUNT(CASE WHEN condition_status = 'ISSUE_OBSERVED' THEN 1 END) as items_with_issues,
          COUNT(CASE WHEN condition_status = 'ISSUE_OBSERVED' AND notes IS NOT NULL THEN 1 END) as issues_with_notes,
          ROUND(
            (COUNT(CASE WHEN validation_complete = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
          ) as completion_percentage
        FROM inspection_checklist_items
      `);
      return result.rows[0];
    } finally {
      await client.end();
    }
  }
  /**
   * Get incomplete checklists requiring attention
   */
  async getIncompleteChecklists() {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          ai.id as inspection_id,
          ai.verification_status,
          w.make, w.model, w.vin_number,
          CONCAT(w.first_name, ' ', w.last_name) as customer_name,
          u.full_name as inspector_name,
          COUNT(ici.id) as total_items,
          COUNT(CASE WHEN ici.validation_complete = true THEN 1 END) as completed_items,
          COUNT(CASE WHEN ici.condition_status = 'ISSUE_OBSERVED' AND ici.notes IS NULL THEN 1 END) as incomplete_issues
        FROM annual_inspections ai
        JOIN warranties w ON ai.warranty_id = w.id
        JOIN users u ON ai.inspector_id = u.id
        LEFT JOIN inspection_checklist_items ici ON ai.id = ici.inspection_id
        WHERE ai.verification_status IN ('DRAFT', 'SUBMITTED_PENDING_VERIFICATION')
        AND ai.is_deleted = false
        GROUP BY ai.id, ai.verification_status, w.make, w.model, w.vin_number, 
                 w.first_name, w.last_name, u.full_name
        HAVING COUNT(CASE WHEN ici.condition_status = 'ISSUE_OBSERVED' AND ici.notes IS NULL THEN 1 END) > 0
        ORDER BY ai.modified DESC
      `);
      return result.rows;
    } finally {
      await client.end();
    }
  }
  /**
   * Delete checklist for an inspection (if needed for re-creation)
   */
  async deleteInspectionChecklist(inspectionId) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      await client.query(`
        DELETE FROM inspection_checklist_items WHERE inspection_id = $1
      `, [inspectionId]);
      console.log(`\u2705 Inspection checklist deleted: ${inspectionId}`);
    } finally {
      await client.end();
    }
  }
}
