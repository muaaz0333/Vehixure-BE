import { Warranty } from "../entities/Warranty.js";
import { WarrantyTerms } from "../entities/WarrantyTerms.js";
import { User } from "../entities/User.js";
import Response from "../Traits/ApiResponser.js";
export const createWarranty = async (req, reply) => {
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
      status = "DRAFT"
    } = req.body;
    const requiredFields = [
      "agentId",
      "warrantyTermsId",
      "firstName",
      "lastName",
      "phoneNumber",
      "email",
      "make",
      "model",
      "buildDate",
      "vinNumber",
      "installersName",
      "dateInstalled",
      "generatorSerialNumber"
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return Response.errorResponse(reply, `Missing required fields: ${missingFields.join(", ")}`, 400);
    }
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const userRepo = req.server.db.getRepository(User);
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const agent = await userRepo.findOneBy({
      id: agentId,
      role: "AGENT",
      isDeleted: false,
      accountStatus: "Active"
    });
    if (!agent) {
      return Response.errorResponse(reply, "Agent not found or inactive", 404);
    }
    const warrantyTerms = await warrantyTermsRepo.findOneBy({
      id: warrantyTermsId,
      isActive: true,
      isDeleted: false
    });
    if (!warrantyTerms) {
      return Response.errorResponse(reply, "Warranty terms not found or inactive", 404);
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
      message: "Warranty created successfully",
      data: warranty
    });
  } catch (err) {
    console.error("\u274C createWarranty error:", err);
    return Response.errorResponse(reply, err.message || "Failed to create warranty");
  }
};
export const getAllWarranties = async (req, reply) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      agentId,
      corrosionFound,
      search
    } = req.query;
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const queryBuilder = warrantyRepo.createQueryBuilder("warranty").leftJoinAndSelect("warranty.agent", "agent").leftJoinAndSelect("warranty.warrantyTerms", "warrantyTerms").where("warranty.isDeleted = :isDeleted", { isDeleted: false });
    if (status) {
      queryBuilder.andWhere("warranty.status = :status", { status });
    }
    if (agentId) {
      queryBuilder.andWhere("warranty.agentId = :agentId", { agentId });
    }
    if (corrosionFound !== void 0) {
      queryBuilder.andWhere("warranty.corrosionFound = :corrosionFound", {
        corrosionFound: Boolean(corrosionFound)
      });
    }
    if (search) {
      queryBuilder.andWhere(
        "(warranty.firstName ILIKE :search OR warranty.lastName ILIKE :search OR warranty.email ILIKE :search OR warranty.vinNumber ILIKE :search OR warranty.refStockId ILIKE :search)",
        { search: `%${search}%` }
      );
    }
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy("warranty.created", "DESC");
    const [warranties, total] = await queryBuilder.getManyAndCount();
    return reply.send({
      success: true,
      message: "Warranties retrieved successfully",
      data: warranties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("\u274C getAllWarranties error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve warranties");
  }
};
export const getWarrantyById = async (req, reply) => {
  try {
    const { warrantyId } = req.params;
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const warranty = await warrantyRepo.createQueryBuilder("warranty").leftJoinAndSelect("warranty.agent", "agent").leftJoinAndSelect("warranty.warrantyTerms", "warrantyTerms").where("warranty.id = :id AND warranty.isDeleted = :isDeleted", {
      id: warrantyId,
      isDeleted: false
    }).getOne();
    if (!warranty) {
      return Response.errorResponse(reply, "Warranty not found", 404);
    }
    return Response.showOne(reply, {
      success: true,
      message: "Warranty retrieved successfully",
      data: warranty
    });
  } catch (err) {
    console.error("\u274C getWarrantyById error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve warranty");
  }
};
export const updateWarranty = async (req, reply) => {
  try {
    const { warrantyId } = req.params;
    const updateData = req.body;
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const existingWarranty = await warrantyRepo.findOneBy({
      id: warrantyId,
      isDeleted: false
    });
    if (!existingWarranty) {
      return Response.errorResponse(reply, "Warranty not found", 404);
    }
    if (updateData.agentId) {
      const userRepo = req.server.db.getRepository(User);
      const agent = await userRepo.findOneBy({
        id: updateData.agentId,
        role: "AGENT",
        isDeleted: false,
        accountStatus: "Active"
      });
      if (!agent) {
        return Response.errorResponse(reply, "Agent not found or inactive", 404);
      }
    }
    if (updateData.warrantyTermsId) {
      const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
      const warrantyTerms = await warrantyTermsRepo.findOneBy({
        id: updateData.warrantyTermsId,
        isActive: true,
        isDeleted: false
      });
      if (!warrantyTerms) {
        return Response.errorResponse(reply, "Warranty terms not found or inactive", 404);
      }
    }
    if (updateData.buildDate) {
      updateData.buildDate = new Date(updateData.buildDate);
    }
    if (updateData.dateInstalled) {
      updateData.dateInstalled = new Date(updateData.dateInstalled);
    }
    if (updateData.corrosionFound !== void 0) {
      updateData.corrosionFound = Boolean(updateData.corrosionFound);
    }
    if (updateData.installationConfirmed !== void 0) {
      updateData.installationConfirmed = Boolean(updateData.installationConfirmed);
    }
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== void 0)
    );
    await warrantyRepo.update(warrantyId, cleanUpdateData);
    const updatedWarranty = await warrantyRepo.createQueryBuilder("warranty").leftJoinAndSelect("warranty.agent", "agent").leftJoinAndSelect("warranty.warrantyTerms", "warrantyTerms").where("warranty.id = :id", { id: warrantyId }).getOne();
    return Response.showOne(reply, {
      success: true,
      message: "Warranty updated successfully",
      data: updatedWarranty
    });
  } catch (err) {
    console.error("\u274C updateWarranty error:", err);
    return Response.errorResponse(reply, err.message || "Failed to update warranty");
  }
};
export const deleteWarranty = async (req, reply) => {
  try {
    const { warrantyId } = req.params;
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const warranty = await warrantyRepo.findOneBy({
      id: warrantyId,
      isDeleted: false
    });
    if (!warranty) {
      return Response.errorResponse(reply, "Warranty not found", 404);
    }
    await warrantyRepo.update(warrantyId, {
      isDeleted: true,
      deletedAt: /* @__PURE__ */ new Date()
    });
    return Response.showOne(reply, {
      success: true,
      message: "Warranty deleted successfully",
      data: { warrantyId }
    });
  } catch (err) {
    console.error("\u274C deleteWarranty error:", err);
    return Response.errorResponse(reply, err.message || "Failed to delete warranty");
  }
};
export const restoreWarranty = async (req, reply) => {
  try {
    const { warrantyId } = req.params;
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const warranty = await warrantyRepo.findOneBy({
      id: warrantyId,
      isDeleted: true
    });
    if (!warranty) {
      return Response.errorResponse(reply, "Deleted warranty not found", 404);
    }
    await warrantyRepo.update(warrantyId, {
      isDeleted: false,
      deletedAt: null
    });
    const restoredWarranty = await warrantyRepo.createQueryBuilder("warranty").leftJoinAndSelect("warranty.agent", "agent").leftJoinAndSelect("warranty.warrantyTerms", "warrantyTerms").where("warranty.id = :id", { id: warrantyId }).getOne();
    return Response.showOne(reply, {
      success: true,
      message: "Warranty restored successfully",
      data: restoredWarranty
    });
  } catch (err) {
    console.error("\u274C restoreWarranty error:", err);
    return Response.errorResponse(reply, err.message || "Failed to restore warranty");
  }
};
export const getDeletedWarranties = async (req, reply) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const queryBuilder = warrantyRepo.createQueryBuilder("warranty").leftJoinAndSelect("warranty.agent", "agent").leftJoinAndSelect("warranty.warrantyTerms", "warrantyTerms").where("warranty.isDeleted = :isDeleted", { isDeleted: true });
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy("warranty.deletedAt", "DESC");
    const [warranties, total] = await queryBuilder.getManyAndCount();
    return reply.send({
      success: true,
      message: "Deleted warranties retrieved successfully",
      data: warranties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("\u274C getDeletedWarranties error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve deleted warranties");
  }
};
export const getCorrosionWarranties = async (req, reply) => {
  try {
    const { page = 1, limit = 10, agentId } = req.query;
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const queryBuilder = warrantyRepo.createQueryBuilder("warranty").leftJoinAndSelect("warranty.agent", "agent").leftJoinAndSelect("warranty.warrantyTerms", "warrantyTerms").where("warranty.isDeleted = :isDeleted AND warranty.corrosionFound = :corrosionFound", {
      isDeleted: false,
      corrosionFound: true
    });
    if (agentId) {
      queryBuilder.andWhere("warranty.agentId = :agentId", { agentId });
    }
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy("warranty.created", "DESC");
    const [warranties, total] = await queryBuilder.getManyAndCount();
    return reply.send({
      success: true,
      message: "Corrosion warranties retrieved successfully",
      data: warranties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("\u274C getCorrosionWarranties error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve corrosion warranties");
  }
};
