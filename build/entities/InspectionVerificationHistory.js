import { EntitySchema } from "typeorm";
const InspectionVerificationHistory = new EntitySchema({
  name: "InspectionVerificationHistory",
  tableName: "inspection_verification_history",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    inspectionId: {
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
    inspectorId: {
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
    inspection: {
      type: "many-to-one",
      target: "AnnualInspection",
      joinColumn: { name: "inspectionId" }
    },
    performer: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "performedBy" }
    },
    inspector: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "inspectorId" },
      nullable: true
    }
  }
});
export {
  InspectionVerificationHistory
};
