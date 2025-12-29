import { EntitySchema } from 'typeorm';
import { BaseEntity } from './base-entity.js';

export interface AnnualInspection {
  id: string;
  warrantyId: string;
  partnerAccountId?: string; // New: Partner account reference
  inspectorId: string;
  inspectionDate: Date;
  
  // Inspection checklist
  generatorMountedCorrectly: boolean;
  redLightIlluminated: boolean;
  couplersSecureSealed: boolean;
  
  // Corrosion inspection areas
  roofTurretCondition: 'PASS' | 'ISSUE';
  roofTurretNotes?: string;
  pillarsCondition: 'PASS' | 'ISSUE';
  pillarsNotes?: string;
  sillsCondition: 'PASS' | 'ISSUE';
  sillsNotes?: string;
  guardsLfCondition: 'PASS' | 'ISSUE';
  guardsLfNotes?: string;
  guardsRfCondition: 'PASS' | 'ISSUE';
  guardsRfNotes?: string;
  guardsLrCondition: 'PASS' | 'ISSUE';
  guardsLrNotes?: string;
  guardsRrCondition: 'PASS' | 'ISSUE';
  guardsRrNotes?: string;
  innerGuardsCondition: 'PASS' | 'ISSUE';
  innerGuardsNotes?: string;
  underBonnetCondition: 'PASS' | 'ISSUE';
  underBonnetNotes?: string;
  firewallCondition: 'PASS' | 'ISSUE';
  firewallNotes?: string;
  bootWaterIngressCondition: 'PASS' | 'ISSUE';
  bootWaterIngressNotes?: string;
  underbodySeamsCondition: 'PASS' | 'ISSUE';
  underbodySeamsNotes?: string;
  
  // Additional checks
  ownerAdvisedPaintDamage: boolean;
  ownerUnderstandsOperation: boolean;
  
  // Corrosion declaration
  corrosionFound: boolean;
  corrosionDetails?: string;
  
  // Verification workflow
  verificationStatus: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  
  // Enhanced rejection tracking (consolidated)
  rejectionDetail?: string;
  rejectedByUserId?: string;
  rejectionTimestamp?: Date;
  
  // Submission tracking
  submittedBy?: string;
  submittedAt?: Date;
  
  // Due date tracking
  dueDate?: Date;
  gracePeriodEnd?: Date;
  isOverdue: boolean;
  
  // Warranty extension
  warrantyExtendedUntil?: Date;
  
  isDeleted: boolean;
  created: Date;
  modified: Date;
  deletedAt?: Date | null;
}

export const AnnualInspection = new EntitySchema<AnnualInspection>({
  name: 'AnnualInspection',
  tableName: 'annual_inspections',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    warrantyId: {
      type: 'uuid',
      nullable: false,
    },
    partnerAccountId: {
      type: 'uuid',
      nullable: true,
    },
    inspectorId: {
      type: 'uuid',
      nullable: false,
    },
    inspectionDate: {
      type: 'date',
      nullable: false,
    },
    
    // Inspection checklist
    generatorMountedCorrectly: {
      type: 'boolean',
      default: false,
    },
    redLightIlluminated: {
      type: 'boolean',
      default: false,
    },
    couplersSecureSealed: {
      type: 'boolean',
      default: false,
    },
    
    // Corrosion inspection areas
    roofTurretCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    roofTurretNotes: {
      type: 'text',
      nullable: true,
    },
    pillarsCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    pillarsNotes: {
      type: 'text',
      nullable: true,
    },
    sillsCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    sillsNotes: {
      type: 'text',
      nullable: true,
    },
    guardsLfCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    guardsLfNotes: {
      type: 'text',
      nullable: true,
    },
    guardsRfCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    guardsRfNotes: {
      type: 'text',
      nullable: true,
    },
    guardsLrCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    guardsLrNotes: {
      type: 'text',
      nullable: true,
    },
    guardsRrCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    guardsRrNotes: {
      type: 'text',
      nullable: true,
    },
    innerGuardsCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    innerGuardsNotes: {
      type: 'text',
      nullable: true,
    },
    underBonnetCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    underBonnetNotes: {
      type: 'text',
      nullable: true,
    },
    firewallCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    firewallNotes: {
      type: 'text',
      nullable: true,
    },
    bootWaterIngressCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    bootWaterIngressNotes: {
      type: 'text',
      nullable: true,
    },
    underbodySeamsCondition: {
      type: 'enum',
      enum: ['PASS', 'ISSUE'],
      default: 'PASS',
    },
    underbodySeamsNotes: {
      type: 'text',
      nullable: true,
    },
    
    // Additional checks
    ownerAdvisedPaintDamage: {
      type: 'boolean',
      default: false,
    },
    ownerUnderstandsOperation: {
      type: 'boolean',
      default: false,
    },
    
    // Corrosion declaration
    corrosionFound: {
      type: 'boolean',
      default: false,
    },
    corrosionDetails: {
      type: 'text',
      nullable: true,
    },
    
    // Verification workflow
    verificationStatus: {
      type: 'enum',
      enum: ['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
      default: 'DRAFT',
    },
    verificationToken: {
      type: 'text',
      nullable: true,
    },
    verificationTokenExpires: {
      type: 'timestamp',
      nullable: true,
    },
    verifiedBy: {
      type: 'uuid',
      nullable: true,
    },
    verifiedAt: {
      type: 'timestamp',
      nullable: true,
    },
    rejectionReason: {
      type: 'text',
      nullable: true,
    },
    
    // Enhanced rejection tracking (consolidated)
    rejectionDetail: {
      type: 'varchar',
      length: 50,
      nullable: true,
      name: 'rejection_detail',
    },
    rejectedByUserId: {
      type: 'uuid',
      nullable: true,
      name: 'rejected_by_user_id',
    },
    rejectionTimestamp: {
      type: 'timestamp',
      nullable: true,
      name: 'rejection_timestamp',
    },
    
    // Submission tracking
    submittedBy: {
      type: 'uuid',
      nullable: true,
    },
    submittedAt: {
      type: 'timestamp',
      nullable: true,
    },
    
    // Due date tracking
    dueDate: {
      type: 'date',
      nullable: true,
    },
    gracePeriodEnd: {
      type: 'date',
      nullable: true,
    },
    isOverdue: {
      type: 'boolean',
      default: false,
    },
    
    // Warranty extension
    warrantyExtendedUntil: {
      type: 'date',
      nullable: true,
    },
    
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
});