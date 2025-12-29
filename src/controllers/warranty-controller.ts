import { FastifyRequest, FastifyReply } from 'fastify';
import { Warranty } from '../entities/Warranty.js';
import { WarrantyTerms } from '../entities/WarrantyTerms.js';
import { User } from '../entities/User.js';
import Response from '../Traits/ApiResponser.js';

/**
 * 📋 Create new warranty (Admin only)
 */
export const createWarranty = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const {
      refStockId,
      agentId,
      warrantyTermsId,
      companyName,
      firstName,
      lastName,
      phoneNumber,
      email,
      make,
      model,
      registrationNumber,
      buildDate,
      vinNumber,
      installersName,
      dateInstalled,
      generatorSerialNumber,
      numberOfCouplersInstalled,
      voltageInCouplerSupplyLine,
      positionOfCouplers,
      corrosionFound,
      corrosionDetails,
      installationConfirmed,
      status = 'DRAFT'
    } = req.body as any;

    // Required fields validation
    const requiredFields = [
      'agentId', 'warrantyTermsId', 'firstName', 'lastName', 'phoneNumber', 
      'email', 'make', 'model', 'buildDate', 'vinNumber', 'installersName', 
      'dateInstalled', 'generatorSerialNumber'
    ];
    
    const missingFields = requiredFields.filter(field => !(req.body as any)[field]);
    if (missingFields.length > 0) {
      return Response.errorResponse(reply, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    const warrantyRepo = req.server.db.getRepository(Warranty);
    const userRepo = req.server.db.getRepository(User);
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);

    // Validate agent exists and is active
    const agent = await userRepo.findOneBy({ 
      id: agentId, 
      role: 'AGENT', 
      isDeleted: false,
      accountStatus: 'Active'
    });
    if (!agent) {
      return Response.errorResponse(reply, 'Agent not found or inactive', 404);
    }

    // Validate warranty terms exist and are active
    const warrantyTerms = await warrantyTermsRepo.findOneBy({ 
      id: warrantyTermsId, 
      isActive: true, 
      isDeleted: false 
    });
    if (!warrantyTerms) {
      return Response.errorResponse(reply, 'Warranty terms not found or inactive', 404);
    }

    const warranty = warrantyRepo.create({
      refStockId,
      agentId,
      warrantyTermsId,
      companyName,
      firstName,
      lastName,
      phoneNumber,
      email,
      make,
      model,
      registrationNumber,
      buildDate: new Date(buildDate),
      vinNumber,
      installersName,
      dateInstalled: new Date(dateInstalled),
      generatorSerialNumber,
      numberOfCouplersInstalled,
      voltageInCouplerSupplyLine,
      positionOfCouplers,
      corrosionFound: Boolean(corrosionFound),
      corrosionDetails,
      installationConfirmed: Boolean(installationConfirmed),
      status
    });

    await warrantyRepo.save(warranty);

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty created successfully',
      data: warranty,
    });
  } catch (err: any) {
    console.error('❌ createWarranty error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to create warranty');
  }
};

/**
 * 📋 Get all warranties with filters (Admin only)
 */
export const getAllWarranties = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      agentId, 
      corrosionFound,
      search 
    } = req.query as any;

    const warrantyRepo = req.server.db.getRepository(Warranty);
    
    const queryBuilder = warrantyRepo.createQueryBuilder('warranty')
      .leftJoinAndSelect('warranty.agent', 'agent')
      .leftJoinAndSelect('warranty.warrantyTerms', 'warrantyTerms')
      .where('warranty.isDeleted = :isDeleted', { isDeleted: false });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('warranty.status = :status', { status });
    }
    
    if (agentId) {
      queryBuilder.andWhere('warranty.agentId = :agentId', { agentId });
    }
    
    if (corrosionFound !== undefined) {
      queryBuilder.andWhere('warranty.corrosionFound = :corrosionFound', { 
        corrosionFound: Boolean(corrosionFound) 
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(warranty.firstName ILIKE :search OR warranty.lastName ILIKE :search OR warranty.email ILIKE :search OR warranty.vinNumber ILIKE :search OR warranty.refStockId ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    
    // Order by creation date
    queryBuilder.orderBy('warranty.created', 'DESC');

    const [warranties, total] = await queryBuilder.getManyAndCount();

    return reply.send({
      success: true,
      message: 'Warranties retrieved successfully',
      data: warranties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('❌ getAllWarranties error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve warranties');
  }
};

/**
 * 📋 Get warranty by ID (Admin only)
 */
export const getWarrantyById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyId } = req.params as any;

    const warrantyRepo = req.server.db.getRepository(Warranty);
    
    const warranty = await warrantyRepo.createQueryBuilder('warranty')
      .leftJoinAndSelect('warranty.agent', 'agent')
      .leftJoinAndSelect('warranty.warrantyTerms', 'warrantyTerms')
      .where('warranty.id = :id AND warranty.isDeleted = :isDeleted', { 
        id: warrantyId, 
        isDeleted: false 
      })
      .getOne();

    if (!warranty) {
      return Response.errorResponse(reply, 'Warranty not found', 404);
    }

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty retrieved successfully',
      data: warranty,
    });
  } catch (err: any) {
    console.error('❌ getWarrantyById error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve warranty');
  }
};

/**
 * ✏️ Update warranty (Admin only)
 */
