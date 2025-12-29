import { Client } from 'pg';
import { dbConfig } from '../config/database.js';

export interface SystemConfigEntry {
  configCategory: string;
  configKey: string;
  configName: string;
  description?: string;
  stringValue?: string;
  integerValue?: number;
  booleanValue?: boolean;
  dateValue?: Date;
  jsonValue?: any;
  isActive: boolean;
  isMandatory: boolean;
  priorityOrder: number;
}

export interface SystemConfigFilter {
  category?: string;
  isActive?: boolean;
  skip?: number;
  limit?: number;
}

export class SystemConfigService {
  
  /**
   * Initialize ERPS system configuration with client-specified defaults
   * Based on ERPS Annual Inspection.md, ERPS Warranty Registration.md, and ERPS_User_Roles.md
   */
  async initializeERPSDefaults(): Promise<void> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Check if system_config table has any data
      const existingCount = await client.query('SELECT COUNT(*) as count FROM system_config');
      const hasData = parseInt(existingCount.rows[0].count) > 0;
      
      if (hasData) {
        console.log('✅ ERPS system configuration already initialized');
        return;
      }
      
      console.log('🔧 Initializing ERPS system configuration based on client specifications...');
      
      // Define ERPS-specific configuration entries based on client documents
      const erpsConfigs: SystemConfigEntry[] = [
        // REMINDER category - Based on "Reminder email sent at 11 months"
        {
          configCategory: 'REMINDER',
          configKey: 'ELEVEN_MONTH_REMINDER',
          configName: 'Eleven Month Reminder',
          description: 'Send reminder email 11 months after warranty activation (ERPS Annual Inspection requirement)',
          integerValue: 11,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'REMINDER',
          configKey: 'THIRTY_DAY_REMINDER',
          configName: 'Thirty Day Before Due Reminder',
          description: 'Send reminder 30 days before inspection due date',
          integerValue: 30,
          isActive: true,
          isMandatory: true,
          priorityOrder: 2
        },
        {
          configCategory: 'REMINDER',
          configKey: 'DUE_DATE_REMINDER',
          configName: 'Due Date Reminder',
          description: 'Send reminder on inspection due date',
          integerValue: 0,
          isActive: true,
          isMandatory: true,
          priorityOrder: 3
        },
        
        // GRACE_PERIOD category - Based on "Grace Period = Due Date + 30 days"
        {
          configCategory: 'GRACE_PERIOD',
          configKey: 'INSPECTION_GRACE_DAYS',
          configName: 'Inspection Grace Period Days',
          description: 'Number of days after due date before warranty lapses (ERPS specification: 30 days)',
          integerValue: 30,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'GRACE_PERIOD',
          configKey: 'REINSTATEMENT_ALLOWED',
          configName: 'Allow Warranty Reinstatement',
          description: 'Whether warranties can be reinstated after grace period expires (Admin-only action)',
          booleanValue: true,
          isActive: true,
          isMandatory: false,
          priorityOrder: 2
        },
        {
          configCategory: 'GRACE_PERIOD',
          configKey: 'REMINDER_REMOVAL_AFTER_GRACE',
          configName: 'Remove from Reminders After Grace Period',
          description: 'Customer removed from reminders after grace period expires',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 3
        },
        
        // PHOTO_VALIDATION category - Based on "Minimum 3 photos required"
        {
          configCategory: 'PHOTO_VALIDATION',
          configKey: 'MIN_PHOTOS_WARRANTY',
          configName: 'Minimum Photos Required - Warranty',
          description: 'Minimum 3 photos required for warranty registration (ERPS specification)',
          integerValue: 3,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'PHOTO_VALIDATION',
          configKey: 'MIN_PHOTOS_INSPECTION',
          configName: 'Minimum Photos Required - Inspection',
          description: 'Minimum 3 photos required for annual inspection (ERPS specification)',
          integerValue: 3,
          isActive: true,
          isMandatory: true,
          priorityOrder: 2
        },
        {
          configCategory: 'PHOTO_VALIDATION',
          configKey: 'GENERATOR_PHOTOS_REQUIRED',
          configName: 'Generator Photos Required',
          description: 'Generator installation photos mandatory (Photo Group A)',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 3
        },
        {
          configCategory: 'PHOTO_VALIDATION',
          configKey: 'COUPLER_PHOTOS_REQUIRED',
          configName: 'Coupler/Pad Photos Required',
          description: 'Coupler/pad condition photos mandatory (Photo Group B)',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 4
        },
        {
          configCategory: 'PHOTO_VALIDATION',
          configKey: 'CORROSION_OR_CLEAR_PHOTOS_REQUIRED',
          configName: 'Corrosion or Clear Body Photos Required',
          description: 'Corrosion evidence OR clear body photos mandatory (Photo Group C)',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 5
        },
        {
          configCategory: 'PHOTO_VALIDATION',
          configKey: 'MAX_PHOTO_SIZE_MB',
          configName: 'Maximum Photo Size (MB)',
          description: 'Maximum file size allowed for photo uploads',
          integerValue: 10,
          isActive: true,
          isMandatory: true,
          priorityOrder: 6
        },
        
        // CORROSION_RULES category - Based on corrosion declaration requirements
        {
          configCategory: 'CORROSION_RULES',
          configKey: 'CORROSION_DECLARATION_REQUIRED',
          configName: 'Corrosion Declaration Required',
          description: 'Existing corrosion found? Yes/No declaration required for all submissions',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'CORROSION_RULES',
          configKey: 'CORROSION_NOTES_WHEN_FOUND',
          configName: 'Structured Notes Required When Corrosion Found',
          description: 'Structured notes mandatory when corrosion is declared as found',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 2
        },
        {
          configCategory: 'CORROSION_RULES',
          configKey: 'CORROSION_PHOTOS_WHEN_FOUND',
          configName: 'Photos Required When Corrosion Found',
          description: 'Corrosion photos mandatory when corrosion is declared as found',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 3
        },
        
        // VERIFICATION_RULES category - Based on SMS verification requirements
        {
          configCategory: 'VERIFICATION_RULES',
          configKey: 'SMS_VERIFICATION_REQUIRED',
          configName: 'SMS Verification Required',
          description: 'ERPS Authorised Installer must verify via SMS (two-factor authentication)',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'VERIFICATION_RULES',
          configKey: 'INSTALLER_ONLY_VERIFICATION',
          configName: 'Only Installer Can Verify',
          description: 'Only the installer who performed the work can verify (not Account Admin/Staff)',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 2
        },
        {
          configCategory: 'VERIFICATION_RULES',
          configKey: 'VERIFICATION_LOCKS_RECORD',
          configName: 'Verification Locks Record',
          description: 'Record locks after submission until verification is complete',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 3
        },
        
        // WARRANTY_CONTINUITY category - Based on 12-month cycles
        {
          configCategory: 'WARRANTY_CONTINUITY',
          configKey: 'INSPECTION_CYCLE_MONTHS',
          configName: 'Inspection Cycle (Months)',
          description: 'Each verification extends warranty by 12 months (ERPS specification)',
          integerValue: 12,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'WARRANTY_CONTINUITY',
          configKey: 'WARRANTY_INVALID_UNTIL_VERIFIED',
          configName: 'Warranty Invalid Until Verified',
          description: 'Warranty only valid when inspection is Verified (not just submitted)',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 2
        },
        
        // SUBMISSION_RULES category - Based on submission requirements
        {
          configCategory: 'SUBMISSION_RULES',
          configKey: 'INSTALLER_SELECTION_REQUIRED',
          configName: 'Installer Selection Required',
          description: 'Installation/Inspection Performed By field required before submission',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'SUBMISSION_RULES',
          configKey: 'VIN_REQUIRED_WARRANTY',
          configName: 'VIN Required for Warranty',
          description: 'Vehicle VIN must be present for warranty submission',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 2
        },
        {
          configCategory: 'SUBMISSION_RULES',
          configKey: 'GENERATOR_SERIAL_REQUIRED',
          configName: 'Generator Serial Required',
          description: 'Generator serial number required for submission',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 3
        },
        {
          configCategory: 'SUBMISSION_RULES',
          configKey: 'INSTALLATION_DATE_REQUIRED',
          configName: 'Installation Date Required',
          description: 'Installation date must be set for submission',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 4
        },
        
        // CRON_JOBS category - Automated processing intervals
        {
          configCategory: 'CRON_JOBS',
          configKey: 'REMINDER_PROCESSING_INTERVAL_MINUTES',
          configName: 'Reminder Processing Interval (Minutes)',
          description: 'How often to process pending reminders (default: 60 minutes)',
          integerValue: 60,
          isActive: true,
          isMandatory: true,
          priorityOrder: 1
        },
        {
          configCategory: 'CRON_JOBS',
          configKey: 'GRACE_PERIOD_PROCESSING_INTERVAL_MINUTES',
          configName: 'Grace Period Processing Interval (Minutes)',
          description: 'How often to process grace period expiry (default: 1440 minutes = daily)',
          integerValue: 1440,
          isActive: true,
          isMandatory: true,
          priorityOrder: 2
        },
        {
          configCategory: 'CRON_JOBS',
          configKey: 'WARRANTY_STATUS_UPDATE_INTERVAL_MINUTES',
          configName: 'Warranty Status Update Interval (Minutes)',
          description: 'How often to update warranty statuses (default: 360 minutes = 6 hours)',
          integerValue: 360,
          isActive: true,
          isMandatory: true,
          priorityOrder: 3
        },
        {
          configCategory: 'CRON_JOBS',
          configKey: 'AUTO_START_CRON_JOBS',
          configName: 'Auto Start Cron Jobs on Server Start',
          description: 'Whether to automatically start cron jobs when server starts',
          booleanValue: true,
          isActive: true,
          isMandatory: true,
          priorityOrder: 4
        }
      ];
      
