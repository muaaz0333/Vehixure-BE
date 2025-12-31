import crypto from "crypto";
import { AppDataSource } from "../plugins/typeorm.js";
import { VerificationToken } from "../entities/VerificationToken.js";
import { LessThan, MoreThan } from "typeorm";
const INSTALLER_TOKEN_EXPIRY_DAYS = 60;
const CUSTOMER_TOKEN_EXPIRY_DAYS = 30;
export class VerificationTokenService {
  /**
   * Generate and store a new verification token
   */
  static async createToken(params) {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    const token = crypto.randomBytes(32).toString("hex");
    const expiryDays = params.type === "CUSTOMER_ACTIVATION" ? CUSTOMER_TOKEN_EXPIRY_DAYS : INSTALLER_TOKEN_EXPIRY_DAYS;
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    await tokenRepo.update(
      {
        recordId: params.recordId,
        type: params.type,
        isUsed: false
      },
      { isUsed: true }
    );
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
  static async validateToken(token) {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    const verificationToken = await tokenRepo.findOne({
      where: { token }
    });
    if (!verificationToken) {
      return { valid: false, error: "Invalid verification token" };
    }
    if (verificationToken.isUsed) {
      return { valid: false, error: "Verification token has already been used" };
    }
    if (/* @__PURE__ */ new Date() > verificationToken.expiresAt) {
      return { valid: false, error: "Verification token has expired" };
    }
    return { valid: true, token: verificationToken };
  }
  /**
   * Mark a token as used
   */
  static async markTokenAsUsed(token) {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    await tokenRepo.update(
      { token },
      { isUsed: true, usedAt: /* @__PURE__ */ new Date() }
    );
  }
  /**
   * Get token by token string
   */
  static async getToken(token) {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    return await tokenRepo.findOne({ where: { token } });
  }
  /**
   * Get active token for a record
   */
  static async getActiveTokenForRecord(recordId, type) {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    return await tokenRepo.findOne({
      where: {
        recordId,
        type,
        isUsed: false,
        expiresAt: MoreThan(/* @__PURE__ */ new Date())
      },
      order: { created: "DESC" }
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
  static async getPendingActivationTokensForReminder() {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    const oneDayAgo = /* @__PURE__ */ new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const threeDaysAgo = /* @__PURE__ */ new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const tokens = await tokenRepo.createQueryBuilder("token").where("token.type = :type", { type: "CUSTOMER_ACTIVATION" }).andWhere("token.isUsed = :isUsed", { isUsed: false }).andWhere("token.expiresAt > :now", { now: /* @__PURE__ */ new Date() }).andWhere("token.created < :oneDayAgo", { oneDayAgo }).andWhere("token.remindersSent < :maxReminders", { maxReminders: 3 }).andWhere(
      "(token.lastReminderSentAt IS NULL OR token.lastReminderSentAt < :threeDaysAgo)",
      { threeDaysAgo }
    ).orderBy("token.created", "ASC").getMany();
    return tokens;
  }
  /**
   * Update reminder count for a token
   */
  static async updateReminderSent(tokenId) {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    await tokenRepo.createQueryBuilder().update(VerificationToken).set({
      remindersSent: () => '"remindersSent" + 1',
      lastReminderSentAt: /* @__PURE__ */ new Date()
    }).where("id = :id", { id: tokenId }).execute();
  }
  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens() {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    const result = await tokenRepo.delete({
      expiresAt: LessThan(/* @__PURE__ */ new Date())
    });
    return result.affected || 0;
  }
  /**
   * Get token statistics
   */
  static async getTokenStatistics() {
    const tokenRepo = AppDataSource.getRepository(VerificationToken);
    const now = /* @__PURE__ */ new Date();
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
          type: "WARRANTY_INSTALLER",
          isUsed: false,
          expiresAt: MoreThan(now)
        }
      }),
      tokenRepo.count({
        where: {
          type: "CUSTOMER_ACTIVATION",
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
