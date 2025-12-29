import { User } from '../entities/User.js';
import { Warranty } from '../entities/Warranty.js';
import { AnnualInspection } from '../entities/AnnualInspection.js';
import { Repository } from 'typeorm';
import crypto from 'crypto';
import { SMSService } from './smsService.js';

export interface VerificationLink {
  token: string;
  expiresAt: Date;
  type: 'WARRANTY' | 'INSPECTION';
  recordId: string;
  installerId: string;
}

// Token expiry duration: 60 days in milliseconds (per client requirement)
const TOKEN_EXPIRY_MS = 60 * 24 * 60 * 60 * 1000;

export class VerificationService {
  private static verificationLinks = new Map<string, VerificationLink>();

  /**
   * Send SMS verification to installer for warranty registration
   */
  static async sendWarrantyVerification(
    warranty: any,
    installer: User,
    userRepo: Repository<User>
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!installer.mobileNumber) {
        return { success: false, message: 'Installer mobile number not found' };
      }

      // Generate secure verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS); // 60 days

      // Store verification link
      this.verificationLinks.set(token, {
        token,
        expiresAt,
        type: 'WARRANTY',
        recordId: warranty.id,
        installerId: installer.id
      });

      // Create verification URL
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/warranty/${token}`;

      // Send SMS
      await SMSService.sendWarrantyVerificationSMS(
        installer.mobileNumber,
        installer.fullName || installer.email,
        warranty.ownerName || 'Customer',
        `${warranty.vehicleMake} ${warranty.vehicleModel} (${warranty.vin})`,
        token
      );

      // Update installer verification tracking
      await userRepo.update(installer.id, {
        lastVerificationSent: new Date(),
        verificationAttempts: (installer.verificationAttempts || 0) + 1
      });

      return { success: true, message: 'Verification SMS sent successfully' };
    } catch (error: any) {
      console.error('❌ Error sending warranty verification:', error);
      return { success: false, message: 'Failed to send verification SMS' };
    }
  }

  /**
   * Send SMS verification to inspector for annual inspection
   */
  static async sendInspectionVerification(
    inspection: any,
    inspector: User,
    userRepo: Repository<User>
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!inspector.mobileNumber) {
        return { success: false, message: 'Inspector mobile number not found' };
      }

      // Generate secure verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS); // 60 days

      // Store verification link
      this.verificationLinks.set(token, {
        token,
        expiresAt,
        type: 'INSPECTION',
        recordId: inspection.id,
        installerId: inspector.id
      });

      // Create verification URL
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/inspection/${token}`;

      // Send SMS
      await SMSService.sendInspectionVerificationSMS(
        inspector.mobileNumber,
        inspector.fullName || inspector.email,
        inspection.ownerName || 'Customer',
        `${inspection.vehicleMake} ${inspection.vehicleModel} (${inspection.vin})`,
        token
      );

      // Update inspector verification tracking
      await userRepo.update(inspector.id, {
        lastVerificationSent: new Date(),
        verificationAttempts: (inspector.verificationAttempts || 0) + 1
      });

