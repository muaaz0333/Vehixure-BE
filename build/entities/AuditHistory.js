import { EntitySchema } from "typeorm";
export const AuditHistory = new EntitySchema({
  name: "AuditHistory",
  tableName: "audit_history",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    // Reference fields
    warrantyId: {
      type: "uuid",
      nullable: true
    },
    inspectionId: {
      type: "uuid",
      nullable: true
    },
    // Audit details
    actionType: {
      type: "varchar",
      length: 50,
      nullable: false
    },
    recordType: {
      type: "varchar",
      length: 20,
      nullable: false
    },
    versionNumber: {
      type: "integer",
      default: 1
    },
    // Status tracking
    statusBefore: {
      type: "varchar",
      length: 50,
      nullable: true
    },
    statusAfter: {
      type: "varchar",
      length: 50,
      nullable: true
    },
    // User tracking
    performedBy: {
      type: "uuid",
      nullable: false
    },
    performedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP"
    },
    // Details
    reason: {
      type: "text",
      nullable: true
    },
    notes: {
      type: "text",
      nullable: true
    },
    submissionData: {
      type: "jsonb",
      nullable: true
    },
    // SMS tracking
    smsSentTo: {
      type: "varchar",
      length: 50,
      nullable: true
    },
    smsSentAt: {
      type: "timestamp",
      nullable: true
    },
    smsDeliveryStatus: {
      type: "varchar",
      length: 20,
      nullable: true
    },
    verificationToken: {
      type: "varchar",
      length: 255,
      nullable: true
    },
    tokenExpiresAt: {
      type: "timestamp",
      nullable: true
    },
    // Audit metadata
    ipAddress: {
      type: "inet",
      nullable: true
    },
    userAgent: {
      type: "text",
      nullable: true
    },
    isCurrentVersion: {
      type: "boolean",
      default: false
    },
    created: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP"
    }
  },
  indices: [
    {
      name: "IDX_AUDIT_HISTORY_WARRANTY",
      columns: ["warrantyId"]
    },
    {
      name: "IDX_AUDIT_HISTORY_INSPECTION",
      columns: ["inspectionId"]
    },
    {
      name: "IDX_AUDIT_HISTORY_ACTION",
      columns: ["actionType"]
    },
    {
      name: "IDX_AUDIT_HISTORY_CURRENT",
      columns: ["isCurrentVersion"]
    }
  ],
  checks: [
    {
      name: "CHK_SINGLE_AUDIT_REFERENCE",
      expression: '("warrantyId" IS NOT NULL AND "inspectionId" IS NULL) OR ("warrantyId" IS NULL AND "inspectionId" IS NOT NULL)'
    }
  ]
});
