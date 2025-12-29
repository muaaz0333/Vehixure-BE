import { FastifyRequest, FastifyReply } from 'fastify';
import { Repository } from 'typeorm';
import { PartnerAccount } from '../entities/PartnerAccount.js';
import { User } from '../entities/User.js';
import { AppDataSource } from '../plugins/typeorm.js';
import bcrypt from 'bcryptjs';
import { EmailService } from '../services/email-service.js';

interface CreatePartnerAccountRequest {
  // Partner Account Details
  businessName: string;
  contactPerson: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  faxNumber?: string;
  email?: string;
  productsSold?: string;
  buyPrice?: string;

  // Admin User Details
  adminUserEmail: string;
  adminUserPassword: string;
  adminUserFullName?: string;
  adminUserPhone?: string;
  adminUserMobile?: string;
}

interface UpdatePartnerAccountRequest {
  businessName?: string;
  contactPerson?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  faxNumber?: string;
  email?: string;
  productsSold?: string;
  buyPrice?: string;
  accountStatus?: 'Active' | 'InActive' | 'Suspended';
}

interface CreatePartnerUserRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  mobileNumber?: string;
  partnerRole: 'ACCOUNT_ADMIN' | 'ACCOUNT_STAFF' | 'ACCOUNT_INSTALLER';
  isAccreditedInstaller?: boolean;
  isAuthorisedInspector?: boolean;
  installerCertificationNumber?: string;
  inspectorCertificationNumber?: string;
}

export class PartnerAccountController {
  private partnerAccountRepository!: Repository<PartnerAccount>;
  private userRepository!: Repository<User>;

  constructor() {
    // Repositories will be initialized lazily when needed
  }

  private initializeRepositories() {
    if (!this.partnerAccountRepository) {
      this.partnerAccountRepository = AppDataSource.getRepository(PartnerAccount);
      this.userRepository = AppDataSource.getRepository(User);
    }
  }

  // Create new partner account with admin user
  async createPartnerAccount(request: FastifyRequest<{ Body: CreatePartnerAccountRequest }>, reply: FastifyReply) {
    try {
      this.initializeRepositories();
      const {
        businessName,
        contactPerson,
        streetAddress,
        city,
        state,
        postcode,
        country,
        phone,
        faxNumber,
        email,
        productsSold,
        buyPrice,
        adminUserEmail,
        adminUserPassword,
        adminUserFullName,
        adminUserPhone,
        adminUserMobile
      } = request.body;

      // Check if email already exists
      // Check if partner account email already exists
      if (email) {
        const existingAccount = await this.partnerAccountRepository.findOne({
          where: { email, isDeleted: false }
        });

        if (existingAccount) {
          return reply.status(400).send({
            success: false,
            message: 'Partner account with this email already exists'
          });
        }
      }

      // Check if admin user email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: adminUserEmail, isDeleted: false }
      });

