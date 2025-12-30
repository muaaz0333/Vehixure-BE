import { Client } from "pg";
import { dbConfig } from "../config/database.js";
export class PhotoValidationService {
  /**
   * Get photo categories for a record type
   */
  async getPhotoCategories(recordType) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          id, category_code as "categoryCode", category_name as "categoryName",
          description, record_type as "recordType", is_mandatory as "isMandatory",
          min_photos as "minPhotos", max_photos as "maxPhotos", display_order as "displayOrder"
        FROM photo_categories
        WHERE record_type = $1 AND is_active = true
        ORDER BY display_order, category_name
      `, [recordType]);
      return result.rows;
    } finally {
      await client.end();
    }
  }
  /**
   * Validate warranty photos by category using strict client requirements
   */
  async validateWarrantyPhotos(warrantyId) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const photosResult = await client.query(`
        SELECT photo_category, COUNT(*) as photo_count
        FROM warranty_photos
        WHERE warranty_id = $1 AND is_deleted = false
        GROUP BY photo_category
      `, [warrantyId]);
      const photoData = photosResult.rows.reduce((acc, row) => {
        acc[row.photo_category] = {
          count: parseInt(row.photo_count)
        };
        return acc;
      }, {});
      const validationResult = await client.query(
        "SELECT * FROM validate_photo_categories($1, $2)",
        [warrantyId, JSON.stringify(photoData)]
      );
      const missingCategories = [];
      const categoryValidation = {};
      for (const row of validationResult.rows) {
        categoryValidation[row.category_name] = {
          required: row.required_count,
          provided: row.actual_count,
          valid: row.is_valid
        };
        if (!row.is_valid) {
          missingCategories.push(row.category_name);
        }
      }
      const isValid = missingCategories.length === 0;
      return {
        isValid,
        missingCategories,
        validationMessage: isValid ? "All required warranty photos provided by category" : `Missing required photo categories: ${missingCategories.join(", ")}`,
        categoryValidation
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Validate inspection photos by category
   */
  async validateInspectionPhotos(inspectionId) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const categoriesResult = await client.query(`
        SELECT category_code, min_photos
        FROM photo_categories
        WHERE record_type = 'INSPECTION' AND is_mandatory = true AND is_active = true
      `);
      const requiredCategories = categoriesResult.rows;
      const photosResult = await client.query(`
        SELECT photo_category, COUNT(*) as photo_count
        FROM inspection_photos
        WHERE inspection_id = $1 AND is_deleted = false
        GROUP BY photo_category
      `, [inspectionId]);
      const providedPhotos = photosResult.rows.reduce((acc, row) => {
        acc[row.photo_category] = parseInt(row.photo_count);
        return acc;
      }, {});
      const missingCategories = [];
      const categoryValidation = {};
      for (const category of requiredCategories) {
        const provided = providedPhotos[category.category_code] || 0;
        const required = category.min_photos;
        const valid = provided >= required;
        categoryValidation[category.category_code] = {
          required,
          provided,
          valid
        };
        if (!valid) {
          missingCategories.push(category.category_code);
        }
      }
      const isValid = missingCategories.length === 0;
      return {
        isValid,
        missingCategories,
        validationMessage: isValid ? "All required inspection photos provided" : `Missing required photo categories: ${missingCategories.join(", ")}`,
        categoryValidation
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Validate corrosion-related requirements using strict client rules
   */
  async validateCorrosionRequirements(recordId, recordType) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      let inspectionData = {};
      if (recordType === "INSPECTION") {
        const inspectionResult = await client.query(`
          SELECT 
            corrosion_found,
            corrosion_details,
            (SELECT COUNT(*) FROM inspection_photos 
             WHERE inspection_id = $1 AND photo_category = 'CORROSION_EVIDENCE' AND is_deleted = false) as corrosion_photos_count
          FROM annual_inspections WHERE id = $1
        `, [recordId]);
        if (inspectionResult.rows.length === 0) {
          throw new Error(`Inspection not found: ${recordId}`);
        }
        const record = inspectionResult.rows[0];
        inspectionData = {
          corrosion_observed: record.corrosion_found ? "YES" : "NO",
          corrosion_notes: record.corrosion_details || "",
          corrosion_photos_count: record.corrosion_photos_count
        };
      } else {
        const warrantyResult = await client.query(`
          SELECT 
            corrosion_found,
            corrosion_details,
            (SELECT COUNT(*) FROM warranty_photos 
             WHERE warranty_id = $1 AND photo_category = 'CORROSION_EVIDENCE' AND is_deleted = false) as corrosion_photos_count
          FROM warranties WHERE id = $1
        `, [recordId]);
        if (warrantyResult.rows.length === 0) {
          throw new Error(`Warranty not found: ${recordId}`);
        }
        const record = warrantyResult.rows[0];
        inspectionData = {
          corrosion_observed: record.corrosion_found ? "YES" : "NO",
          corrosion_notes: record.corrosion_details || "",
          corrosion_photos_count: record.corrosion_photos_count
        };
      }
      const validationResult = await client.query(
        "SELECT * FROM validate_corrosion_requirements($1)",
        [JSON.stringify(inspectionData)]
      );
      if (validationResult.rows.length === 0) {
        return {
          isValid: true,
          corrosionFound: inspectionData.corrosion_observed === "YES",
          notesRequired: false,
          notesProvided: inspectionData.corrosion_notes.length > 0,
          photosRequired: false,
          photosProvided: inspectionData.corrosion_photos_count > 0,
          validationMessage: "No corrosion validation rules triggered"
        };
      }
      const validation = validationResult.rows[0];
      return {
        isValid: validation.is_valid,
        corrosionFound: validation.is_triggered,
        notesRequired: validation.is_triggered,
        notesProvided: validation.notes_provided,
        photosRequired: validation.is_triggered,
        photosProvided: validation.photos_provided >= 2,
        // Client requires 2 photos minimum
        validationMessage: validation.validation_message
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Get detailed category validation for warranty
   */
  async getWarrantyCategoryValidation(warrantyId) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const categoriesResult = await client.query(`
        SELECT category_code, min_photos
        FROM photo_categories
        WHERE record_type = 'WARRANTY' AND is_mandatory = true AND is_active = true
      `);
      const photosResult = await client.query(`
        SELECT photo_category, COUNT(*) as photo_count
        FROM warranty_photos
        WHERE warranty_id = $1 AND is_deleted = false
        GROUP BY photo_category
      `, [warrantyId]);
      const providedPhotos = photosResult.rows.reduce((acc, row) => {
        acc[row.photo_category] = parseInt(row.photo_count);
        return acc;
      }, {});
      const categoryValidation = {};
      for (const category of categoriesResult.rows) {
        const provided = providedPhotos[category.category_code] || 0;
        const required = category.min_photos;
        categoryValidation[category.category_code] = {
          required,
          provided,
          valid: provided >= required
        };
      }
      return categoryValidation;
    } finally {
      await client.end();
    }
  }
  /**
   * Update photo category for existing photo
   */
  async updatePhotoCategory(photoId, category, recordType) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const categoryResult = await client.query(`
        SELECT id FROM photo_categories
        WHERE category_code = $1 AND record_type = $2 AND is_active = true
      `, [category, recordType]);
      if (categoryResult.rows.length === 0) {
        throw new Error(`Invalid photo category: ${category} for ${recordType}`);
      }
      const tableName = recordType === "WARRANTY" ? "warranty_photos" : "inspection_photos";
      await client.query(`
        UPDATE ${tableName}
        SET photo_category = $1, modified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [category, photoId]);
      console.log(`\u2705 Photo category updated: ${photoId} -> ${category}`);
    } finally {
      await client.end();
    }
  }
  /**
   * Validate photo upload against category limits
   */
  async validatePhotoUpload(recordId, recordType, category, newPhotoCount) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const categoryResult = await client.query(`
        SELECT min_photos, max_photos
        FROM photo_categories
        WHERE category_code = $1 AND record_type = $2 AND is_active = true
      `, [category, recordType]);
      if (categoryResult.rows.length === 0) {
        return {
          valid: false,
          message: `Invalid photo category: ${category}`,
          currentCount: 0,
          maxAllowed: 0
        };
      }
      const { max_photos } = categoryResult.rows[0];
      const tableName = recordType === "WARRANTY" ? "warranty_photos" : "inspection_photos";
      const idColumn = recordType === "WARRANTY" ? "warranty_id" : "inspection_id";
      const currentResult = await client.query(`
        SELECT COUNT(*) as current_count
        FROM ${tableName}
        WHERE ${idColumn} = $1 AND photo_category = $2 AND is_deleted = false
      `, [recordId, category]);
      const currentCount = parseInt(currentResult.rows[0].current_count);
      const totalAfterUpload = currentCount + newPhotoCount;
      const valid = totalAfterUpload <= max_photos;
      return {
        valid,
        message: valid ? `Upload allowed (${totalAfterUpload}/${max_photos} photos)` : `Upload would exceed limit (${totalAfterUpload}/${max_photos} photos)`,
        currentCount,
        maxAllowed: max_photos
      };
    } finally {
      await client.end();
    }
  }
  /**
   * Get photo validation summary for admin dashboard
   */
  async getPhotoValidationSummary() {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT 
          'Warranty Photos' as record_type,
          COUNT(*) as total_photos,
          COUNT(CASE WHEN photo_category IS NOT NULL THEN 1 END) as categorized_photos,
          COUNT(CASE WHEN validation_status = 'PENDING' THEN 1 END) as pending_validation,
          COUNT(CASE WHEN validation_status = 'APPROVED' THEN 1 END) as approved_photos,
          COUNT(CASE WHEN validation_status = 'REJECTED' THEN 1 END) as rejected_photos
        FROM warranty_photos WHERE is_deleted = false
        
        UNION ALL
        
        SELECT 
          'Inspection Photos' as record_type,
          COUNT(*) as total_photos,
          COUNT(CASE WHEN photo_category IS NOT NULL THEN 1 END) as categorized_photos,
          COUNT(CASE WHEN validation_status = 'PENDING' THEN 1 END) as pending_validation,
          COUNT(CASE WHEN validation_status = 'APPROVED' THEN 1 END) as approved_photos,
          COUNT(CASE WHEN validation_status = 'REJECTED' THEN 1 END) as rejected_photos
        FROM inspection_photos WHERE is_deleted = false
      `);
      return result.rows;
    } finally {
      await client.end();
    }
  }
  /**
   * Approve or reject photo validation
   */
  async updatePhotoValidationStatus(photoId, recordType, status, notes) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      const tableName = recordType === "WARRANTY" ? "warranty_photos" : "inspection_photos";
      await client.query(`
        UPDATE ${tableName}
        SET validation_status = $1, validation_notes = $2, modified = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, notes || null, photoId]);
      console.log(`\u2705 Photo validation updated: ${photoId} -> ${status}`);
    } finally {
      await client.end();
    }
  }
}
