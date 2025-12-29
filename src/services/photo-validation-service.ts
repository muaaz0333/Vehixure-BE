import { Client } from 'pg';
import { dbConfig } from '../config/database.js';

export interface PhotoCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  recordType: 'WARRANTY' | 'INSPECTION';
  isMandatory: boolean;
  minPhotos: number;
  maxPhotos: number;
  displayOrder: number;
}

export interface PhotoValidationResult {
  isValid: boolean;
  missingCategories: string[];
  validationMessage: string;
  categoryValidation: {
    [categoryCode: string]: {
      required: number;
      provided: number;
      valid: boolean;
    };
  };
}

export interface CorrosionValidationResult {
  isValid: boolean;
  corrosionFound: boolean;
  notesRequired: boolean;
  notesProvided: boolean;
  photosRequired: boolean;
  photosProvided: boolean;
  validationMessage: string;
}

export class PhotoValidationService {

  /**
   * Get photo categories from system configuration
   */
  async getPhotoCategories(recordType: 'WARRANTY' | 'INSPECTION'): Promise<PhotoCategory[]> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Get photo validation rules from system_config
      const result = await client.query(`
        SELECT 
          id, 
          config_key as "categoryCode", 
          config_name as "categoryName",
          description, 
          boolean_value as "isMandatory",
          integer_value as "minPhotos",
          priority_order as "displayOrder"
        FROM system_config
        WHERE config_category = 'PHOTO_VALIDATION' AND is_active = true
        ORDER BY priority_order, config_name
      `);
      