      // Insert each configuration entry
      for (const config of erpsConfigs) {
        await client.query(`
          INSERT INTO system_config (
            config_category, config_key, config_name, description,
            string_value, integer_value, boolean_value, date_value, json_value,
            is_active, is_mandatory, priority_order,
            created, modified
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `, [
          config.configCategory,
          config.configKey,
          config.configName,
          config.description || null,
          config.stringValue || null,
          config.integerValue || null,
          config.booleanValue || null,
          config.dateValue || null,
          config.jsonValue ? JSON.stringify(config.jsonValue) : null,
          config.isActive,
          config.isMandatory,
          config.priorityOrder
        ]);
      }
      
      console.log(`✅ Initialized ${erpsConfigs.length} ERPS system configuration entries`);
      
      // Log summary
      const summary = await client.query(`
        SELECT 
          config_category,
          COUNT(*) as count,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
        FROM system_config 
        GROUP BY config_category
        ORDER BY config_category;
      `);
      
      console.log('📊 ERPS System Configuration Summary:');
      summary.rows.forEach(row => {
        console.log(`- ${row.config_category}: ${row.active_count}/${row.count} active`);
      });
      
    } catch (error) {
      console.error('❌ Error initializing ERPS system configuration:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  /**
   * Get all system configurations with filtering and pagination
   */
  async getAllConfigs(filter: SystemConfigFilter = {}): Promise<{ data: any[]; total: number }> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filter.category) {
        whereClause += ` AND config_category = $${paramIndex}`;
        params.push(filter.category);
        paramIndex++;
      }
      
      if (filter.isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex}`;
        params.push(filter.isActive);
        paramIndex++;
      }
      
      // Get total count
      const countResult = await client.query(`
        SELECT COUNT(*) as total FROM system_config ${whereClause}
      `, params);
      
      const total = parseInt(countResult.rows[0].total);
      
      // Get paginated data
      let limitClause = '';
      if (filter.limit) {
        limitClause += ` LIMIT $${paramIndex}`;
        params.push(filter.limit);
        paramIndex++;
      }
      
      if (filter.skip) {
        limitClause += ` OFFSET $${paramIndex}`;
        params.push(filter.skip);
        paramIndex++;
      }
      
      const dataResult = await client.query(`
        SELECT 
          id, config_category, config_key, config_name, description,
          string_value, integer_value, boolean_value, date_value, json_value,
          is_active, is_mandatory, priority_order, created, modified
        FROM system_config 
        ${whereClause}
        ORDER BY config_category, priority_order, config_name
        ${limitClause}
      `, params);
      
      return {
        data: dataResult.rows,
        total
      };
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Get configuration by ID
   */
  async getConfigById(configId: string): Promise<any | null> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          id, config_category, config_key, config_name, description,
          string_value, integer_value, boolean_value, date_value, json_value,
          is_active, is_mandatory, priority_order, created, modified
        FROM system_config
        WHERE id = $1
      `, [configId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Create new system configuration
   */
  async createConfig(config: SystemConfigEntry): Promise<any> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        INSERT INTO system_config (
          config_category, config_key, config_name, description,
          string_value, integer_value, boolean_value, date_value, json_value,
          is_active, is_mandatory, priority_order,
          created, modified
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `, [
        config.configCategory,
        config.configKey,
        config.configName,
        config.description || null,
        config.stringValue || null,
        config.integerValue || null,
        config.booleanValue || null,
        config.dateValue || null,
        config.jsonValue ? JSON.stringify(config.jsonValue) : null,
        config.isActive,
        config.isMandatory,
        config.priorityOrder
      ]);
      
      return result.rows[0];
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Update system configuration
   */
  async updateConfig(configId: string, updateData: Partial<SystemConfigEntry>): Promise<any | null> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const setParts: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      if (updateData.configName !== undefined) {
        setParts.push(`config_name = $${paramIndex}`);
        params.push(updateData.configName);
        paramIndex++;
      }
      
      if (updateData.description !== undefined) {
        setParts.push(`description = $${paramIndex}`);
        params.push(updateData.description);
        paramIndex++;
      }
      
      if (updateData.stringValue !== undefined) {
        setParts.push(`string_value = $${paramIndex}`);
        params.push(updateData.stringValue);
        paramIndex++;
      }
      
      if (updateData.integerValue !== undefined) {
        setParts.push(`integer_value = $${paramIndex}`);
        params.push(updateData.integerValue);
        paramIndex++;
      }
      
      if (updateData.booleanValue !== undefined) {
        setParts.push(`boolean_value = $${paramIndex}`);
        params.push(updateData.booleanValue);
        paramIndex++;
      }
      
      if (updateData.dateValue !== undefined) {
        setParts.push(`date_value = $${paramIndex}`);
        params.push(updateData.dateValue);
        paramIndex++;
      }
      
      if (updateData.jsonValue !== undefined) {
        setParts.push(`json_value = $${paramIndex}`);
        params.push(updateData.jsonValue ? JSON.stringify(updateData.jsonValue) : null);
        paramIndex++;
      }
      
      if (updateData.isActive !== undefined) {
        setParts.push(`is_active = $${paramIndex}`);
        params.push(updateData.isActive);
        paramIndex++;
      }
      
      if (updateData.isMandatory !== undefined) {
        setParts.push(`is_mandatory = $${paramIndex}`);
        params.push(updateData.isMandatory);
        paramIndex++;
      }
      
      if (updateData.priorityOrder !== undefined) {
        setParts.push(`priority_order = $${paramIndex}`);
        params.push(updateData.priorityOrder);
        paramIndex++;
      }
      
      if (setParts.length === 0) {
        return null;
      }
      
      setParts.push(`modified = CURRENT_TIMESTAMP`);
      params.push(configId);
      
      const result = await client.query(`
        UPDATE system_config 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Delete system configuration
   */
  async deleteConfig(configId: string): Promise<boolean> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        DELETE FROM system_config WHERE id = $1
      `, [configId]);
      
      return result.rowCount > 0;
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Toggle configuration active status
   */
  async toggleStatus(configId: string, isActive: boolean): Promise<any | null> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        UPDATE system_config 
        SET is_active = $1, modified = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [isActive, configId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Get configuration summary by category
   */
  async getConfigSummary(): Promise<any[]> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          config_category,
          COUNT(*) as total_count,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
          COUNT(CASE WHEN is_mandatory = true THEN 1 END) as mandatory_count
        FROM system_config 
        GROUP BY config_category
        ORDER BY config_category
      `);
      
      return result.rows;
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Get configuration value by category and key
   */
  async getConfigValue(category: string, key: string): Promise<any> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          string_value, integer_value, boolean_value, date_value, json_value
        FROM system_config
        WHERE config_category = $1 AND config_key = $2 AND is_active = true
      `, [category, key]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      // Return the first non-null value
      return row.string_value || 
             row.integer_value || 
             row.boolean_value || 
             row.date_value || 
             row.json_value;
             
    } finally {
      await client.end();
    }
  }
  
  /**
   * Get all configuration values for a category
   */
  async getCategoryConfig(category: string): Promise<any[]> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          id,
          config_key,
          config_name,
          description,
          string_value, 
          integer_value, 
          boolean_value, 
          date_value, 
          json_value,
          is_active,
          is_mandatory,
          priority_order,
          created,
          modified
        FROM system_config
        WHERE config_category = $1
        ORDER BY priority_order, config_name
      `, [category]);
      
      return result.rows.map(row => ({
        id: row.id,
        key: row.config_key,
        name: row.config_name,
        description: row.description,
        value: row.string_value || 
               row.integer_value || 
               row.boolean_value || 
               row.date_value || 
               row.json_value,
        stringValue: row.string_value,
        integerValue: row.integer_value,
        booleanValue: row.boolean_value,
        dateValue: row.date_value,
        jsonValue: row.json_value,
        isActive: row.is_active,
        isMandatory: row.is_mandatory,
        priorityOrder: row.priority_order,
        created: row.created,
        modified: row.modified
      }));
      
    } finally {
      await client.end();
    }
  }
  
  /**
   * Check if system configuration is initialized
   */
  async isInitialized(): Promise<boolean> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query('SELECT COUNT(*) as count FROM system_config WHERE is_active = true');
      return parseInt(result.rows[0].count) > 0;
      
    } finally {
      await client.end();
    }
  }
}