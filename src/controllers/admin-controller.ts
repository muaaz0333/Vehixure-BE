import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../entities/User.js';
import Response from '../Traits/ApiResponser.js';
import bcrypt from 'bcryptjs';
import { EmailService } from '../services/email-service.js';

/**
 * 👤 Create new agent or inspector (Admin only)
 */
export const createUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { 
      email, 
      password, 
      fullName, 
      phone,
      businessName,
      contact,
      streetAddress,
      city,
      state,
      postcode,
      faxNumber,
      installerId,
      agentType,
      productsSold,
      buyPrice,
      accountStatus,
      username
    } = req.body as any;
    
    // Required fields validation
    const requiredFields = [
      'businessName', 'contact', 'streetAddress', 'city', 'state', 
      'postcode', 'phone', 'email', 'username', 'password', 'buyPrice', 'accountStatus', 'agentType'
    ];
    
    const missingFields = requiredFields.filter(field => !(req.body as any)[field]);
    if (missingFields.length > 0) {
      return Response.errorResponse(reply, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    if (agentType !== 'AGENT' && agentType !== 'INSPECTOR') {
      return Response.errorResponse(reply, 'agentType must be either AGENT or INSPECTOR', 400);
    }

    const repo = req.server.db.getRepository(User);
    
    // Check for existing email
    const existingEmail = await repo.findOneBy({ email });
    if (existingEmail) {
      return Response.errorResponse(reply, 'User with this email already exists', 400);
    }

    // Check for existing username
    const existingUsername = await repo.findOneBy({ username });
    if (existingUsername) {
      return Response.errorResponse(reply, 'Username already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = repo.create({
      email,
      password: hashedPassword,
      fullName,
      role: agentType, // Use agentType as the role
      phone,
      businessName,
      contact,
      streetAddress,
      city,
      state,
      postcode,
      faxNumber,
      installerId,
      agentType,
      productsSold,
      buyPrice,
      accountStatus,
      username,
      isEmailVerified: true, // Admin-created users are pre-verified
      isVerified: true
    });

    await repo.save(user);

    // Send welcome email for the newly created user
    try {
      await EmailService.sendUserCreationEmail({
        fullName: user.fullName || user.email,
        email: user.email,
        password: password, // Send the plain password in email (before hashing)
        role: agentType,
        businessName: user.businessName
      });
      console.log(`✅ Welcome email sent to ${agentType}: ${user.email}`);
    } catch (emailError: any) {
      console.error('❌ Failed to send welcome email:', emailError.message);
      // Don't fail the user creation if email fails
    }

    return Response.showOne(reply, {
      success: true,
      message: `${agentType} created successfully`,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        businessName: user.businessName,
        contact: user.contact,
        streetAddress: user.streetAddress,
        city: user.city,
        state: user.state,
        postcode: user.postcode,
        faxNumber: user.faxNumber,
        installerId: user.installerId,
        agentType: user.agentType,
        productsSold: user.productsSold,
        buyPrice: user.buyPrice,
        accountStatus: user.accountStatus,
        isVerified: user.isVerified,
        created: user.created
      },
    });
  } catch (err: any) {
    console.error('❌ createUser error:', err);
    
    // Handle specific database constraint errors
    if (err.code === '23505') { // PostgreSQL unique constraint violation
      if (err.detail?.includes('email')) {
        return Response.errorResponse(reply, 'Email address already exists', 400);
      }
      if (err.detail?.includes('username')) {
        return Response.errorResponse(reply, 'Username already exists', 400);
      }
      if (err.detail?.includes('phone')) {
        return Response.errorResponse(reply, 'Phone number already exists', 400);
      }
      return Response.errorResponse(reply, 'Duplicate value detected. Please check email, username, and phone number.', 400);
    }
    
    return Response.errorResponse(reply, err.message || 'Failed to create user');
  }
};

/**
 * 🔒 Block/Unblock user (Admin only)
 */
export const toggleUserBlock = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.params as any;
    const { isBlocked, blockedReason } = req.body as any;

    if (typeof isBlocked !== 'boolean') {
      return Response.errorResponse(reply, 'isBlocked must be a boolean value', 400);
    }

    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId, isDeleted: false });

    if (!user) {
      return Response.errorResponse(reply, 'User not found', 404);
    }

    if (user.role === 'ADMIN') {
      return Response.errorResponse(reply, 'Cannot block/unblock admin users', 400);
    }

    const updateData: any = {
      isBlocked,
      blockedAt: isBlocked ? new Date() : null,
      blockedReason: isBlocked ? blockedReason : null
    };

    await repo.update(userId, updateData);

    const updatedUser = await repo.findOneBy({ id: userId });

    return Response.showOne(reply, {
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: updatedUser,
    });
  } catch (err: any) {
    console.error('❌ toggleUserBlock error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to update user block status');
  }
};

