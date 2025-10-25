'use strict';

const { ValidationError } = require('@strapi/utils').errors;
const { yup, validateYupSchema } = require('@strapi/utils');

/**
 * Audit Logs Controller
 * Handles REST API endpoints for audit log retrieval
 */

// Validation schemas
const findAuditLogsSchema = yup.object({
  contentType: yup.string(),
  userId: yup.number().integer().positive(),
  action: yup.string().oneOf(['create', 'update', 'delete']),
  dateRange: yup.object({
    start: yup.date(),
    end: yup.date(),
  }),
  page: yup.number().integer().positive().default(1),
  pageSize: yup.number().integer().positive().max(100).default(25),
  sort: yup.object({
    timestamp: yup.string().oneOf(['asc', 'desc']).default('desc'),
  }).default({ timestamp: 'desc' }),
});

const findAuditLogSchema = yup.object({
  id: yup.number().integer().positive().required(),
});

module.exports = {
  /**
   * Find audit logs with filtering and pagination
   * GET /audit-logs
   */
  async find(ctx) {
    try {
      // Validate query parameters
      const validatedQuery = await validateYupSchema(findAuditLogsSchema)(ctx.query);
      
      const auditLogsService = strapi.service('api::audit-log.audit-logs');
      
      // Check permissions
      await strapi.auth.verify(ctx, { scope: ['audit-logs.read'] });
      
      const result = await auditLogsService.findAuditLogs({
        contentType: validatedQuery.contentType,
        userId: validatedQuery.userId,
        action: validatedQuery.action,
        dateRange: validatedQuery.dateRange,
        pagination: {
          page: validatedQuery.page,
          pageSize: validatedQuery.pageSize,
        },
        sort: validatedQuery.sort,
      });

      ctx.body = {
        data: result.results,
        meta: {
          pagination: result.pagination,
        },
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        ctx.badRequest('Invalid query parameters', { details: error.details });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        ctx.forbidden('Insufficient permissions to access audit logs');
        return;
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
      // Validate parameters
      const { id } = await validateYupSchema(findAuditLogSchema)(ctx.params);
      
      // Check permissions
      await strapi.auth.verify(ctx, { scope: ['audit-logs.read'] });
      
      const auditLogsService = strapi.service('api::audit-log.audit-logs');
      const auditLog = await auditLogsService.findAuditLog(id);
      
      if (!auditLog) {
        return ctx.notFound('Audit log not found');
      }

      ctx.body = {
        data: auditLog,
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        ctx.badRequest('Invalid audit log ID', { details: error.details });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        ctx.forbidden('Insufficient permissions to access audit logs');
        return;
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
      // Check permissions
      await strapi.auth.verify(ctx, { scope: ['audit-logs.read'] });
      
      const { dateRange } = ctx.query;
      
      // Build date filter
      const where = {};
      if (dateRange) {
        where.timestamp = {};
        if (dateRange.start) {
          where.timestamp.$gte = new Date(dateRange.start);
        }
        if (dateRange.end) {
          where.timestamp.$lte = new Date(dateRange.end);
        }
      }

      // Get statistics
      const [totalLogs, actionStats, contentTypeStats] = await Promise.all([
        // Total count
        strapi.db.query('api::audit-log.audit-log').count({ where }),
        
        // Count by action
        strapi.db.query('api::audit-log.audit-log').groupBy({
          groupBy: ['action'],
          where,
        }),
        
        // Count by content type
        strapi.db.query('api::audit-log.audit-log').groupBy({
          groupBy: ['contentType'],
          where,
          orderBy: { count: 'desc' },
          limit: 10,
        }),
      ]);

      ctx.body = {
        data: {
          totalLogs,
          actionBreakdown: actionStats,
          topContentTypes: contentTypeStats,
        },
      };
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        ctx.forbidden('Insufficient permissions to access audit logs');
        return;
      }
      
      strapi.log.error('Error fetching audit log statistics:', error);
      ctx.internalServerError('Failed to fetch audit log statistics');
    }
  },

  /**
   * Export audit logs as CSV
   * GET /audit-logs/export
   */
  async export(ctx) {
    try {
      // Check permissions
      await strapi.auth.verify(ctx, { scope: ['audit-logs.export'] });
      
      const { contentType, userId, action, dateRange } = ctx.query;
      
      const auditLogsService = strapi.service('api::audit-log.audit-logs');
      
      // Get all matching logs (no pagination for export)
      const result = await auditLogsService.findAuditLogs({
        contentType,
        userId,
        action,
        dateRange,
        pagination: { page: 1, pageSize: 10000 }, // Large page size for export
      });

      // Convert to CSV format
      const csvHeaders = [
        'ID',
        'Content Type',
        'Record ID',
        'Action',
        'Timestamp',
        'User ID',
        'User Email',
        'Changed Fields',
      ];

      const csvRows = result.results.map(log => [
        log.id,
        log.contentType,
        log.recordId,
        log.action,
        log.timestamp,
        log.userId || '',
        log.userEmail || '',
        log.changedFields ? Object.keys(log.changedFields).join(', ') : '',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(',')),
      ].join('\n');

      ctx.set('Content-Type', 'text/csv');
      ctx.set('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      ctx.body = csvContent;
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        ctx.forbidden('Insufficient permissions to export audit logs');
        return;
      }
      
      strapi.log.error('Error exporting audit logs:', error);
      ctx.internalServerError('Failed to export audit logs');
    }
  },
};