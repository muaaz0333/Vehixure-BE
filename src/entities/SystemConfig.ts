import { EntitySchema } from 'typeorm';

export interface SystemConfig {
  id: string;
  
  // Configuration identification
  configCategory: string; // 'REMINDER', 'PHOTO_VALIDATION', 'CORROSION_RULES', 'CHECKLIST_RULES', 'GRACE_PERIOD'
  configKey: string;
  configName: string;
  
  // Configuration values (flexible storage)
  stringValue?: string;
  integerValue?: number;
  booleanValue?: boolean;
  dateValue?: Date;
  jsonValue?: any; // JSONB
  
  // Configuration metadata
  description?: string;
  isActive: boolean;
  isMandatory: boolean;
  priorityOrder: number;
  
  // Audit fields
  created: Date;
  modified: Date;
}

export const SystemConfig = new EntitySchema<SystemConfig>({
  name: 'SystemConfig',
  tableName: 'system_config',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    
    // Configuration identification
    configCategory: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    configKey: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    configName: {
      type: 'varchar',
      length: 200,
      nullable: false,
    },
    
    // Configuration values
    stringValue: {
      type: 'varchar',
      length: 500,
      nullable: true,
    },
    integerValue: {
      type: 'integer',
      nullable: true,
    },
    booleanValue: {
      type: 'boolean',
      nullable: true,
    },
    dateValue: {
      type: 'date',
      nullable: true,
    },
    jsonValue: {
      type: 'jsonb',
      nullable: true,
    },
    
    // Configuration metadata
    description: {
      type: 'text',
      nullable: true,
    },
    isActive: {
      type: 'boolean',
      default: true,
    },
    isMandatory: {
      type: 'boolean',
      default: false,
    },
    priorityOrder: {
      type: 'integer',
      default: 0,
    },
    
    // Audit fields
    created: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    modified: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  indices: [
    {
      name: 'IDX_SYSTEM_CONFIG_CATEGORY',
      columns: ['configCategory'],
      where: '"isActive" = TRUE',
    },
    {
      name: 'IDX_SYSTEM_CONFIG_KEY',
      columns: ['configKey'],
      where: '"isActive" = TRUE',
    },
  ],
  uniques: [
    {
      name: 'UQ_SYSTEM_CONFIG_CATEGORY_KEY',
      columns: ['configCategory', 'configKey'],
    },
  ],
});