/**
 * 🗑️ Delete user (Admin only)
 */
export const deleteUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.params as any;

    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: userId, isDeleted: false });

    if (!user) {
      return Response.errorResponse(reply, 'User not found', 404);
    }

    if (user.role === 'ADMIN') {
      return Response.errorResponse(reply, 'Cannot delete admin users', 400);
    }

    // Soft delete
    await repo.update(userId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    return Response.showOne(reply, {
      success: true,
      message: 'User deleted successfully',
      data: { userId },
    });
  } catch (err: any) {
    console.error('❌ deleteUser error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to delete user');
  }
};

/**
 * ✏️ Edit existing agent or inspector (Admin only)
 */
export const editUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.params as any;
    const updateData = req.body as any;
    
    const repo = req.server.db.getRepository(User);
    
    // Check if user exists and is not deleted
    const existingUser = await repo.findOneBy({ id: userId, isDeleted: false });
    if (!existingUser) {
      return Response.errorResponse(reply, 'User not found', 404);
    }

    // Only allow editing agents and inspectors
    if (existingUser.role !== 'AGENT' && existingUser.role !== 'INSPECTOR') {
      return Response.errorResponse(reply, 'Can only edit agents or inspectors', 400);
    }

    // Validate agentType if provided
    if (updateData.agentType && updateData.agentType !== 'AGENT' && updateData.agentType !== 'INSPECTOR') {
      return Response.errorResponse(reply, 'agentType must be either AGENT or INSPECTOR', 400);
    }

    // Check for unique constraints if email or username is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const existingEmail = await repo.findOneBy({ email: updateData.email });
      if (existingEmail) {
        return Response.errorResponse(reply, 'Email address already exists', 400);
      }
    }

    if (updateData.username && updateData.username !== existingUser.username) {
      const existingUsername = await repo.findOneBy({ username: updateData.username });
      if (existingUsername) {
        return Response.errorResponse(reply, 'Username already exists', 400);
      }
    }

    if (updateData.phone && updateData.phone !== existingUser.phone) {
      const existingPhone = await repo.findOneBy({ phone: updateData.phone });
      if (existingPhone) {
        return Response.errorResponse(reply, 'Phone number already exists', 400);
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // If agentType is being changed, update the role as well
    if (updateData.agentType) {
      updateData.role = updateData.agentType;
    }

    // Remove undefined values to avoid overwriting with null
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Update the user
    await repo.update(userId, cleanUpdateData);

    // Fetch updated user
    const updatedUser = await repo.findOneBy({ id: userId });

    return Response.showOne(reply, {
      success: true,
      message: `${existingUser.role} updated successfully`,
      data: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        username: updatedUser!.username,
        fullName: updatedUser!.fullName,
        role: updatedUser!.role,
        phone: updatedUser!.phone,
        businessName: updatedUser!.businessName,
        contact: updatedUser!.contact,
        streetAddress: updatedUser!.streetAddress,
        city: updatedUser!.city,
        state: updatedUser!.state,
        postcode: updatedUser!.postcode,
        faxNumber: updatedUser!.faxNumber,
        installerId: updatedUser!.installerId,
        agentType: updatedUser!.agentType,
        productsSold: updatedUser!.productsSold,
        buyPrice: updatedUser!.buyPrice,
        accountStatus: updatedUser!.accountStatus,
        isVerified: updatedUser!.isVerified,
        isBlocked: updatedUser!.isBlocked,
        created: updatedUser!.created,
        modified: updatedUser!.modified
      },
    });
  } catch (err: any) {
    console.error('❌ editUser error:', err);
    
    // Handle specific database constraint errors
    if (err.code === '23505') { // PostgreSQL unique constraint violation
      if (err.detail?.includes('email')) {
        return Response.errorResponse(reply, 'Email address already exists', 400);
      }
      if (err.detail?.includes('username')) {
        return Response.errorResponse(reply, 'Username already exists', 400);
      }
      if (err.detail?.includes('phone')) {
        return Response.errorResponse(reply, 'Phone number already exists', 400);
      }
      return Response.errorResponse(reply, 'Duplicate value detected. Please check email, username, and phone number.', 400);
    }
    
    return Response.errorResponse(reply, err.message || 'Failed to update user');
  }
};