      return result.rows.map(row => ({
        ...row,
        recordType,
        maxPhotos: 10 // Default max photos
      }));
      
    } finally {
      await client.end();
    }
  }

  /**
   * Validate warranty photos by category using consolidated photos table
   */
  async validateWarrantyPhotos(warrantyId: string): Promise<PhotoValidationResult> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Get warranty photos data from consolidated photos table
      const photosResult = await client.query(`
        SELECT photo_category, COUNT(*) as photo_count
        FROM photos
        WHERE warranty_id = $1 AND is_deleted = false
        GROUP BY photo_category
      `, [warrantyId]);
      
      const photoData = photosResult.rows.reduce((acc: any, row: any) => {
        acc[row.photo_category] = {
          count: parseInt(row.photo_count)
        };
        return acc;
      }, {});
      
      // Use the new database function for validation if available
      try {
        const validationResult = await client.query(
          'SELECT * FROM validate_photo_requirements($1, NULL)',
          [warrantyId]
        );
        
        const missingCategories: string[] = [];
        const categoryValidation: any = {};
        
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
          validationMessage: isValid 
            ? 'All required warranty photos provided by category'
            : `Missing required photo categories: ${missingCategories.join(', ')}`,
          categoryValidation
        };
      } catch (error) {
        // Fallback to basic validation if function doesn't exist
        return this.basicPhotoValidation(photoData, 'WARRANTY');
      }
      
    } finally {
      await client.end();
    }
  }

  /**
   * Validate inspection photos by category using consolidated photos table
   */
  async validateInspectionPhotos(inspectionId: string): Promise<PhotoValidationResult> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Get inspection photos data from consolidated photos table
      const photosResult = await client.query(`
        SELECT photo_category, COUNT(*) as photo_count
        FROM photos
        WHERE inspection_id = $1 AND is_deleted = false
        GROUP BY photo_category
      `, [inspectionId]);
      
      const photoData = photosResult.rows.reduce((acc: any, row: any) => {
        acc[row.photo_category] = {
          count: parseInt(row.photo_count)
        };
        return acc;
      }, {});
      
      // Use the new database function for validation if available
      try {
        const validationResult = await client.query(
          'SELECT * FROM validate_photo_requirements(NULL, $1)',
          [inspectionId]
        );
        
        const missingCategories: string[] = [];
        const categoryValidation: any = {};
        
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
          validationMessage: isValid 
            ? 'All required inspection photos provided'
            : `Missing required photo categories: ${missingCategories.join(', ')}`,
          categoryValidation
        };
      } catch (error) {
        // Fallback to basic validation if function doesn't exist
        return this.basicPhotoValidation(photoData, 'INSPECTION');
      }
      
    } finally {
      await client.end();
    }
  }

  /**
   * Basic photo validation fallback
   */
  private basicPhotoValidation(photoData: any, recordType: 'WARRANTY' | 'INSPECTION'): PhotoValidationResult {
    // Basic validation rules
    const requiredCategories = recordType === 'WARRANTY' 
      ? ['GENERATOR', 'COUPLER', 'CORROSION_OR_CLEAR']
      : ['GENERATOR_RED_LIGHT', 'COUPLERS', 'CORROSION_OR_CLEAR'];
    
    const missingCategories: string[] = [];
    const categoryValidation: any = {};
    
    for (const category of requiredCategories) {
      const provided = photoData[category]?.count || 0;
      const required = 1; // Minimum 1 photo per category
      const valid = provided >= required;
      
      categoryValidation[category] = {
        required,
        provided,
        valid
      };
      
      if (!valid) {
        missingCategories.push(category);
      }
    }
    
    const isValid = missingCategories.length === 0;
    
    return {
      isValid,
      missingCategories,
      validationMessage: isValid 
        ? `All required ${recordType.toLowerCase()} photos provided`
        : `Missing required photo categories: ${missingCategories.join(', ')}`,
      categoryValidation
    };
  }

  /**
   * Validate corrosion-related requirements using consolidated tables
   */
  async validateCorrosionRequirements(recordId: string, recordType: 'WARRANTY' | 'INSPECTION'): Promise<CorrosionValidationResult> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      let inspectionData: any = {};
      
      if (recordType === 'INSPECTION') {
        // Get inspection data for corrosion validation
        const inspectionResult = await client.query(`
          SELECT 
            corrosion_found,
            corrosion_details,
            (SELECT COUNT(*) FROM photos 
             WHERE inspection_id = $1 AND photo_category = 'CORROSION_EVIDENCE' AND is_deleted = false) as corrosion_photos_count
          FROM annual_inspections WHERE id = $1
        `, [recordId]);
        
        if (inspectionResult.rows.length === 0) {
          throw new Error(`Inspection not found: ${recordId}`);
        }
        
        const record = inspectionResult.rows[0];
        inspectionData = {
          corrosion_observed: record.corrosion_found ? 'YES' : 'NO',
          corrosion_notes: record.corrosion_details || '',
          corrosion_photos_count: record.corrosion_photos_count
        };
      } else {
        // For warranty, get similar data structure
        const warrantyResult = await client.query(`
          SELECT 
            corrosion_found,
            corrosion_details,
            (SELECT COUNT(*) FROM photos 
             WHERE warranty_id = $1 AND photo_category = 'CORROSION_EVIDENCE' AND is_deleted = false) as corrosion_photos_count
          FROM warranties WHERE id = $1
        `, [recordId]);
        
        if (warrantyResult.rows.length === 0) {
          throw new Error(`Warranty not found: ${recordId}`);
        }
        
        const record = warrantyResult.rows[0];
        inspectionData = {
          corrosion_observed: record.corrosion_found ? 'YES' : 'NO',
          corrosion_notes: record.corrosion_details || '',
          corrosion_photos_count: record.corrosion_photos_count
        };
      }
      
      // Basic corrosion validation
      const corrosionFound = inspectionData.corrosion_observed === 'YES';
      const notesProvided = inspectionData.corrosion_notes.length > 0;
      const photosProvided = inspectionData.corrosion_photos_count > 0;
      
      const isValid = !corrosionFound || (notesProvided && photosProvided);
      
      return {
        isValid,
        corrosionFound,
        notesRequired: corrosionFound,
        notesProvided,
        photosRequired: corrosionFound,
        photosProvided,
        validationMessage: isValid 
          ? 'Corrosion validation passed'
          : 'Corrosion found but missing required notes or photos'
      };
      
    } finally {
      await client.end();
    }
  }

  /**
   * Update photo category for existing photo in consolidated table
   */
  async updatePhotoCategory(
    photoId: string, 
    category: string, 
    recordType: 'WARRANTY' | 'INSPECTION'
  ): Promise<void> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Update photo category in consolidated photos table
      await client.query(`
        UPDATE photos
        SET photo_category = $1, modified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [category, photoId]);
      
      console.log(`✅ Photo category updated: ${photoId} -> ${category}`);
      
    } finally {
      await client.end();
    }
  }

  /**
   * Validate photo upload against category limits
   */
  async validatePhotoUpload(
    recordId: string,
    recordType: 'WARRANTY' | 'INSPECTION',
    category: string,
    newPhotoCount: number
  ): Promise<{ valid: boolean; message: string; currentCount: number; maxAllowed: number }> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const maxPhotos = 10; // Default max photos per category
      
      // Get current photo count for this category from consolidated table
      const idColumn = recordType === 'WARRANTY' ? 'warranty_id' : 'inspection_id';
      
      const currentResult = await client.query(`
        SELECT COUNT(*) as current_count
        FROM photos
        WHERE ${idColumn} = $1 AND photo_category = $2 AND is_deleted = false
      `, [recordId, category]);
      
      const currentCount = parseInt(currentResult.rows[0].current_count);
      const totalAfterUpload = currentCount + newPhotoCount;
      
      const valid = totalAfterUpload <= maxPhotos;
      
      return {
        valid,
        message: valid 
          ? `Upload allowed (${totalAfterUpload}/${maxPhotos} photos)`
          : `Upload would exceed limit (${totalAfterUpload}/${maxPhotos} photos)`,
        currentCount,
        maxAllowed: maxPhotos
      };
      
    } finally {
      await client.end();
    }
  }

  /**
   * Get photo validation summary for admin dashboard using consolidated table
   */
  async getPhotoValidationSummary(): Promise<any> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          'Warranty Photos' as record_type,
          COUNT(*) as total_photos,
          COUNT(CASE WHEN photo_category IS NOT NULL THEN 1 END) as categorized_photos,
          COUNT(CASE WHEN warranty_id IS NOT NULL THEN 1 END) as warranty_photos,
          COUNT(CASE WHEN inspection_id IS NOT NULL THEN 1 END) as inspection_photos
        FROM photos 
        WHERE is_deleted = false AND warranty_id IS NOT NULL
        
        UNION ALL
        
        SELECT 
          'Inspection Photos' as record_type,
          COUNT(*) as total_photos,
          COUNT(CASE WHEN photo_category IS NOT NULL THEN 1 END) as categorized_photos,
          COUNT(CASE WHEN warranty_id IS NOT NULL THEN 1 END) as warranty_photos,
          COUNT(CASE WHEN inspection_id IS NOT NULL THEN 1 END) as inspection_photos
        FROM photos 
        WHERE is_deleted = false AND inspection_id IS NOT NULL
      `);
      
      return result.rows;
      
    } finally {
      await client.end();
    }
  }

  /**
   * Update photo validation status in consolidated table
   */
  async updatePhotoValidationStatus(
    photoId: string,
    recordType: 'WARRANTY' | 'INSPECTION',
    status: 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<void> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Note: validation_status and validation_notes fields may need to be added to photos table
      // For now, we'll update the description field with validation info
      await client.query(`
        UPDATE photos
        SET description = COALESCE(description, '') || ' [VALIDATION: ' || $1 || COALESCE(' - ' || $2, '') || ']',
            modified = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, notes || null, photoId]);
      
      console.log(`✅ Photo validation updated: ${photoId} -> ${status}`);
      
    } finally {
      await client.end();
    }
  }
}