import { FastifyRequest, FastifyReply } from 'fastify';
import { WarrantyTerms } from '../entities/WarrantyTerms.js';
import Response from '../Traits/ApiResponser.js';

/**
 * 📋 Create new warranty terms (Admin only)
 */
export const createWarrantyTerms = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const {
      warrantyName,
      description,
      revision,
      generatorLightColour,
      termsAndConditions,
      addType,
      warrantyToReplaceId,
      inspectionInstructions,
      isActive = true
    } = req.body as any;

    // Required fields validation
    const requiredFields = ['warrantyName', 'revision', 'addType'];
    
    const missingFields = requiredFields.filter(field => !(req.body as any)[field]);
    if (missingFields.length > 0) {
      return Response.errorResponse(reply, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    // Validate addType
    if (addType !== 'ADD_WARRANTY' && addType !== 'REPLACE_WARRANTY') {
      return Response.errorResponse(reply, 'addType must be either ADD_WARRANTY or REPLACE_WARRANTY', 400);
    }

    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);

    // If replacing warranty, validate the warranty to replace exists
    if (addType === 'REPLACE_WARRANTY') {
      if (!warrantyToReplaceId) {
        return Response.errorResponse(reply, 'warrantyToReplaceId is required when addType is REPLACE_WARRANTY', 400);
      }

      const warrantyToReplace = await warrantyTermsRepo.findOneBy({ 
        id: warrantyToReplaceId, 
        isDeleted: false 
      });
      
      if (!warrantyToReplace) {
        return Response.errorResponse(reply, 'Warranty to replace not found', 404);
      }
    }

    const warrantyTerms = warrantyTermsRepo.create({
      warrantyName,
      description,
      revision,
      generatorLightColour,
      termsAndConditions,
      addType,
      warrantyToReplaceId: addType === 'REPLACE_WARRANTY' ? warrantyToReplaceId : null,
      inspectionInstructions,
      isActive: Boolean(isActive)
    });

    await warrantyTermsRepo.save(warrantyTerms);

    // If this is a replacement warranty, deactivate the old one
    if (addType === 'REPLACE_WARRANTY' && warrantyToReplaceId) {
      await warrantyTermsRepo.update(warrantyToReplaceId, { 
        isActive: false 
      });
    }

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty terms created successfully',
      data: warrantyTerms,
    });
  } catch (err: any) {
    console.error('❌ createWarrantyTerms error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to create warranty terms');
  }
};

/**
 * 📋 Get all warranty terms (Admin only)
 */
export const getAllWarrantyTerms = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive,
      search 
    } = req.query as any;

    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    
    const queryBuilder = warrantyTermsRepo.createQueryBuilder('warrantyTerms')
      .leftJoinAndSelect('warrantyTerms.warrantyToReplace', 'warrantyToReplace')
      .where('warrantyTerms.isDeleted = :isDeleted', { isDeleted: false });

    // Apply filters
    if (isActive !== undefined) {
      queryBuilder.andWhere('warrantyTerms.isActive = :isActive', { 
        isActive: Boolean(isActive) 
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(warrantyTerms.warrantyName ILIKE :search OR warrantyTerms.revision ILIKE :search OR warrantyTerms.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    
    // Order by creation date
    queryBuilder.orderBy('warrantyTerms.created', 'DESC');

    const [warrantyTerms, total] = await queryBuilder.getManyAndCount();

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty terms retrieved successfully',
      data: warrantyTerms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('❌ getAllWarrantyTerms error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve warranty terms');
  }
};

/**
 * 📋 Get active warranty terms for dropdown (Admin only)
 */
export const getActiveWarrantyTerms = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    
    const warrantyTerms = await warrantyTermsRepo.find({
      where: { 
        isActive: true, 
        isDeleted: false 
      },
      order: { 
        warrantyName: 'ASC' 
      }
    });

    return Response.showOne(reply, {
      success: true,
      message: 'Active warranty terms retrieved successfully',
      data: warrantyTerms,
    });
  } catch (err: any) {
    console.error('❌ getActiveWarrantyTerms error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve active warranty terms');
  }
};

/**
 * 📋 Get warranty terms by ID (Admin only)
 */
export const getWarrantyTermsById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyTermsId } = req.params as any;

    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    
    const warrantyTerms = await warrantyTermsRepo.findOneBy({ 
      id: warrantyTermsId, 
      isDeleted: false 
    });

    if (!warrantyTerms) {
      return Response.errorResponse(reply, 'Warranty terms not found', 404);
    }

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty terms retrieved successfully',
      data: warrantyTerms,
    });
  } catch (err: any) {
    console.error('❌ getWarrantyTermsById error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve warranty terms');
  }
};

/**
 * ✏️ Update warranty terms (Admin only)
 */
