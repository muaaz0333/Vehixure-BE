import { AnnualInspectionController } from "../controllers/annual-inspection-controller.js";
const inspectionController = new AnnualInspectionController();
export default async function annualInspectionRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.post("/inspections", {
    schema: {
      description: "Create a new annual inspection",
      tags: ["Annual Inspection"],
      body: {
        type: "object",
        required: [
          "warrantyId",
          "inspectorId",
          "inspectionDate",
          "generatorMountedCorrectly",
          "redLightIlluminated",
          "couplersSecureSealed",
          "ownerAdvisedPaintDamage",
          "ownerUnderstandsOperation",
          "corrosionFound"
        ],
        properties: {
          warrantyId: { type: "string", format: "uuid" },
          inspectorId: { type: "string", format: "uuid" },
          inspectionDate: { type: "string", format: "date" },
          // Inspection checklist
          generatorMountedCorrectly: { type: "boolean" },
          redLightIlluminated: { type: "boolean" },
          couplersSecureSealed: { type: "boolean" },
          // Corrosion inspection areas
          roofTurretCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          roofTurretNotes: { type: "string" },
          pillarsCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          pillarsNotes: { type: "string" },
          sillsCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          sillsNotes: { type: "string" },
          guardsLfCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          guardsLfNotes: { type: "string" },
          guardsRfCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          guardsRfNotes: { type: "string" },
          guardsLrCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          guardsLrNotes: { type: "string" },
          guardsRrCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          guardsRrNotes: { type: "string" },
          innerGuardsCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          innerGuardsNotes: { type: "string" },
          underBonnetCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          underBonnetNotes: { type: "string" },
          firewallCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          firewallNotes: { type: "string" },
          bootWaterIngressCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          bootWaterIngressNotes: { type: "string" },
          underbodySeamsCondition: { type: "string", enum: ["PASS", "ISSUE"] },
          underbodySeamsNotes: { type: "string" },
          // Additional checks
          ownerAdvisedPaintDamage: { type: "boolean" },
          ownerUnderstandsOperation: { type: "boolean" },
          // Corrosion declaration
          corrosionFound: { type: "boolean" },
          corrosionDetails: { type: "string" },
          // Photos
          photos: {
            type: "array",
            items: {
              type: "object",
              required: ["photoGroup", "photoUrl"],
              properties: {
                photoGroup: {
                  type: "string",
                  enum: ["GENERATOR_RED_LIGHT", "COUPLERS", "CORROSION", "CLEAR_BODY"]
                },
                photoUrl: { type: "string" },
                photoDescription: { type: "string" }
              }
            }
          }
        }
      }
    }
  }, inspectionController.createInspection.bind(inspectionController));
  fastify.post("/inspections/:id/submit", {
    schema: {
      description: "Submit inspection for inspector verification",
      tags: ["Annual Inspection"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    }
  }, inspectionController.submitInspection.bind(inspectionController));
  fastify.get("/inspections/:id/validate", {
    schema: {
      description: "Check if inspection is ready for submission",
      tags: ["Annual Inspection"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            isReadyForSubmission: { type: "boolean" },
            validation: {
              type: "object",
              properties: {
                photos: {
                  type: "object",
                  properties: {
                    current: { type: "integer" },
                    required: { type: "integer" },
                    missing: { type: "integer" },
                    valid: { type: "boolean" }
                  }
                }
              }
            },
            message: { type: "string" },
            requiredPhotos: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      }
    }
  }, inspectionController.validateInspectionForSubmission.bind(inspectionController));
  fastify.get("/inspections/:id", {
    schema: {
      description: "Get annual inspection details",
      tags: ["Annual Inspection"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    }
  }, inspectionController.getInspection.bind(inspectionController));
  fastify.get("/inspections", {
    schema: {
      description: "List annual inspections for current user",
      tags: ["Annual Inspection"]
    }
  }, inspectionController.listInspections.bind(inspectionController));
  fastify.get("/warranties/:warrantyId/inspections", {
    schema: {
      description: "Get inspection history for a warranty",
      tags: ["Annual Inspection"],
      params: {
        type: "object",
        required: ["warrantyId"],
        properties: {
          warrantyId: { type: "string", format: "uuid" }
        }
      }
    }
  }, inspectionController.getWarrantyInspectionHistory.bind(inspectionController));
}
