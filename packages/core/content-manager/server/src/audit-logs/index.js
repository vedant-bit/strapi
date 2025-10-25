'use strict';

const auditLogContentType = require('./content-types/audit-log');
const auditLogsService = require('./services/audit-logs');
const lifecycleService = require('./services/lifecycle');
const auditLogsController = require('./controllers/audit-logs');
const auditLogsRoutes = require('./routes/audit-logs');
const { 
  registerAuditLogPermissions, 
  assignDefaultPermissions 
} = require('./config/permissions');

/**
 * Audit Logs Module
 * Provides automated audit logging for all content changes in Strapi
 */
module.exports = {
  /**
   * Register audit logging components
   */
  async register(strapi) {
    // Register the audit log content type
    strapi.container.get('content-types').add('api::audit-log', auditLogContentType);
    
    // Register services
    strapi.container.get('services').add('api::audit-log.audit-logs', auditLogsService);
    strapi.container.get('services').add('api::audit-log.lifecycle', lifecycleService);
    
    // Register controller
    strapi.container.get('controllers').add('audit-logs', auditLogsController);
    
    // Register routes
    strapi.container.get('routes').add('audit-logs', auditLogsRoutes);
    
    // Register permissions
    await registerAuditLogPermissions(strapi);
    
    strapi.log.info('Audit logging components registered');
  },

  /**
   * Bootstrap audit logging system
   */
  async bootstrap(strapi) {
    const config = strapi.config.get('auditLog', {});
    
    // Skip if audit logging is disabled
    if (config.enabled === false) {
      strapi.log.info('Audit logging is disabled');
      return;
    }
    
    try {
      // Ensure audit log content type is properly registered
      const auditLogModel = strapi.getModel('api::audit-log.audit-log');
      if (!auditLogModel) {
        throw new Error('Audit log content type not found');
      }
      
      // Initialize lifecycle hooks
      const lifecycleService = strapi.service('api::audit-log.lifecycle');
      await lifecycleService.bootstrap();
      
      // Assign default permissions
      await assignDefaultPermissions(strapi);
      
      strapi.log.info('Audit logging system initialized successfully');
      
      // Log configuration
      strapi.log.info('Audit logging configuration:', {
        enabled: config.enabled !== false,
        retentionDays: config.retentionDays || 90,
        excludeContentTypes: config.excludeContentTypes || [],
      });
      
    } catch (error) {
      strapi.log.error('Failed to initialize audit logging system:', error);
      throw error;
    }
  },

  /**
   * Destroy audit logging system
   */
  async destroy(strapi) {
    try {
      const lifecycleService = strapi.service('api::audit-log.lifecycle');
      if (lifecycleService && lifecycleService.isInitialized()) {
        await lifecycleService.destroy();
      }
      
      strapi.log.info('Audit logging system destroyed');
    } catch (error) {
      strapi.log.error('Error destroying audit logging system:', error);
    }
  },

  /**
   * Get audit logging configuration
   */
  getConfig(strapi) {
    return strapi.config.get('auditLog', {
      enabled: true,
      retentionDays: 90,
      excludeContentTypes: [],
    });
  },

  /**
   * Check if audit logging is enabled
   */
  isEnabled(strapi) {
    const config = this.getConfig(strapi);
    return config.enabled !== false;
  },
};