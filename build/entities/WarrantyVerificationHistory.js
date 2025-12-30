import { EntitySchema } from "typeorm";
const WarrantyVerificationHistory = new EntitySchema({
  name: "WarrantyVerificationHistory",
  tableName: "warranty_verification_history",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    warrantyId: {
      type: "uuid",
      nullable: false
    },
    action: {
      type: "enum",
      enum: ["SUBMITTED", "VERIFIED", "REJECTED", "RESUBMITTED"],
      nullable: false
    },
    performedBy: {
      type: "uuid",
      nullable: false
    },
    installerId: {
      type: "uuid",
      nullable: true
    },
    reason: {
      type: "text",
      nullable: true
    },
    created: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP"
    }
  },
  relations: {
    warranty: {
      type: "many-to-one",
      target: "Warranty",
      joinColumn: { name: "warrantyId" }
    },
    performer: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "performedBy" }
    },
    installer: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "installerId" },
      nullable: true
    }
  }
});
export {
  WarrantyVerificationHistory
};
