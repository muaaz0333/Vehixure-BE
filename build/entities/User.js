import { EntitySchema } from "typeorm";
import { BaseEntity } from "./base-entity.js";
export const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    email: {
      type: "text",
      unique: true,
      nullable: false
    },
    password: {
      type: "text",
      nullable: true
    },
    fullName: {
      type: "text",
      nullable: true
    },
    dob: {
      type: "timestamp",
      nullable: true
    },
    isVerified: {
      type: "boolean",
      default: false
    },
    role: {
      type: "enum",
      enum: ["ERPS_ADMIN", "PARTNER_USER"],
      default: "PARTNER_USER"
    },
    isBlocked: {
      type: "boolean",
      default: false
    },
    blockedAt: {
      type: "timestamp",
      nullable: true
    },
    blockedReason: {
      type: "text",
      nullable: true
    },
    phone: {
      type: "text",
      nullable: true
    },
    isDeleted: {
      type: "boolean",
      default: false
    },
    isAllowedNotification: {
      type: "boolean",
      default: true
    },
    isEmailVerified: {
      type: "boolean",
      default: false
    },
    isPhoneVerified: {
      type: "boolean",
      default: false
    },
    languagePreference: {
      type: "text",
      default: "en"
    },
    // Partner System Fields
    partnerAccountId: {
      type: "uuid",
      nullable: true
    },
    partnerRole: {
      type: "enum",
      enum: ["ACCOUNT_ADMIN", "ACCOUNT_STAFF", "ACCOUNT_INSTALLER"],
      nullable: true
    },
    // Enhanced installer/inspector fields (Required for ACCOUNT_INSTALLER role)
    mobileNumber: {
      type: "text",
      nullable: true
    },
    isAccreditedInstaller: {
      type: "boolean",
      default: true
    },
    isAuthorisedInspector: {
      type: "boolean",
      default: false
    },
    installerCertificationDate: {
      type: "date",
      nullable: true
    },
    inspectorCertificationDate: {
      type: "date",
      nullable: true
    },
    installerCertificationNumber: {
      type: "varchar",
      length: 100,
      nullable: true
    },
    inspectorCertificationNumber: {
      type: "varchar",
      length: 100,
      nullable: true
    },
    // Verification tracking
    lastVerificationSent: {
      type: "timestamp",
      nullable: true
    },
    verificationAttempts: {
      type: "int",
      default: 0
    },
    // Account status
    accountStatus: {
      type: "enum",
      enum: ["Active", "InActive"],
      default: "Active"
    },
    ...BaseEntity
  }
});