      return { success: true, message: 'Verification SMS sent successfully' };
    } catch (error: any) {
      console.error('❌ Error sending inspection verification:', error);
      return { success: false, message: 'Failed to send verification SMS' };
    }
  }

  /**
   * Verify warranty registration via SMS token
   */
  static async verifyWarranty(
    token: string,
    action: 'CONFIRM' | 'DECLINE',
    declineReason?: string,
    warrantyRepo?: Repository<any>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const verificationLink = this.verificationLinks.get(token);
      
      if (!verificationLink) {
        return { success: false, message: 'Invalid or expired verification link' };
      }

      if (verificationLink.type !== 'WARRANTY') {
        return { success: false, message: 'Invalid verification type' };
      }

      if (new Date() > verificationLink.expiresAt) {
        this.verificationLinks.delete(token);
        return { success: false, message: 'Verification link has expired' };
      }

      if (!warrantyRepo) {
        return { success: false, message: 'Warranty repository not provided' };
      }

      const warranty = await warrantyRepo.findOne({
        where: { id: verificationLink.recordId }
      });

      if (!warranty) {
        return { success: false, message: 'Warranty record not found' };
      }

      if (action === 'CONFIRM') {
        // Verify warranty - set to PENDING_CUSTOMER_ACTIVATION (customer must accept terms)
        await warrantyRepo.update(warranty.id, {
          status: 'PENDING_CUSTOMER_ACTIVATION',
          verificationStatus: 'PENDING_CUSTOMER_ACTIVATION',
          verifiedAt: new Date(),
          verifiedBy: verificationLink.installerId,
          isActive: false // Not active until customer accepts terms
        });

        // Clean up verification link
        this.verificationLinks.delete(token);

        return {
          success: true,
          message: 'Warranty verified by installer. Customer notification will be sent.',
          data: { 
            warrantyId: warranty.id, 
            status: 'PENDING_CUSTOMER_ACTIVATION',
            nextStep: 'CUSTOMER_TERMS_ACCEPTANCE'
          }
        };
      } else {
        // Decline warranty
        await warrantyRepo.update(warranty.id, {
          status: 'REJECTED',
          verificationStatus: 'REJECTED',
          declinedAt: new Date(),
          declinedBy: verificationLink.installerId,
          rejectionReason: declineReason || 'No reason provided'
        });

        // Clean up verification link
        this.verificationLinks.delete(token);

        return {
          success: true,
          message: 'Warranty declined successfully',
          data: { warrantyId: warranty.id, status: 'REJECTED' }
        };
      }
    } catch (error: any) {
      console.error('❌ Error verifying warranty:', error);
      return { success: false, message: 'Failed to process verification' };
    }
  }

  /**
   * Verify annual inspection via SMS token
   */
  static async verifyInspection(
    token: string,
    action: 'CONFIRM' | 'DECLINE',
    declineReason?: string,
    inspectionRepo?: Repository<any>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const verificationLink = this.verificationLinks.get(token);
      
      if (!verificationLink) {
        return { success: false, message: 'Invalid or expired verification link' };
      }

      if (verificationLink.type !== 'INSPECTION') {
        return { success: false, message: 'Invalid verification type' };
      }

      if (new Date() > verificationLink.expiresAt) {
        this.verificationLinks.delete(token);
        return { success: false, message: 'Verification link has expired' };
      }

      if (!inspectionRepo) {
        return { success: false, message: 'Inspection repository not provided' };
      }

      const inspection = await inspectionRepo.findOne({
        where: { id: verificationLink.recordId }
      });

      if (!inspection) {
        return { success: false, message: 'Inspection record not found' };
      }

      if (action === 'CONFIRM') {
        // Verify inspection and extend warranty
        await inspectionRepo.update(inspection.id, {
          status: 'VERIFIED',
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: verificationLink.installerId
        });

        // Clean up verification link
        this.verificationLinks.delete(token);

        return {
          success: true,
          message: 'Inspection verified successfully',
          data: { inspectionId: inspection.id, status: 'VERIFIED' }
        };
      } else {
        // Decline inspection
        await inspectionRepo.update(inspection.id, {
          status: 'REJECTED',
          verificationStatus: 'REJECTED',
          declinedAt: new Date(),
          declinedBy: verificationLink.installerId,
          rejectionReason: declineReason || 'No reason provided'
        });

        // Clean up verification link
        this.verificationLinks.delete(token);

        return {
          success: true,
          message: 'Inspection declined successfully',
          data: { inspectionId: inspection.id, status: 'REJECTED' }
        };
      }
    } catch (error: any) {
      console.error('❌ Error verifying inspection:', error);
      return { success: false, message: 'Failed to process verification' };
    }
  }

  /**
   * Get verification details for display (without processing)
   */
  static getVerificationDetails(token: string): VerificationLink | null {
    const verificationLink = this.verificationLinks.get(token);
    
    if (!verificationLink) {
      return null;
    }

    if (new Date() > verificationLink.expiresAt) {
      this.verificationLinks.delete(token);
      return null;
    }

    return verificationLink;
  }

  /**
   * Clean up expired verification links
   */
  static cleanupExpiredLinks(): void {
    const now = new Date();
    for (const [token, link] of this.verificationLinks.entries()) {
      if (now > link.expiresAt) {
        this.verificationLinks.delete(token);
      }
    }
  }
}

// Clean up expired links every hour
setInterval(() => {
  VerificationService.cleanupExpiredLinks();
}, 60 * 60 * 1000);
