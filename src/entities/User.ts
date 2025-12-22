import { EntitySchema } from 'typeorm';
import { BaseEntity } from './base-entity.js';

export interface User {
  id: string;
  email: string;
  password?: string;
  fullName?: string;
  dob?: Date;
  isVerified: boolean;
  role: 'USER' | 'STORE_ADMIN' | 'SUPER_ADMIN' | 'INFLUENCER';
  isBlocked: boolean;
  blockedAt?: Date | null;
  blockedReason?: string | null;
  imageUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  gender?: string;
  bio?: string;
  isDeleted: boolean;
  googleAccessToken?: string | null;
  deviceId?: string | null;
  isAllowedNotification: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  languagePreference: string;
  influencerStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  influencerTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  influencerVerifiedAt?: Date | null;
  created: Date;
  modified: Date;
  deletedAt?: Date | null;
}

export const User = new EntitySchema<User>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    email: {
      type: 'text',
      unique: true,
      nullable: false,
    },
    password: {
      type: 'text',
      nullable: true,
    },
    fullName: {
      type: 'text',
      nullable: true,
    },
    gender: {
      type: 'text',
      nullable: true,
    },
    bio: {
      type: 'text',
      nullable: true,
    },
    dob: {
      type: 'timestamp',
      nullable: true,
    },
    isVerified: {
      type: 'boolean',
      default: false,
    },
    role: {
      type: 'enum',
      enum: ['USER', 'STORE_ADMIN', 'SUPER_ADMIN', 'INFLUENCER'],
      default: 'USER',
    },
    influencerStatus: {
      type: 'enum',
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    influencerTier: {
      type: 'enum',
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE',
    },
    influencerVerifiedAt: {
      type: 'timestamp',
      nullable: true,
    },
    isBlocked: {
      type: 'boolean',
      default: false,
    },
    blockedAt: {
      type: 'timestamp',
      nullable: true,
    },
    blockedReason: {
      type: 'text',
      nullable: true,
    },
    imageUrl: {
      type: 'text',
      nullable: true,
    },
    coverImageUrl: {
      type: 'text',
      nullable: true,
    },
    phone: {
      type: 'text',
      unique: true,
      nullable: true,
    },
    isDeleted: {
      type: 'boolean',
      default: false,
    },
    googleAccessToken: {
      type: 'text',
      nullable: true,
    },
    deviceId: {
      type: 'text',
      unique: true,
      nullable: true,
    },
    isAllowedNotification: {
      type: 'boolean',
      default: true,
    },
    isEmailVerified: {
      type: 'boolean',
      default: false,
    },
    isPhoneVerified: {
      type: 'boolean',
      default: false,
    },
    languagePreference: {
      type: 'text',
      default: 'en',
    },
    ...BaseEntity,
  },
});