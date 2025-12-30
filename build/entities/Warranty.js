import { EntitySchema } from "typeorm";
import { BaseEntity } from "./base-entity.js";
export const Warranty = new EntitySchema({
  name: "Warranty",
  tableName: "warranties",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    refStockId: {
      type: "text",
      nullable: true
    },
    agentId: {
      type: "uuid",
      nullable: false
    },
    warrantyTermsId: {
      type: "uuid",
      nullable: false
    },
    partnerAccountId: {
      type: "uuid",
      nullable: true
    },
    // Vehicle Owner Details
    companyName: {
      type: "text",
      nullable: true
    },
    firstName: {
      type: "text",
      nullable: false
    },
    lastName: {
      type: "text",
      nullable: false
    },
    phoneNumber: {
      type: "text",
      nullable: false
    },
    email: {
      type: "text",
      nullable: false
    },
    // Vehicle Details
    make: {
      type: "text",
      nullable: false
    },
    model: {
      type: "text",
      nullable: false
    },
    registrationNumber: {
      type: "text",
      nullable: true
    },
    buildDate: {
      type: "date",
      nullable: false
    },
    vinNumber: {
      type: "text",
      nullable: false
    },
    // Installation Details
    installersName: {
      type: "text",
      nullable: false
    },
    installerId: {
      type: "uuid",
      nullable: true
    },
    dateInstalled: {
      type: "date",
      nullable: false
    },
    generatorSerialNumber: {
      type: "text",
      nullable: false
    },
    numberOfCouplersInstalled: {
      type: "int",
      nullable: true
    },
    voltageInCouplerSupplyLine: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true
    },
    positionOfCouplers: {
      type: "text",
      nullable: true
    },
    // Corrosion Details
    corrosionFound: {
      type: "boolean",
      default: false
    },
    corrosionDetails: {
      type: "text",
      nullable: true
    },
    // Confirmation
    installationConfirmed: {
      type: "boolean",
      default: false
    },
    // Verification workflow
    verificationStatus: {
      type: "enum",
      enum: ["DRAFT", "SUBMITTED", "PENDING_CUSTOMER_ACTIVATION", "VERIFIED", "REJECTED", "ACTIVE"],
      default: "DRAFT"
    },
    verificationToken: {
      type: "text",
      nullable: true
    },
    verificationTokenExpires: {
      type: "timestamp",
      nullable: true
    },
    verifiedBy: {
      type: "uuid",
      nullable: true
    },
    verifiedAt: {
      type: "timestamp",
      nullable: true
    },
    rejectionReason: {
      type: "text",
      nullable: true
    },
    submissionNotes: {
      type: "text",
      nullable: true
    },
    // Customer activation (after installer verification)
    customerActivationToken: {
      type: "text",
      nullable: true,
      name: "customer_activation_token"
    },
    customerActivationTokenExpires: {
      type: "timestamp",
      nullable: true,
      name: "customer_activation_token_expires"
    },
    customerTermsAcceptedAt: {
      type: "timestamp",
      nullable: true,
      name: "customer_terms_accepted_at"
    },
    customerTermsAcceptedIp: {
      type: "text",
      nullable: true,
      name: "customer_terms_accepted_ip"
    },
    activatedAt: {
      type: "timestamp",
      nullable: true,
      name: "activated_at"
    },
    activatedBy: {
      type: "uuid",
      nullable: true,
      name: "activated_by"
    },
    inspectionDueDate: {
      type: "date",
      nullable: true,
      name: "inspection_due_date"
    },
    isActive: {
      type: "boolean",
      default: false,
      name: "is_active"
    },
    // Enhanced rejection tracking (consolidated)
    rejectionDetail: {
      type: "varchar",
      length: 50,
      nullable: true,
      name: "rejection_detail"
    },
    rejectedByUserId: {
      type: "uuid",
      nullable: true,
      name: "rejected_by_user_id"
    },
    rejectionTimestamp: {
      type: "timestamp",
      nullable: true,
      name: "rejection_timestamp"
    },
    // Submission tracking
    submittedBy: {
      type: "uuid",
      nullable: true
    },
    submittedAt: {
      type: "timestamp",
      nullable: true
    },
    // Warranty continuity
    nextInspectionDue: {
      type: "date",
      nullable: true
    },
    gracePeriodEnd: {
      type: "date",
      nullable: true
    },
    reminderSentAt: {
      type: "timestamp",
      nullable: true
    },
    isInGracePeriod: {
      type: "boolean",
      default: false
    },
    // Consolidated grace period tracking
    gracePeriodEndDate: {
      type: "date",
      nullable: true,
      name: "grace_period_end_date"
      // Explicit column name mapping
    },
    isGraceExpired: {
      type: "boolean",
      default: false,
      name: "is_grace_expired"
    },
    extensionBlockedAt: {
      type: "timestamp",
      nullable: true,
      name: "extension_blocked_at"
    },
    // Consolidated reminder tracking
    elevenMonthReminderSent: {
      type: "timestamp",
      nullable: true,
      name: "eleven_month_reminder_sent"
    },
    thirtyDayReminderSent: {
      type: "timestamp",
      nullable: true,
      name: "thirty_day_reminder_sent"
    },
    reminderAttempts: {
      type: "int",
      default: 0,
      name: "reminder_attempts"
    },
    // Status
    status: {
      type: "enum",
      enum: ["DRAFT", "SUBMITTED", "PENDING_CUSTOMER_ACTIVATION", "VERIFIED", "REJECTED", "ACTIVE", "EXPIRED", "CANCELLED"],
      default: "DRAFT"
    },
    isDeleted: {
      type: "boolean",
      default: false
    },
    ...BaseEntity
  }
});
