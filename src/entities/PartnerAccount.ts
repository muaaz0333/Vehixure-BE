import { EntitySchema } from 'typeorm';
import { BaseEntity } from './base-entity.js';

export interface PartnerAccount {
  id: string;
  businessName: string;
  contactPerson: string;
  
  // Address Information
  streetAddress?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country: string;
  
  // Contact Information
  phone?: string;
  faxNumber?: string;
  email?: string;
  
  // Business Details
  productsSold?: string;
  buyPrice?: 'Aftermart' | 'Distributor' | 'E1' | 'E2' | 'Less 15%' | 'Rob' | 'EquipIT' | 'Installer' | 'Inspector';
  
  // Status
  accountStatus: 'Active' | 'InActive' | 'Suspended';
  
  // Audit Fields
  isDeleted: boolean;
  created: Date;
  modified: Date;
  deletedAt?: Date | null;
}

export const PartnerAccount = new EntitySchema<PartnerAccount>({
  name: 'PartnerAccount',
  tableName: 'partner_accounts',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    businessName: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    contactPerson: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    
    // Address Information
    streetAddress: {
      type: 'text',
      nullable: true,
    },
    city: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    state: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    postcode: {
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    country: {
      type: 'varchar',
      length: 100,
      default: 'Australia',
    },
    
    // Contact Information
    phone: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    faxNumber: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    email: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    
    // Business Details
    productsSold: {
      type: 'text',
      nullable: true,
    },
    buyPrice: {
      type: 'enum',
      enum: ['Aftermart', 'Distributor', 'E1', 'E2', 'Less 15%', 'Rob', 'EquipIT', 'Installer', 'Inspector'],
      nullable: true,
    },
    
    // Status
    accountStatus: {
      type: 'enum',
      enum: ['Active', 'InActive', 'Suspended'],
      default: 'Active',
    },
    
    // Audit Fields
    isDeleted: {
      type: 'boolean',
      default: false,
    },
    
    ...BaseEntity,
    
    deletedAt: {
      type: 'timestamp',
      nullable: true,
    },
  },
  indices: [
    {
      name: 'IDX_PARTNER_ACCOUNTS_STATUS',
      columns: ['accountStatus'],
      where: '"isDeleted" = FALSE',
    },
    {
      name: 'IDX_PARTNER_ACCOUNTS_BUSINESS_NAME',
      columns: ['businessName'],
      where: '"isDeleted" = FALSE',
    },
  ],
});