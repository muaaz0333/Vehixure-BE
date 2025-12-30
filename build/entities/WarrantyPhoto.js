import { EntitySchema } from "typeorm";
import { BaseEntity } from "./base-entity.js";
const WarrantyPhoto = new EntitySchema({
  name: "WarrantyPhoto",
  tableName: "warranty_photos",
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
    photoGroup: {
      type: "enum",
      enum: ["GENERATOR", "COUPLER", "CORROSION", "CLEAR_BODY"],
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
    warranty: {
      type: "many-to-one",
      target: "Warranty",
      joinColumn: { name: "warrantyId" }
    },
    uploader: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "uploadedBy" }
    }
  }
});
export {
  WarrantyPhoto
};
