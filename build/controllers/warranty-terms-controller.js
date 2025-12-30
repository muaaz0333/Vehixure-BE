import { WarrantyTerms } from "../entities/WarrantyTerms.js";
import Response from "../Traits/ApiResponser.js";
export const createWarrantyTerms = async (req, reply) => {
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
    } = req.body;
    const requiredFields = ["warrantyName", "revision", "addType"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return Response.errorResponse(reply, `Missing required fields: ${missingFields.join(", ")}`, 400);
    }
    if (addType !== "ADD_WARRANTY" && addType !== "REPLACE_WARRANTY") {
      return Response.errorResponse(reply, "addType must be either ADD_WARRANTY or REPLACE_WARRANTY", 400);
    }
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    if (addType === "REPLACE_WARRANTY") {
      if (!warrantyToReplaceId) {
        return Response.errorResponse(reply, "warrantyToReplaceId is required when addType is REPLACE_WARRANTY", 400);
      }
      const warrantyToReplace = await warrantyTermsRepo.findOneBy({
        id: warrantyToReplaceId,
        isDeleted: false
      });
      if (!warrantyToReplace) {
        return Response.errorResponse(reply, "Warranty to replace not found", 404);
      }
    }
    const warrantyTerms = warrantyTermsRepo.create({
      warrantyName,
      description,
      revision,
      generatorLightColour,
      termsAndConditions,
      addType,
      warrantyToReplaceId: addType === "REPLACE_WARRANTY" ? warrantyToReplaceId : null,
      inspectionInstructions,
      isActive: Boolean(isActive)
    });
    await warrantyTermsRepo.save(warrantyTerms);
    if (addType === "REPLACE_WARRANTY" && warrantyToReplaceId) {
      await warrantyTermsRepo.update(warrantyToReplaceId, {
        isActive: false
      });
    }
    return Response.showOne(reply, {
      success: true,
      message: "Warranty terms created successfully",
      data: warrantyTerms
    });
  } catch (err) {
    console.error("\u274C createWarrantyTerms error:", err);
    return Response.errorResponse(reply, err.message || "Failed to create warranty terms");
  }
};
export const getAllWarrantyTerms = async (req, reply) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      search
    } = req.query;
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const queryBuilder = warrantyTermsRepo.createQueryBuilder("warrantyTerms").leftJoinAndSelect("warrantyTerms.warrantyToReplace", "warrantyToReplace").where("warrantyTerms.isDeleted = :isDeleted", { isDeleted: false });
    if (isActive !== void 0) {
      queryBuilder.andWhere("warrantyTerms.isActive = :isActive", {
        isActive: Boolean(isActive)
      });
    }
    if (search) {
      queryBuilder.andWhere(
        "(warrantyTerms.warrantyName ILIKE :search OR warrantyTerms.revision ILIKE :search OR warrantyTerms.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy("warrantyTerms.created", "DESC");
    const [warrantyTerms, total] = await queryBuilder.getManyAndCount();
    return Response.showOne(reply, {
      success: true,
      message: "Warranty terms retrieved successfully",
      data: warrantyTerms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("\u274C getAllWarrantyTerms error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve warranty terms");
  }
};
export const getActiveWarrantyTerms = async (req, reply) => {
  try {
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const warrantyTerms = await warrantyTermsRepo.find({
      where: {
        isActive: true,
        isDeleted: false
      },
      order: {
        warrantyName: "ASC"
      }
    });
    return Response.showOne(reply, {
      success: true,
      message: "Active warranty terms retrieved successfully",
      data: warrantyTerms
    });
  } catch (err) {
    console.error("\u274C getActiveWarrantyTerms error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve active warranty terms");
  }
};
export const getWarrantyTermsById = async (req, reply) => {
  try {
    const { warrantyTermsId } = req.params;
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const warrantyTerms = await warrantyTermsRepo.findOneBy({
      id: warrantyTermsId,
      isDeleted: false
    });
    if (!warrantyTerms) {
      return Response.errorResponse(reply, "Warranty terms not found", 404);
    }
    return Response.showOne(reply, {
      success: true,
      message: "Warranty terms retrieved successfully",
      data: warrantyTerms
    });
  } catch (err) {
    console.error("\u274C getWarrantyTermsById error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve warranty terms");
  }
};
export const updateWarrantyTerms = async (req, reply) => {
  try {
    const { warrantyTermsId } = req.params;
    const updateData = req.body;
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const existingWarrantyTerms = await warrantyTermsRepo.findOneBy({
      id: warrantyTermsId,
      isDeleted: false
    });
    if (!existingWarrantyTerms) {
      return Response.errorResponse(reply, "Warranty terms not found", 404);
    }
    if (updateData.addType && updateData.addType !== "ADD_WARRANTY" && updateData.addType !== "REPLACE_WARRANTY") {
      return Response.errorResponse(reply, "addType must be either ADD_WARRANTY or REPLACE_WARRANTY", 400);
    }
    if (updateData.addType === "REPLACE_WARRANTY" && !updateData.warrantyToReplaceId) {
      return Response.errorResponse(reply, "warrantyToReplaceId is required when addType is REPLACE_WARRANTY", 400);
    }
    if (updateData.warrantyToReplaceId) {
      const warrantyToReplace = await warrantyTermsRepo.findOneBy({
        id: updateData.warrantyToReplaceId,
        isDeleted: false
      });
      if (!warrantyToReplace) {
        return Response.errorResponse(reply, "Warranty to replace not found", 404);
      }
    }
    if (updateData.isActive !== void 0) {
      updateData.isActive = Boolean(updateData.isActive);
    }
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== void 0)
    );
    await warrantyTermsRepo.update(warrantyTermsId, cleanUpdateData);
    const updatedWarrantyTerms = await warrantyTermsRepo.createQueryBuilder("warrantyTerms").leftJoinAndSelect("warrantyTerms.warrantyToReplace", "warrantyToReplace").where("warrantyTerms.id = :id", { id: warrantyTermsId }).getOne();
    return Response.showOne(reply, {
      success: true,
      message: "Warranty terms updated successfully",
      data: updatedWarrantyTerms
    });
  } catch (err) {
    console.error("\u274C updateWarrantyTerms error:", err);
    return Response.errorResponse(reply, err.message || "Failed to update warranty terms");
  }
};
export const deleteWarrantyTerms = async (req, reply) => {
  try {
    const { warrantyTermsId } = req.params;
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const warrantyTerms = await warrantyTermsRepo.findOneBy({
      id: warrantyTermsId,
      isDeleted: false
    });
    if (!warrantyTerms) {
      return Response.errorResponse(reply, "Warranty terms not found", 404);
    }
    const warrantyRepo = req.server.db.getRepository("Warranty");
    const warrantyCount = await warrantyRepo.count({
      where: {
        warrantyTermsId,
        isDeleted: false
      }
    });
    if (warrantyCount > 0) {
      return Response.errorResponse(reply, "Cannot delete warranty terms that are being used by existing warranties", 400);
    }
    await warrantyTermsRepo.update(warrantyTermsId, {
      isDeleted: true,
      deletedAt: /* @__PURE__ */ new Date()
    });
    return Response.showOne(reply, {
      success: true,
      message: "Warranty terms deleted successfully",
      data: { warrantyTermsId }
    });
  } catch (err) {
    console.error("\u274C deleteWarrantyTerms error:", err);
    return Response.errorResponse(reply, err.message || "Failed to delete warranty terms");
  }
};
export const toggleWarrantyTermsStatus = async (req, reply) => {
  try {
    const { warrantyTermsId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return Response.errorResponse(reply, "isActive must be a boolean value", 400);
    }
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const warrantyTerms = await warrantyTermsRepo.findOneBy({
      id: warrantyTermsId,
      isDeleted: false
    });
    if (!warrantyTerms) {
      return Response.errorResponse(reply, "Warranty terms not found", 404);
    }
    await warrantyTermsRepo.update(warrantyTermsId, { isActive });
    const updatedWarrantyTerms = await warrantyTermsRepo.findOneBy({
      id: warrantyTermsId
    });
    return Response.showOne(reply, {
      success: true,
      message: `Warranty terms ${isActive ? "activated" : "deactivated"} successfully`,
      data: updatedWarrantyTerms
    });
  } catch (err) {
    console.error("\u274C toggleWarrantyTermsStatus error:", err);
    return Response.errorResponse(reply, err.message || "Failed to update warranty terms status");
  }
};
export const getWarrantyTermsForReplacement = async (req, reply) => {
  try {
    const warrantyTermsRepo = req.server.db.getRepository(WarrantyTerms);
    const warrantyTerms = await warrantyTermsRepo.find({
      where: {
        isActive: true,
        isDeleted: false
      },
      select: ["id", "warrantyName", "revision"],
      order: {
        warrantyName: "ASC"
      }
    });
    const formattedOptions = [
      { id: null, name: "None", value: "none" },
      ...warrantyTerms.map((term) => ({
        id: term.id,
        name: `${term.warrantyName} - ${term.revision}`,
        value: term.id
      }))
    ];
    return Response.showOne(reply, {
      success: true,
      message: "Warranty terms for replacement retrieved successfully",
      data: formattedOptions
    });
  } catch (err) {
    console.error("\u274C getWarrantyTermsForReplacement error:", err);
    return Response.errorResponse(reply, err.message || "Failed to retrieve warranty terms for replacement");
  }
};
