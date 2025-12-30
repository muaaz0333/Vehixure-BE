import { EntitySchema } from "typeorm";
import { BaseEntity } from "./base-entity.js";
export const WarrantyTerms = new EntitySchema({
  name: "WarrantyTerms",
  tableName: "warranty_terms",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    warrantyName: {
      type: "text",
      nullable: false
    },
    description: {
      type: "text",
      nullable: true
    },
    revision: {
      type: "text",
      nullable: false
    },
    generatorLightColour: {
      type: "text",
      nullable: true
    },
    termsAndConditions: {
      type: "text",
      nullable: true
    },
    addType: {
      type: "enum",
      enum: ["ADD_WARRANTY", "REPLACE_WARRANTY"],
      nullable: false
    },
    warrantyToReplaceId: {
      type: "uuid",
      nullable: true
    },
    inspectionInstructions: {
      type: "text",
      nullable: true
    },
    isActive: {
      type: "boolean",
      default: true
    },
    isDeleted: {
      type: "boolean",
      default: false
    },
    ...BaseEntity
  },
  relations: {
    warrantyToReplace: {
      type: "many-to-one",
      target: "WarrantyTerms",
      joinColumn: { name: "warrantyToReplaceId" },
      nullable: true
    }
  }
});
