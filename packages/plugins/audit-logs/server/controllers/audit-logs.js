'use strict';

/**
 * Audit Logs Controller
 * Handles REST API endpoints for audit log retrieval
 */
module.exports = {
  /**
   * Find audit logs with filtering and pagination
   * GET /audit-logs
   */
  async find(ctx) {
    try {
      await strapi.admin.services.permission.check(ctx.state.userAbility, {
        action: 'plugin::audit-logs.read',
        subject: null,
      });

      const auditLogsService = strapi.plugin('audit-logs').service('audit-logs');
      
      const result = await auditLogsService.findAuditLogs(ctx.query);

      ctx.body = {
        data: result.results,
        meta: {
          pagination: result.pagination,
        },
      };
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return ctx.forbidden('Insufficient permissions to access audit logs');
      }
      
      strapi.log.error('Error fetching audit logs:', error);
      ctx.internalServerError('Failed to fetch audit logs');
    }
  },

  /**
   * Find a single audit log by ID
   * GET /audit-logs/:id
   */
  async findOne(ctx) {
    try {
      await strapi.admin.services.permission.check(ctx.state.userAbility, {
        action: 'plugin::audit-logs.read',
        subject: null,
      });
      
      const auditLogsService = strapi.plugin('audit-logs').service('audit-logs');
      const auditLog = await auditLogsService.findAuditLog(ctx.params.id);
      
      if (!auditLog) {
        return ctx.notFound('Audit log not found');
      }

      ctx.body = {
        data: auditLog,
      };
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return ctx.forbidden('Insufficient permissions to access audit logs');
      }
      
      strapi.log.error('Error fetching audit log:', error);
      ctx.internalServerError('Failed to fetch audit log');
    }
  },

  /**
   * Get audit log statistics
   * GET /audit-logs/stats
   */
  async getStats(ctx) {
    try {
      await strapi.admin.services.permission.check(ctx.state.userAbility, {
        action: 'plugin::audit-logs.read',
        subject: null,
      });
      
      const auditLogsService = strapi.plugin('audit-logs').service('audit-logs');
      const stats = await auditLogsService.getStats(ctx.query);

      ctx.body = {
        data: stats,
      };
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return ctx.forbidden('Insufficient permissions to access audit logs');
      }
      
      strapi.log.error('Error fetching audit log statistics:', error);
      ctx.internalServerError('Failed to fetch audit log statistics');
    }
  },
};