      if (existingUser) {
        return reply.status(400).send({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create partner account
      const partnerAccount = this.partnerAccountRepository.create({
        businessName,
        contactPerson,
        streetAddress,
        city,
        state,
        postcode,
        country,
        phone,
        faxNumber,
        email,
        productsSold,
        buyPrice: buyPrice as any,
        accountStatus: 'Active'
      });

      const savedAccount = await this.partnerAccountRepository.save(partnerAccount);

      // Hash password for admin user
      const hashedPassword = await bcrypt.hash(adminUserPassword, 10);

      // Create admin user for the partner account
      const adminUser = this.userRepository.create({
        email: adminUserEmail,
        password: hashedPassword,
        fullName: adminUserFullName,
        phone: adminUserPhone,
        mobileNumber: adminUserMobile,
        role: 'PARTNER_USER',
        partnerRole: 'ACCOUNT_ADMIN',
        partnerAccountId: savedAccount.id,
        isVerified: true,
        isEmailVerified: true,
        accountStatus: 'Active'
      });

      const savedUser = await this.userRepository.save(adminUser);

      // Send welcome email to the admin user
      try {
        console.log('📧 Attempting to send partner account creation email...');
        console.log(`   Business Name: ${businessName}`);
        console.log(`   Contact Person: ${contactPerson}`);
        console.log(`   Admin Email: ${adminUserEmail}`);
        console.log(`   Admin Full Name: ${adminUserFullName || contactPerson}`);

        await EmailService.sendPartnerAccountCreationEmail({
          businessName,
          contactPerson,
          adminEmail: adminUserEmail,
          adminPassword: adminUserPassword,
          adminFullName: adminUserFullName || contactPerson,
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
        });
        console.log(`✅ Partner account creation email sent to: ${adminUserEmail}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send partner account creation email:', emailError.message);
        console.error('❌ Email error stack:', emailError.stack);
        // Don't fail the account creation if email fails
      }

      return reply.status(201).send({
        success: true,
        message: 'Partner account created successfully',
        data: {
          partnerAccount: savedAccount,
          adminUser: {
            id: savedUser.id,
            email: savedUser.email,
            fullName: savedUser.fullName,
            partnerRole: savedUser.partnerRole
          }
        }
      });

    } catch (error) {
      console.error('Error creating partner account:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all partner accounts
  async getPartnerAccounts(request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string } }>, reply: FastifyReply) {
    try {
      this.initializeRepositories();
      const { page = '1', limit = '10', search, status } = request.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const queryBuilder = this.partnerAccountRepository.createQueryBuilder('account')
        .where('account.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('account.created', 'DESC');

      if (search) {
        queryBuilder.andWhere(
          '(account.businessName ILIKE :search OR account.contactPerson ILIKE :search OR account.email ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (status) {
        queryBuilder.andWhere('account.accountStatus = :status', { status });
      }

      const [accounts, total] = await queryBuilder
        .skip(skip)
        .take(parseInt(limit))
        .getManyAndCount();

      return reply.send({
        success: true,
        message: 'Partner accounts retrieved successfully',
        data: accounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error getting partner accounts:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get partner account by ID
  async getPartnerAccountById(request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) {
    try {
      this.initializeRepositories();
      const { accountId } = request.params;

      const account = await this.partnerAccountRepository.findOne({
        where: { id: accountId, isDeleted: false }
      });

      if (!account) {
        return reply.status(404).send({
          success: false,
          message: 'Partner account not found'
        });
      }

      return reply.send({
        success: true,
        message: 'Partner account retrieved successfully',
        data: account
      });

    } catch (error) {
      console.error('Error getting partner account:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update partner account
  async updatePartnerAccount(request: FastifyRequest<{ Params: { accountId: string }; Body: UpdatePartnerAccountRequest }>, reply: FastifyReply) {
    try {
      this.initializeRepositories();
      const { accountId } = request.params;
      const updateData = request.body;

      const account = await this.partnerAccountRepository.findOne({
        where: { id: accountId, isDeleted: false }
      });

      if (!account) {
        return reply.status(404).send({
          success: false,
          message: 'Partner account not found'
        });
      }

      // Check if business name is being changed and if it already exists
      if (updateData.businessName && updateData.businessName !== account.businessName) {
        const existingAccount = await this.partnerAccountRepository.findOne({
          where: { businessName: updateData.businessName, isDeleted: false }
        });

        if (existingAccount) {
          return reply.status(400).send({
            success: false,
            message: 'Partner account with this business name already exists'
          });
        }
      }

      Object.assign(account, updateData);
      const updatedAccount = await this.partnerAccountRepository.save(account);

      return reply.send({
        success: true,
        message: 'Partner account updated successfully',
        data: updatedAccount
      });

    } catch (error) {
      console.error('Error updating partner account:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create partner user
  async createPartnerUser(request: FastifyRequest<{ Params: { accountId: string }; Body: CreatePartnerUserRequest }>, reply: FastifyReply) {
    try {
      this.initializeRepositories();
      const { accountId } = request.params;
      const {
        email,
        password,
        fullName,
        phone,
        mobileNumber,
        partnerRole,
        isAccreditedInstaller = false,
        isAuthorisedInspector = false,
        installerCertificationNumber,
        inspectorCertificationNumber
      } = request.body;

      // Check if partner account exists
      const partnerAccount = await this.partnerAccountRepository.findOne({
        where: { id: accountId, isDeleted: false }
      });

      if (!partnerAccount) {
        return reply.status(404).send({
          success: false,
          message: 'Partner account not found'
        });
      }

      // Check if user email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email, isDeleted: false }
      });

      if (existingUser) {
        return reply.status(400).send({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        mobileNumber,
        role: 'PARTNER_USER',
        partnerRole,
        partnerAccountId: accountId,
        isAccreditedInstaller,
        isAuthorisedInspector,
        installerCertificationNumber,
        inspectorCertificationNumber,
        isVerified: true,
        isEmailVerified: true,
        accountStatus: 'Active'
      });

      const savedUser = await this.userRepository.save(user);

      // Send welcome email to the new partner user
      try {
        const roleDisplayName = partnerRole === 'ACCOUNT_ADMIN' ? 'Account Admin' :
          partnerRole === 'ACCOUNT_STAFF' ? 'Account Staff' :
            'Account Installer';

        await EmailService.sendGenericUserCreationEmail({
          fullName: savedUser.fullName || savedUser.email,
          email: savedUser.email,
          password: password, // Send the plain password in email (before hashing)
          role: `PARTNER_USER (${roleDisplayName})`,
          businessName: partnerAccount.businessName,
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
        });
        console.log(`✅ Welcome email sent to partner user: ${savedUser.email}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send welcome email to partner user:', emailError.message);
        // Don't fail the user creation if email fails
      }

      // Remove password from response
      const { password: _, ...userResponse } = savedUser;

      return reply.status(201).send({
        success: true,
        message: 'Partner user created successfully',
        data: userResponse
      });

    } catch (error: any) {
      console.error('Error creating partner user:', error);

      if (error?.code === '23505') {
        if (error.detail?.includes('phone')) {
          return reply.status(400).send({
            success: false,
            message: 'Phone number already exists'
          });
        }

        if (error.detail?.includes('email')) {
          return reply.status(400).send({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }


  // Get partner users
  async getPartnerUsers(request: FastifyRequest<{ Params: { accountId: string }; Querystring: { role?: string } }>, reply: FastifyReply) {
    try {
      this.initializeRepositories();
      const { accountId } = request.params;
      const { role } = request.query;

      const queryBuilder = this.userRepository.createQueryBuilder('user')
        .where('user.partnerAccountId = :accountId', { accountId })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('user.created', 'DESC');

      if (role) {
        queryBuilder.andWhere('user.partnerRole = :role', { role });
      }

      const users = await queryBuilder.getMany();

      // Remove passwords from response
      const usersResponse = users.map(({ password, ...user }) => user);

      return reply.send({
        success: true,
        message: 'Partner users retrieved successfully',
        data: usersResponse
      });

    } catch (error) {
      console.error('Error getting partner users:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete partner account (soft delete)
  async deletePartnerAccount(request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) {
    try {
      this.initializeRepositories();
      const { accountId } = request.params;

      const account = await this.partnerAccountRepository.findOne({
        where: { id: accountId, isDeleted: false }
      });

      if (!account) {
        return reply.status(404).send({
          success: false,
          message: 'Partner account not found'
        });
      }

      // Soft delete the account
      account.isDeleted = true;
      account.deletedAt = new Date();
      await this.partnerAccountRepository.save(account);

      // Soft delete all users in this account
      await this.userRepository.update(
        { partnerAccountId: accountId, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() }
      );

      return reply.send({
        success: true,
        message: 'Partner account deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting partner account:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export const partnerAccountController = new PartnerAccountController();