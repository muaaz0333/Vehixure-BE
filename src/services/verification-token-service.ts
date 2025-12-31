import crypto from 'crypto';
import { AppDataSource } from '../plugins/typeorm.js';
import { VerificationToken } from '../entities/VerificationToken.js';
import { LessThan, MoreThan } from 'typeorm';

// Token expiry durations
const INSTALLER_TOKEN_EXPIRY_DAYS = 60; // 60 days for installer verification
const CUSTOMER_TOKEN_EXPIRY_DAYS = 30; // 30 days for customer activation

export interface CreateTokenParams {
  type: 'WARRANTY_INSTALLER' | 'INSPECTION_INSTALLER' | 'CUSTOMER_ACTIVATION';
  recordId: string;
  userId?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  token?: VerificationToken;
  error?: string;
}

export class VerificationTokenService {
  
  /**
   * Generate and store a new verification token
   */
  static async createToken(params: CreateTokenParams): Promise<VerificationToken> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiry based on token type
    const expiryDays = params.type === 'CUSTOMER_ACTIVATION' 
      ? CUSTOMER_TOKEN_EXPIRY_DAYS 
      : INSTALLER_TOKEN_EXPIRY_DAYS;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    // Invalidate any existing unused tokens for the same record and type
    await tokenRepo.update(
      { 
        recordId: params.recordId, 
        type: params.type, 
        isUsed: false 
      },
      { isUsed: true }
    );
    
    // Create new token
    const verificationToken = tokenRepo.create({
      token,
      type: params.type,
      recordId: params.recordId,
      userId: params.userId,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      expiresAt,
      isUsed: false,
      remindersSent: 0
    });
    
    return await tokenRepo.save(verificationToken);
  }

  /**
   * Validate a verification token
   */
  static async validateToken(token: string): Promise<TokenValidationResult> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    
    const verificationToken = await tokenRepo.findOne({
      where: { token }
    });
    
    if (!verificationToken) {
      return { valid: false, error: 'Invalid verification token' };
    }
    
    if (verificationToken.isUsed) {
      return { valid: false, error: 'Verification token has already been used' };
    }
    
    if (new Date() > verificationToken.expiresAt) {
      return { valid: false, error: 'Verification token has expired' };
    }
    
    return { valid: true, token: verificationToken };
  }

  /**
   * Mark a token as used
   */
  static async markTokenAsUsed(token: string): Promise<void> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    
    await tokenRepo.update(
      { token },
      { isUsed: true, usedAt: new Date() }
    );
  }

  /**
   * Get token by token string
   */
  static async getToken(token: string): Promise<VerificationToken | null> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    return await tokenRepo.findOne({ where: { token } });
  }

  /**
   * Get active token for a record
   */
  static async getActiveTokenForRecord(
    recordId: string, 
    type: 'WARRANTY_INSTALLER' | 'INSPECTION_INSTALLER' | 'CUSTOMER_ACTIVATION'
  ): Promise<VerificationToken | null> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    
    return await tokenRepo.findOne({
      where: {
        recordId,
        type,
        isUsed: false,
        expiresAt: MoreThan(new Date())
      },
      order: { created: 'DESC' }
    });
  }

  /**
   * Get all pending customer activation tokens that need reminders
   * Returns tokens where:
   * - Type is CUSTOMER_ACTIVATION
   * - Not used
   * - Not expired
   * - Created more than 24 hours ago (give customer time to activate)
   * - Less than 3 reminders sent
   * - Last reminder was more than 3 days ago (or no reminder sent yet)
   */
  static async getPendingActivationTokensForReminder(): Promise<VerificationToken[]> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Get tokens that need reminders
    const tokens = await tokenRepo
      .createQueryBuilder('token')
      .where('token.type = :type', { type: 'CUSTOMER_ACTIVATION' })
      .andWhere('token.isUsed = :isUsed', { isUsed: false })
      .andWhere('token.expiresAt > :now', { now: new Date() })
      .andWhere('token.created < :oneDayAgo', { oneDayAgo })
      .andWhere('token.remindersSent < :maxReminders', { maxReminders: 3 })
      .andWhere(
        '(token.lastReminderSentAt IS NULL OR token.lastReminderSentAt < :threeDaysAgo)',
        { threeDaysAgo }
      )
      .orderBy('token.created', 'ASC')
      .getMany();
    
    return tokens;
  }

  /**
   * Update reminder count for a token
   */
  static async updateReminderSent(tokenId: string): Promise<void> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    
    await tokenRepo
      .createQueryBuilder()
      .update(VerificationToken)
      .set({
        remindersSent: () => '"remindersSent" + 1',
        lastReminderSentAt: new Date()
      })
      .where('id = :id', { id: tokenId })
      .execute();
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    
    const result = await tokenRepo.delete({
      expiresAt: LessThan(new Date())
    });
    
    return result.affected || 0;
  }

  /**
   * Get token statistics
   */
  static async getTokenStatistics(): Promise<{
    totalTokens: number;
    activeInstallerTokens: number;
    activeCustomerTokens: number;
    usedTokens: number;
    expiredTokens: number;
  }> {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    const now = new Date();
    
    const [
      totalTokens,
      activeInstallerTokens,
      activeCustomerTokens,
      usedTokens,
      expiredTokens
    ] = await Promise.all([
      tokenRepo.count(),
      tokenRepo.count({
        where: {
          type: 'WARRANTY_INSTALLER',
          isUsed: false,
          expiresAt: MoreThan(now)
        }
      }),
      tokenRepo.count({
        where: {
          type: 'CUSTOMER_ACTIVATION',
          isUsed: false,
          expiresAt: MoreThan(now)
        }
      }),
      tokenRepo.count({ where: { isUsed: true } }),
      tokenRepo.count({ where: { expiresAt: LessThan(now) } })
    ]);
    
    return {
      totalTokens,
      activeInstallerTokens,
      activeCustomerTokens,
      usedTokens,
      expiredTokens
    };
  }
}
