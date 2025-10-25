import type { Core } from '@strapi/types';
import auditLogContentType from './content-types/audit-log';

/**
 * Audit Logs Module
 * Provides automated audit logging for all content changes in Strapi
 */

/**
 * Register audit logging components
 */
const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  // Register the audit log content type
  strapi.container.get('content-types').add('api::audit-log', auditLogContentType);
  
  strapi.log.info('Audit logging content type registered');
};

/**
 * Bootstrap audit logging system
 */
const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const config = strapi.config.get('auditLog', {});
  
  // Skip if audit logging is disabled
  if (config.enabled === false) {
    strapi.log.info('Audit logging is disabled');
    return;
  }
  
  try {
    // Initialize lifecycle hooks
    const lifecycleService = strapi.service('api::audit-log.lifecycle');
    if (lifecycleService) {
      await lifecycleService.bootstrap();
    }
    
    strapi.log.info('Audit logging system initialized successfully');
    
    // Log configuration
    strapi.log.info('Audit logging configuration:', {
      enabled: config.enabled !== false,
      retentionDays: config.retentionDays || 90,
      excludeContentTypes: config.excludeContentTypes || [],
    });
    
  } catch (error) {
    strapi.log.error('Failed to initialize audit logging system:', error);
  }
};

/**
 * Destroy audit logging system
 */
const destroy = async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    const lifecycleService = strapi.service('api::audit-log.lifecycle');
    if (lifecycleService && lifecycleService.isInitialized()) {
      await lifecycleService.destroy();
    }
    
    strapi.log.info('Audit logging system destroyed');
  } catch (error) {
    strapi.log.error('Error destroying audit logging system:', error);
  }
};

export default {
  register,
  bootstrap,
  destroy,
};