/**
 * 📊 Get dashboard stats (Admin only)
 */
export const getDashboardStats = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const repo = req.server.db.getRepository(User);

    const [totalAgents, totalInspectors, blockedUsers, verifiedUsers] = await Promise.all([
      repo.count({ where: { role: 'AGENT', isDeleted: false } }),
      repo.count({ where: { role: 'INSPECTOR', isDeleted: false } }),
      repo.count({ where: { isBlocked: true, isDeleted: false } }),
      repo.count({ where: { isVerified: true, isDeleted: false } })
    ]);

    return Response.showOne(reply, {
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalAgents,
        totalInspectors,
        blockedUsers,
        verifiedUsers,
        totalUsers: totalAgents + totalInspectors
      },
    });
  } catch (err: any) {
    console.error('❌ getDashboardStats error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve dashboard stats');
  }
};

/**
 * 📋 Get all agents for dropdown (Admin only)
 */
export const getAgentsForDropdown = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const repo = req.server.db.getRepository(User);
    
    const agents = await repo.find({
      where: { 
        role: 'AGENT', 
        isDeleted: false, 
        accountStatus: 'Active' 
      },
      select: ['id', 'fullName', 'businessName', 'email', 'role'],
      order: { 
        fullName: 'ASC' 
      }
    });

    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.fullName || agent.businessName || agent.email,
      businessName: agent.businessName,
      email: agent.email,
      role: agent.role
    }));

    return Response.showAll(reply, formattedAgents);
  } catch (err: any) {
    console.error('❌ getAgentsForDropdown error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve agents');
  }
};

/**
 * 📋 Get all inspectors for dropdown (Admin only)
 */
export const getInspectorsForDropdown = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const repo = req.server.db.getRepository(User);
    
    const inspectors = await repo.find({
      where: { 
        role: 'INSPECTOR', 
        isDeleted: false, 
        accountStatus: 'Active' 
      },
      select: ['id', 'fullName', 'businessName', 'email', 'role'],
      order: { 
        fullName: 'ASC' 
      }
    });

    const formattedInspectors = inspectors.map(inspector => ({
      id: inspector.id,
      name: inspector.fullName || inspector.businessName || inspector.email,
      businessName: inspector.businessName,
      email: inspector.email,
      role: inspector.role
    }));

    return Response.showAll(reply, formattedInspectors);
  } catch (err: any) {
    console.error('❌ getInspectorsForDropdown error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve inspectors');
  }
};

/**
 * 🔐 Login as agent/inspector (Admin only)
 */
export const loginAsUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = req.params as any;
    
    const repo = req.server.db.getRepository(User);
    
    // Find the target user
    const targetUser = await repo.findOneBy({ 
      id: userId, 
      isDeleted: false,
      isBlocked: false
    });

    if (!targetUser) {
      return Response.errorResponse(reply, 'User not found or is blocked', 404);
    }

    // Only allow login as agents or inspectors
    if (targetUser.role !== 'AGENT' && targetUser.role !== 'INSPECTOR') {
      return Response.errorResponse(reply, 'Can only login as agents or inspectors', 400);
    }

    // Generate JWT token for the target user
    const token = req.server.jwt.sign({
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
    });

    return Response.showOne(reply, {
      success: true,
      message: `Successfully logged in as ${targetUser.role.toLowerCase()}: ${targetUser.fullName || targetUser.email}`,
      data: {
        token,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          username: targetUser.username,
          fullName: targetUser.fullName,
          role: targetUser.role,
          phone: targetUser.phone,
          businessName: targetUser.businessName,
          contact: targetUser.contact,
          streetAddress: targetUser.streetAddress,
          city: targetUser.city,
          state: targetUser.state,
          postcode: targetUser.postcode,
          faxNumber: targetUser.faxNumber,
          installerId: targetUser.installerId,
          agentType: targetUser.agentType,
          productsSold: targetUser.productsSold,
          buyPrice: targetUser.buyPrice,
          accountStatus: targetUser.accountStatus,
          isVerified: targetUser.isVerified,
          created: targetUser.created
        }
      }
    });
  } catch (err: any) {
    console.error('❌ loginAsUser error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to login as user');
  }
};