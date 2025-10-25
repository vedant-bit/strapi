'use strict';

/**
 * Default Audit Logging Configuration
 */
module.exports = {
  auditLog: {
    // Enable/disable audit logging globally
    enabled: true,
    
    // Number of days to retain audit logs (default: 90 days)
    retentionDays: 90,
    
    // Content types to exclude from audit logging
    excludeContentTypes: [
      'strapi::core-store',
      'strapi::webhooks',
      'admin::permission',
      'admin::user',
      'admin::role',
      'admin::api-token',
      'admin::api-token-permission',
      'admin::transfer-token',
      'admin::transfer-token-permission',
      'plugin::upload.file',
      'plugin::upload.folder',
      'plugin::i18n.locale',
    ],
    
    // Fields to exclude from audit logging (sensitive data)
    excludeFields: [
      'password',
      'resetPasswordToken',
      'confirmationToken',
      'blocked',
      'preferedLanguage',
    ],
    
    // Enable/disable specific actions
    actions: {
      create: true,
      update: true,
      delete: true,
    },
    
    // Performance settings
    performance: {
      // Batch size for bulk operations
      batchSize: 100,
      
      // Enable async logging to avoid blocking main operations
      asyncLogging: true,
    },
  },
};