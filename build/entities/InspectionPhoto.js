import { EntitySchema } from "typeorm";
import { BaseEntity } from "./base-entity.js";
const InspectionPhoto = new EntitySchema({
  name: "InspectionPhoto",
  tableName: "inspection_photos",
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
    photoGroup: {
      type: "enum",
      enum: ["GENERATOR_RED_LIGHT", "COUPLERS", "CORROSION", "CLEAR_BODY"],
      nullable: false
    },
    photoUrl: {
      type: "text",
      nullable: false
    },
    photoDescription: {
      type: "text",
      nullable: true
    },
    uploadedBy: {
      type: "uuid",
      nullable: false
    },
    isDeleted: {
      type: "boolean",
      default: false
    },
    ...BaseEntity
  },
  relations: {
    inspection: {
      type: "many-to-one",
      target: "AnnualInspection",
      joinColumn: { name: "inspectionId" }
    },
    uploader: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "uploadedBy" }
    }
  }
});
export {
  InspectionPhoto
};
