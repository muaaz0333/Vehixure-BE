import { EntitySchema } from "typeorm";
export const SystemConfig = new EntitySchema({
  name: "SystemConfig",
  tableName: "system_config",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    // Configuration identification
    configCategory: {
      type: "varchar",
      length: 50,
      nullable: false
    },
    configKey: {
      type: "varchar",
      length: 100,
      nullable: false
    },
    configName: {
      type: "varchar",
      length: 200,
      nullable: false
    },
    // Configuration values
    stringValue: {
      type: "varchar",
      length: 500,
      nullable: true
    },
    integerValue: {
      type: "integer",
      nullable: true
    },
    booleanValue: {
      type: "boolean",
      nullable: true
    },
    dateValue: {
      type: "date",
      nullable: true
    },
    jsonValue: {
      type: "jsonb",
      nullable: true
    },
    // Configuration metadata
    description: {
      type: "text",
      nullable: true
    },
    isActive: {
      type: "boolean",
      default: true
    },
    isMandatory: {
      type: "boolean",
      default: false
    },
    priorityOrder: {
      type: "integer",
      default: 0
    },
    // Audit fields
    created: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP"
    },
    modified: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP"
    }
  },
  indices: [
    {
      name: "IDX_SYSTEM_CONFIG_CATEGORY",
      columns: ["configCategory"],
      where: '"isActive" = TRUE'
    },
    {
      name: "IDX_SYSTEM_CONFIG_KEY",
      columns: ["configKey"],
      where: '"isActive" = TRUE'
    }
  ],
  uniques: [
    {
      name: "UQ_SYSTEM_CONFIG_CATEGORY_KEY",
      columns: ["configCategory", "configKey"]
    }
  ]
});