export const updateWarrantyTerms = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyTermsId } = req.params as any;
    const updateData = req.body as any;

    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    
    // Check if warranty terms exist
    const existingWarrantyTerms = await warrantyTermsRepo.findOneBy({ 
      id: warrantyTermsId, 
      isDeleted: false 
    });
    
    if (!existingWarrantyTerms) {
      return Response.errorResponse(reply, 'Warranty terms not found', 404);
    }

    // Validate addType if being updated
    if (updateData.addType && updateData.addType !== 'ADD_WARRANTY' && updateData.addType !== 'REPLACE_WARRANTY') {
      return Response.errorResponse(reply, 'addType must be either ADD_WARRANTY or REPLACE_WARRANTY', 400);
    }

    // If changing to REPLACE_WARRANTY, validate warrantyToReplaceId
    if (updateData.addType === 'REPLACE_WARRANTY' && !updateData.warrantyToReplaceId) {
      return Response.errorResponse(reply, 'warrantyToReplaceId is required when addType is REPLACE_WARRANTY', 400);
    }

    // Validate warranty to replace exists if provided
    if (updateData.warrantyToReplaceId) {
      const warrantyToReplace = await warrantyTermsRepo.findOneBy({ 
        id: updateData.warrantyToReplaceId, 
        isDeleted: false 
      });
      
      if (!warrantyToReplace) {
        return Response.errorResponse(reply, 'Warranty to replace not found', 404);
      }
    }

    // Convert boolean fields
    if (updateData.isActive !== undefined) {
      updateData.isActive = Boolean(updateData.isActive);
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await warrantyTermsRepo.update(warrantyTermsId, cleanUpdateData);

    const updatedWarrantyTerms = await warrantyTermsRepo.createQueryBuilder('warrantyTerms')
      .leftJoinAndSelect('warrantyTerms.warrantyToReplace', 'warrantyToReplace')
      .where('warrantyTerms.id = :id', { id: warrantyTermsId })
      .getOne();

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty terms updated successfully',
      data: updatedWarrantyTerms,
    });
  } catch (err: any) {
    console.error('❌ updateWarrantyTerms error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to update warranty terms');
  }
};

/**
 * 🗑️ Delete warranty terms (Admin only)
 */
export const deleteWarrantyTerms = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyTermsId } = req.params as any;

    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    
    const warrantyTerms = await warrantyTermsRepo.findOneBy({ 
      id: warrantyTermsId, 
      isDeleted: false 
    });

    if (!warrantyTerms) {
      return Response.errorResponse(reply, 'Warranty terms not found', 404);
    }

    // Check if warranty terms are being used by any warranties
    const warrantyRepo = req.server.db.getRepository('Warranty');
    const warrantyCount = await warrantyRepo.count({
      where: { 
        warrantyTermsId: warrantyTermsId, 
        isDeleted: false 
      }
    });

    if (warrantyCount > 0) {
      return Response.errorResponse(reply, 'Cannot delete warranty terms that are being used by existing warranties', 400);
    }

    // Soft delete
    await warrantyTermsRepo.update(warrantyTermsId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty terms deleted successfully',
      data: { warrantyTermsId },
    });
  } catch (err: any) {
    console.error('❌ deleteWarrantyTerms error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to delete warranty terms');
  }
};

/**
 * 🔄 Toggle warranty terms active status (Admin only)
 */
export const toggleWarrantyTermsStatus = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { warrantyTermsId } = req.params as any;
    const { isActive } = req.body as any;

    if (typeof isActive !== 'boolean') {
      return Response.errorResponse(reply, 'isActive must be a boolean value', 400);
    }

    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    
    const warrantyTerms = await warrantyTermsRepo.findOneBy({ 
      id: warrantyTermsId, 
      isDeleted: false 
    });

    if (!warrantyTerms) {
      return Response.errorResponse(reply, 'Warranty terms not found', 404);
    }

    await warrantyTermsRepo.update(warrantyTermsId, { isActive });

    const updatedWarrantyTerms = await warrantyTermsRepo.findOneBy({ 
      id: warrantyTermsId 
    });

    return Response.showOne(reply, {
      success: true,
      message: `Warranty terms ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedWarrantyTerms,
    });
  } catch (err: any) {
    console.error('❌ toggleWarrantyTermsStatus error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to update warranty terms status');
  }
};
/**
 * 📋 Get warranty terms for replacement dropdown (Admin only)
 */
export const getWarrantyTermsForReplacement = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    
    // Get all warranty terms that can be replaced (active ones)
    const warrantyTerms = await warrantyTermsRepo.find({
      where: { 
        isActive: true, 
        isDeleted: false 
      },
      select: ['id', 'warrantyName', 'revision'],
      order: { 
        warrantyName: 'ASC' 
      }
    });

    // Format for dropdown with "None" option first
    const formattedOptions = [
      { id: null, name: 'None', value: 'none' },
      ...warrantyTerms.map(term => ({
        id: term.id,
        name: `${term.warrantyName} - ${term.revision}`,
        value: term.id
      }))
    ];

    return Response.showOne(reply, {
      success: true,
      message: 'Warranty terms for replacement retrieved successfully',
      data: formattedOptions,
    });
  } catch (err: any) {
    console.error('❌ getWarrantyTermsForReplacement error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve warranty terms for replacement');
  }
};