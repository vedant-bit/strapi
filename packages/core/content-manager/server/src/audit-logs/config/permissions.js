'use strict';

/**
 * Audit Logs Permissions Configuration
 * Defines permissions for audit log access control
 */

const AUDIT_LOG_PERMISSIONS = {
  // Read audit logs permission
  'audit-logs.read': {
    displayName: 'Read Audit Logs',
    category: 'audit-logs',
    subCategory: 'general',
  },
  
  // Export audit logs permission
  'audit-logs.export': {
    displayName: 'Export Audit Logs',
    category: 'audit-logs',
    subCategory: 'general',
  },
  
  // Manage audit log settings permission
  'audit-logs.settings': {
    displayName: 'Manage Audit Log Settings',
    category: 'audit-logs',
    subCategory: 'settings',
  },
};

/**
 * Register audit log permissions with Strapi's permission system
 */
const registerAuditLogPermissions = async (strapi) => {
  const permissionService = strapi.admin.services.permission;
  
  // Register each permission
  for (const [action, config] of Object.entries(AUDIT_LOG_PERMISSIONS)) {
    try {
      await permissionService.actionProvider.register({
        section: 'plugins',
        displayName: config.displayName,
        uid: action,
        category: config.category,
        subCategory: config.subCategory,
      });
      
      strapi.log.debug(`Registered audit log permission: ${action}`);
    } catch (error) {
      strapi.log.error(`Failed to register audit log permission ${action}:`, error);
    }
  }
};

/**
 * Assign default permissions to Super Admin role
 */
const assignDefaultPermissions = async (strapi) => {
  try {
    const roleService = strapi.admin.services.role;
    const permissionService = strapi.admin.services.permission;
    
    // Find Super Admin role
    const superAdminRole = await roleService.getSuperAdmin();
    
    if (!superAdminRole) {
      strapi.log.warn('Super Admin role not found, skipping default audit log permissions assignment');
      return;
    }
    
    // Get all audit log permissions
    const auditLogPermissions = await permissionService.findMany({
      where: {
        action: {
          $in: Object.keys(AUDIT_LOG_PERMISSIONS),
        },
      },
    });
    
    // Assign permissions to Super Admin role
    if (auditLogPermissions.length > 0) {
      await permissionService.assign(superAdminRole.id, auditLogPermissions.map(p => p.id));
      strapi.log.info(`Assigned ${auditLogPermissions.length} audit log permissions to Super Admin role`);
    }
  } catch (error) {
    strapi.log.error('Failed to assign default audit log permissions:', error);
  }
};

/**
 * Check if user has specific audit log permission
 */
const hasAuditLogPermission = async (user, action) => {
  if (!user || !action) {
    return false;
  }
  
  try {
    const permissionService = strapi.admin.services.permission;
    const userPermissions = await permissionService.findUserPermissions(user);
    
    return userPermissions.some(permission => permission.action === action);
  } catch (error) {
    strapi.log.error('Error checking audit log permission:', error);
    return false;
  }
};

module.exports = {
  AUDIT_LOG_PERMISSIONS,
  registerAuditLogPermissions,
  assignDefaultPermissions,
  hasAuditLogPermission,
};