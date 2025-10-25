'use strict';

const { differenceWith, isEqual, pick, omit } = require('lodash');

/**
 * Audit Logs Service
 * Handles audit log creation, retrieval, and management
 */
module.exports = ({ strapi }) => ({
  /**
   * Save an audit log entry
   * @param {Object} logData - The audit log data
   * @returns {Promise<Object>} The created audit log entry
   */
  async saveAuditLog(logData) {
    try {
      const auditLog = await strapi.db.query('plugin::audit-logs.audit-log').create({
        data: {
          ...logData,
          timestamp: new Date(),
        },
      });
      
      return auditLog;
    } catch (error) {
      strapi.log.error('Failed to save audit log:', error);
      // Don't throw error to avoid breaking the main operation
      return null;
    }
  },

  /**
   * Find audit logs with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated audit logs
   */
  async findAuditLogs(params = {}) {
    const { 
      contentType, 
      userId, 
      action, 
      dateRange,
      pagination = { page: 1, pageSize: 25 },
      sort = { timestamp: 'desc' }
    } = params;

    // Build where clause
    const where = {};
    
    if (contentType) {
      where.contentType = contentType;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (action) {
      where.action = action;
    }
    
    if (dateRange) {
      where.timestamp = {};
      if (dateRange.start) {
        where.timestamp.$gte = dateRange.start;
      }
      if (dateRange.end) {
        where.timestamp.$lte = dateRange.end;
      }
    }

    try {
      const { results, pagination: paginationInfo } = await strapi.db
        .query('plugin::audit-logs.audit-log')
        .findPage({
          where,
          orderBy: sort,
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

      return {
        results,
        pagination: paginationInfo,
      };
    } catch (error) {
      strapi.log.error('Failed to fetch audit logs:', error);
      throw error;
    }
  },

  /**
   * Find a single audit log by ID
   * @param {string|number} id - Audit log ID
   * @returns {Promise<Object|null>} The audit log entry
   */
  async findAuditLog(id) {
    try {
      return await strapi.db.query('plugin::audit-logs.audit-log').findOne({
        where: { id },
      });
    } catch (error) {
      strapi.log.error('Failed to fetch audit log:', error);
      throw error;
    }
  },

  /**
   * Delete expired audit logs
   * @param {Date} expirationDate - Date before which logs should be deleted
   * @returns {Promise<number>} Number of deleted entries
   */
  async deleteExpiredLogs(expirationDate) {
    try {
      const result = await strapi.db.query('plugin::audit-logs.audit-log').deleteMany({
        where: {
          timestamp: {
            $lt: expirationDate,
          },
        },
      });
      
      strapi.log.info(`Deleted ${result.count || 0} expired audit logs`);
      return result.count || 0;
    } catch (error) {
      strapi.log.error('Failed to delete expired audit logs:', error);
      throw error;
    }
  },

  /**
   * Calculate diff between old and new data
   * @param {Object} oldData - Previous data
   * @param {Object} newData - New data
   * @returns {Object} Object containing changed fields
   */
  calculateDiff(oldData, newData) {
    if (!oldData || !newData) {
      return {};
    }

    const changes = {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (!isEqual(oldValue, newValue)) {
        changes[key] = {
          from: oldValue,
          to: newValue,
        };
      }
    }

    return changes;
  },

  /**
   * Sanitize data for logging (remove sensitive fields)
   * @param {Object} data - Data to sanitize
   * @param {Array} sensitiveFields - Fields to exclude
   * @returns {Object} Sanitized data
   */
  sanitizeData(data, sensitiveFields = ['password', 'resetPasswordToken', 'confirmationToken']) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    return omit(data, sensitiveFields);
  },

  /**
   * Get user information from context
   * @returns {Object|null} User information
   */
  getCurrentUser() {
    const ctx = strapi.requestContext.get();
    if (!ctx || !ctx.state || !ctx.state.user) {
      return null;
    }

    const user = ctx.state.user;
    return {
      id: user.id,
      email: user.email || user.username || 'Unknown',
    };
  },

  /**
   * Check if content type should be audited
   * @param {string} uid - Content type UID
   * @returns {boolean} Whether to audit this content type
   */
  shouldAuditContentType(uid) {
    const config = strapi.config.get('plugin.audit-logs', {});
    
    // Skip if audit logging is disabled
    if (config.enabled === false) {
      return false;
    }

    // Skip internal Strapi content types
    if (uid.startsWith('strapi::') || uid.startsWith('admin::')) {
      return false;
    }

    // Skip the audit log content type itself
    if (uid === 'plugin::audit-logs.audit-log') {
      return false;
    }

    // Check excluded content types
    const excludeContentTypes = config.excludeContentTypes || [];
    if (excludeContentTypes.includes(uid)) {
      return false;
    }

    return true;
  },

  /**
   * Get audit log statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Statistics object
   */
  async getStats(filters = {}) {
    try {
      const where = {};
      
      if (filters.dateRange) {
        where.timestamp = {};
        if (filters.dateRange.start) {
          where.timestamp.$gte = new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          where.timestamp.$lte = new Date(filters.dateRange.end);
        }
      }

      const [totalLogs, actionStats, contentTypeStats] = await Promise.all([
        // Total count
        strapi.db.query('plugin::audit-logs.audit-log').count({ where }),
        
        // Count by action - using raw query since groupBy might not be available
        strapi.db.connection.raw(`
          SELECT action, COUNT(*) as count 
          FROM strapi_audit_logs 
          ${Object.keys(where).length > 0 ? 'WHERE ' + this._buildWhereClause(where) : ''}
          GROUP BY action
        `),
        
        // Count by content type
        strapi.db.connection.raw(`
          SELECT contentType, COUNT(*) as count 
          FROM strapi_audit_logs 
          ${Object.keys(where).length > 0 ? 'WHERE ' + this._buildWhereClause(where) : ''}
          GROUP BY contentType 
          ORDER BY count DESC 
          LIMIT 10
        `),
      ]);

      return {
        totalLogs,
        actionBreakdown: actionStats,
        topContentTypes: contentTypeStats,
      };
    } catch (error) {
      strapi.log.error('Failed to fetch audit log statistics:', error);
      throw error;
    }
  },

  /**
   * Helper method to build WHERE clause for raw queries
   * @private
   */
  _buildWhereClause(where) {
    const conditions = [];
    
    if (where.timestamp) {
      if (where.timestamp.$gte) {
        conditions.push(`timestamp >= '${where.timestamp.$gte.toISOString()}'`);
      }
      if (where.timestamp.$lte) {
        conditions.push(`timestamp <= '${where.timestamp.$lte.toISOString()}'`);
      }
    }
    
    return conditions.join(' AND ');
  },
});