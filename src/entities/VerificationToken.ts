import { EntitySchema } from 'typeorm';

export interface VerificationToken {
  id: string;
  token: string;
  type: 'WARRANTY_INSTALLER' | 'INSPECTION_INSTALLER' | 'CUSTOMER_ACTIVATION';
  recordId: string; // warrantyId or inspectionId
  userId?: string; // installerId for installer verification, null for customer
  customerEmail?: string;
  customerPhone?: string;
  expiresAt: Date;
  usedAt?: Date;
  isUsed: boolean;
  remindersSent: number;
  lastReminderSentAt?: Date;
  created: Date;
}

export const VerificationToken = new EntitySchema<VerificationToken>({
  name: 'VerificationToken',
  tableName: 'verification_tokens',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    token: {
      type: 'varchar',
      length: 255,
      unique: true,
      nullable: false,
    },
    type: {
      type: 'enum',
      enum: ['WARRANTY_INSTALLER', 'INSPECTION_INSTALLER', 'CUSTOMER_ACTIVATION'],
      nullable: false,
    },
    recordId: {
      type: 'uuid',
      nullable: false,
    },
    userId: {
      type: 'uuid',
      nullable: true,
    },
    customerEmail: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    customerPhone: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    expiresAt: {
      type: 'timestamp',
      nullable: false,
    },
    usedAt: {
      type: 'timestamp',
      nullable: true,
    },
    isUsed: {
      type: 'boolean',
      default: false,
    },
    remindersSent: {
      type: 'int',
      default: 0,
    },
    lastReminderSentAt: {
      type: 'timestamp',
      nullable: true,
    },
    created: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  indices: [
    {
      name: 'IDX_VERIFICATION_TOKEN',
      columns: ['token'],
      unique: true,
    },
    {
      name: 'IDX_VERIFICATION_RECORD',
      columns: ['recordId'],
    },
    {
      name: 'IDX_VERIFICATION_TYPE',
      columns: ['type'],
    },
    {
      name: 'IDX_VERIFICATION_EXPIRES',
      columns: ['expiresAt'],
    },
    {
      name: 'IDX_VERIFICATION_UNUSED',
      columns: ['isUsed', 'expiresAt'],
    },
  ],
});
