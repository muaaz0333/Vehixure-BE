import { SystemConfigService } from "../services/system-config-service.js";
export class SystemConfigController {
  systemConfigService;
  constructor() {
    this.systemConfigService = new SystemConfigService();
  }
  /**
   * Get all system configuration entries
   */
  async getAllSystemConfig(request, reply) {
    try {
      const { category, isActive, page = "1", limit = "50" } = request.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const configs = await this.systemConfigService.getAllConfigs({
        category,
        isActive,
        skip,
        limit: parseInt(limit)
      });
      return reply.status(200).send({
        success: true,
        data: configs.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: configs.total,
          totalPages: Math.ceil(configs.total / parseInt(limit))
        }
      });
    } catch (error) {
      request.log.error("Error getting system config:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get system configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Get system configuration by category
   */
  async getConfigByCategory(request, reply) {
    try {
      const { category } = request.params;
      const configs = await this.systemConfigService.getCategoryConfig(category);
      return reply.status(200).send({
        success: true,
        data: configs
      });
    } catch (error) {
      request.log.error("Error getting config by category:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get configuration by category",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Get system configuration by ID
   */
  async getConfigById(request, reply) {
    try {
      const { configId } = request.params;
      const config = await this.systemConfigService.getConfigById(configId);
      if (!config) {
        return reply.status(404).send({
          success: false,
          message: "System configuration not found"
        });
      }
      return reply.status(200).send({
        success: true,
        data: config
      });
    } catch (error) {
      request.log.error("Error getting config by ID:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get system configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Create new system configuration entry
   */
  async createSystemConfig(request, reply) {
    try {
      const configData = request.body;
      if (!configData.configCategory || !configData.configKey || !configData.configName) {
        return reply.status(400).send({
          success: false,
          message: "Missing required fields: configCategory, configKey, configName"
        });
      }
      const config = await this.systemConfigService.createConfig(configData);
      return reply.status(201).send({
        success: true,
        data: config,
        message: "System configuration created successfully"
      });
    } catch (error) {
      request.log.error("Error creating system config:", error);
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return reply.status(409).send({
          success: false,
          message: "Configuration with this category and key already exists"
        });
      }
      return reply.status(500).send({
        success: false,
        message: "Failed to create system configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Update system configuration entry
   */
  async updateSystemConfig(request, reply) {
    try {
      const { configId } = request.params;
      const updateData = request.body;
      const config = await this.systemConfigService.updateConfig(configId, updateData);
      if (!config) {
        return reply.status(404).send({
          success: false,
          message: "System configuration not found"
        });
      }
      return reply.status(200).send({
        success: true,
        data: config,
        message: "System configuration updated successfully"
      });
    } catch (error) {
      request.log.error("Error updating system config:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update system configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Delete system configuration entry
   */
  async deleteSystemConfig(request, reply) {
    try {
      const { configId } = request.params;
      const deleted = await this.systemConfigService.deleteConfig(configId);
      if (!deleted) {
        return reply.status(404).send({
          success: false,
          message: "System configuration not found"
        });
      }
      return reply.status(200).send({
        success: true,
        message: "System configuration deleted successfully"
      });
    } catch (error) {
      request.log.error("Error deleting system config:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to delete system configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Toggle system configuration active status
   */
  async toggleConfigStatus(request, reply) {
    try {
      const { configId } = request.params;
      const { isActive } = request.body;
      const config = await this.systemConfigService.toggleStatus(configId, isActive);
      if (!config) {
        return reply.status(404).send({
          success: false,
          message: "System configuration not found"
        });
      }
      return reply.status(200).send({
        success: true,
        data: config,
        message: `System configuration ${isActive ? "activated" : "deactivated"} successfully`
      });
    } catch (error) {
      request.log.error("Error toggling config status:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to toggle system configuration status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Initialize system configuration with ERPS defaults
   */
  async initializeERPSDefaults(request, reply) {
    try {
      await this.systemConfigService.initializeERPSDefaults();
      return reply.status(200).send({
        success: true,
        message: "ERPS system configuration initialized successfully"
      });
    } catch (error) {
      request.log.error("Error initializing ERPS defaults:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to initialize ERPS system configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Get configuration categories summary
   */
  async getConfigSummary(request, reply) {
    try {
      const summary = await this.systemConfigService.getConfigSummary();
      return reply.status(200).send({
        success: true,
        data: summary
      });
    } catch (error) {
      request.log.error("Error getting config summary:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get configuration summary",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
