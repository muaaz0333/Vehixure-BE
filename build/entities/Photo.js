import { EntitySchema } from "typeorm";
import { BaseEntity } from "./base-entity.js";
export const Photo = new EntitySchema({
  name: "Photo",
  tableName: "photos",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    // Reference fields
    warrantyId: {
      type: "uuid",
      nullable: true,
      name: "warranty_id"
    },
    inspectionId: {
      type: "uuid",
      nullable: true,
      name: "inspection_id"
    },
    // Photo details
    photoCategory: {
      type: "varchar",
      length: 100,
      nullable: false,
      name: "photo_category"
    },
    photoUrl: {
      type: "text",
      nullable: false,
      name: "photo_url"
    },
    fileName: {
      type: "varchar",
      length: 255,
      nullable: true,
      name: "file_name"
    },
    fileSize: {
      type: "integer",
      nullable: true,
      name: "file_size"
    },
    mimeType: {
      type: "varchar",
      length: 100,
      nullable: true,
      name: "mime_type"
    },
    description: {
      type: "text",
      nullable: true
    },
    // Upload tracking
    uploadedBy: {
      type: "uuid",
      nullable: true,
      name: "uploaded_by"
    },
    uploadedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      name: "uploaded_at"
    },
    // Audit fields
    isDeleted: {
      type: "boolean",
      default: false,
      name: "is_deleted"
    },
    ...BaseEntity,
    deletedAt: {
      type: "timestamp",
      nullable: true,
      name: "deleted_at"
    }
  },
  indices: [
    {
      name: "IDX_PHOTOS_WARRANTY",
      columns: ["warrantyId"],
      where: '"isDeleted" = FALSE'
    },
    {
      name: "IDX_PHOTOS_INSPECTION",
      columns: ["inspectionId"],
      where: '"isDeleted" = FALSE'
    },
    {
      name: "IDX_PHOTOS_CATEGORY",
      columns: ["photoCategory"],
      where: '"isDeleted" = FALSE'
    }
  ],
  checks: [
    {
      name: "CHK_SINGLE_PHOTO_REFERENCE",
      expression: '("warrantyId" IS NOT NULL AND "inspectionId" IS NULL) OR ("warrantyId" IS NULL AND "inspectionId" IS NOT NULL)'
    }
  ]
});