export const updateWarranty = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyId } = req.params as any;
    const updateData = req.body as any;

    const warrantyRepo = req.server.db.getRepository(Warranty);
    
    // Check if warranty exists
    const existingWarranty = await warrantyRepo.findOneBy({ 
      id: warrantyId, 
      isDeleted: false 
    });
    
    if (!existingWarranty) {
      return Response.errorResponse(reply, 'Warranty not found', 404);
    }

    // Validate agent if being updated
    if (updateData.agentId) {
      const userRepo = req.server.db.getRepository(User);
      const agent = await userRepo.findOneBy({ 
        id: updateData.agentId, 
        role: 'AGENT', 
        isDeleted: false,
        accountStatus: 'Active'
      });
      if (!agent) {
        return Response.errorResponse(reply, 'Agent not found or inactive', 404);
      }
    }

    // Validate warranty terms if being updated
    if (updateData.warrantyTermsId) {
      const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
      const warrantyTerms = await warrantyTermsRepo.findOneBy({ 
        id: updateData.warrantyTermsId, 
        isActive: true, 
        isDeleted: false 
      });
      if (!warrantyTerms) {
        return Response.errorResponse(reply, 'Warranty terms not found or inactive', 404);
      }
    }

    // Convert date strings to Date objects if provided
    if (updateData.buildDate) {
      updateData.buildDate = new Date(updateData.buildDate);
    }
    if (updateData.dateInstalled) {
      updateData.dateInstalled = new Date(updateData.dateInstalled);
    }

    // Convert boolean fields
    if (updateData.corrosionFound !== undefined) {
      updateData.corrosionFound = Boolean(updateData.corrosionFound);
    }
    if (updateData.installationConfirmed !== undefined) {
      updateData.installationConfirmed = Boolean(updateData.installationConfirmed);
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await warrantyRepo.update(warrantyId, cleanUpdateData);

    // Fetch updated warranty with relations
    const updatedWarranty = await warrantyRepo.createQueryBuilder('warranty')
      .leftJoinAndSelect('warranty.agent', 'agent')
      .leftJoinAndSelect('warranty.warrantyTerms', 'warrantyTerms')
      .where('warranty.id = :id', { id: warrantyId })
      .getOne();

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty updated successfully',
      data: updatedWarranty,
    });
  } catch (err: any) {
    console.error('❌ updateWarranty error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to update warranty');
  }
};

/**
 * 🗑️ Delete warranty (Admin only)
 */
export const deleteWarranty = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyId } = req.params as any;

    const warrantyRepo = req.server.db.getRepository(Warranty);
    
    const warranty = await warrantyRepo.findOneBy({ 
      id: warrantyId, 
      isDeleted: false 
    });

    if (!warranty) {
      return Response.errorResponse(reply, 'Warranty not found', 404);
    }

    // Soft delete
    await warrantyRepo.update(warrantyId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty deleted successfully',
      data: { warrantyId },
    });
  } catch (err: any) {
    console.error('❌ deleteWarranty error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to delete warranty');
  }
};

/**
 * 🔄 Restore deleted warranty (Admin only)
 */
export const restoreWarranty = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyId } = req.params as any;

    const warrantyRepo = req.server.db.getRepository(Warranty);
    
    const warranty = await warrantyRepo.findOneBy({ 
      id: warrantyId, 
      isDeleted: true 
    });

    if (!warranty) {
      return Response.errorResponse(reply, 'Deleted warranty not found', 404);
    }

    // Restore warranty
    await warrantyRepo.update(warrantyId, {
      isDeleted: false,
      deletedAt: null
    });

    const restoredWarranty = await warrantyRepo.createQueryBuilder('warranty')
      .leftJoinAndSelect('warranty.agent', 'agent')
      .leftJoinAndSelect('warranty.warrantyTerms', 'warrantyTerms')
      .where('warranty.id = :id', { id: warrantyId })
      .getOne();

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty restored successfully',
      data: restoredWarranty,
    });
  } catch (err: any) {
    console.error('❌ restoreWarranty error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to restore warranty');
  }
};

/**
 * 📋 Get deleted warranties (Admin only)
 */
export const getDeletedWarranties = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = 1, limit = 10 } = req.query as any;

    const warrantyRepo = req.server.db.getRepository(Warranty);
    
    const queryBuilder = warrantyRepo.createQueryBuilder('warranty')
      .leftJoinAndSelect('warranty.agent', 'agent')
      .leftJoinAndSelect('warranty.warrantyTerms', 'warrantyTerms')
      .where('warranty.isDeleted = :isDeleted', { isDeleted: true });

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    
    // Order by deletion date
    queryBuilder.orderBy('warranty.deletedAt', 'DESC');

    const [warranties, total] = await queryBuilder.getManyAndCount();

    return reply.send({
      success: true,
      message: 'Deleted warranties retrieved successfully',
      data: warranties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('❌ getDeletedWarranties error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve deleted warranties');
  }
};

/**
 * 📋 Get corrosion warranties (Admin only)
 */
export const getCorrosionWarranties = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page = 1, limit = 10, agentId } = req.query as any;

    const warrantyRepo = req.server.db.getRepository(Warranty);
    
    const queryBuilder = warrantyRepo.createQueryBuilder('warranty')
      .leftJoinAndSelect('warranty.agent', 'agent')
      .leftJoinAndSelect('warranty.warrantyTerms', 'warrantyTerms')
      .where('warranty.isDeleted = :isDeleted AND warranty.corrosionFound = :corrosionFound', { 
        isDeleted: false,
        corrosionFound: true 
      });

    if (agentId) {
      queryBuilder.andWhere('warranty.agentId = :agentId', { agentId });
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    
    // Order by creation date
    queryBuilder.orderBy('warranty.created', 'DESC');

    const [warranties, total] = await queryBuilder.getManyAndCount();

    return reply.send({
      success: true,
      message: 'Corrosion warranties retrieved successfully',
      data: warranties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('❌ getCorrosionWarranties error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve corrosion warranties');
  }
};