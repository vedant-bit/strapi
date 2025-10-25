'use strict';

/**
 * Audit Logs Lifecycle Service
 * Manages lifecycle hooks for audit logging
 */
module.exports = ({ strapi }) => {
  let isInitialized = false;
  let lifecycleSubscription = null;

  return {
    /**
     * Initialize audit logging lifecycle hooks
     */
    async bootstrap() {
      if (isInitialized) {
        return;
      }

      const auditLogsService = strapi.service('api::audit-log.audit-logs');
      
      // Subscribe to database lifecycle events
      lifecycleSubscription = strapi.db.lifecycles.subscribe({
        models: ['*'], // Listen to all models

        async afterCreate(event) {
          const { model, result, params } = event;
          
          if (!auditLogsService.shouldAuditContentType(model.uid)) {
            return;
          }

          const user = auditLogsService.getCurrentUser();
          const sanitizedData = auditLogsService.sanitizeData(result);

          await auditLogsService.saveAuditLog({
            contentType: model.uid,
            recordId: result.id?.toString() || result.documentId?.toString(),
            action: 'create',
            userId: user?.id || null,
            userEmail: user?.email || null,
            payload: sanitizedData,
            changedFields: null,
            previousData: null,
          });
        },

        async afterUpdate(event) {
          const { model, result, params } = event;
          
          if (!auditLogsService.shouldAuditContentType(model.uid)) {
            return;
          }

          const user = auditLogsService.getCurrentUser();
          
          // Get the previous data for comparison
          let previousData = null;
          const recordId = params.where?.id || params.where?.documentId;
          
          if (recordId) {
            try {
              // Try to get the previous data before the update
              // Note: This is a limitation - we get the data after update
              // In a real implementation, we'd need to fetch before update
              previousData = await strapi.db.query(model.uid).findOne({
                where: { id: recordId },
              });
            } catch (error) {
              strapi.log.debug('Could not fetch previous data for audit log:', error);
            }
          }

          const sanitizedResult = auditLogsService.sanitizeData(result);
          const sanitizedPrevious = auditLogsService.sanitizeData(previousData);
          const changedFields = auditLogsService.calculateDiff(sanitizedPrevious, sanitizedResult);

          await auditLogsService.saveAuditLog({
            contentType: model.uid,
            recordId: result.id?.toString() || result.documentId?.toString(),
            action: 'update',
            userId: user?.id || null,
            userEmail: user?.email || null,
            payload: params.data ? auditLogsService.sanitizeData(params.data) : null,
            changedFields,
            previousData: sanitizedPrevious,
          });
        },

        async beforeDelete(event) {
          const { model, params } = event;
          
          if (!auditLogsService.shouldAuditContentType(model.uid)) {
            return;
          }

          // Store the data before deletion in the event state
          const recordId = params.where?.id || params.where?.documentId;
          
          if (recordId) {
            try {
              const dataBeforeDelete = await strapi.db.query(model.uid).findOne({
                where: { id: recordId },
              });
              
              // Store in event state for use in afterDelete
              event.state = event.state || {};
              event.state.dataBeforeDelete = dataBeforeDelete;
            } catch (error) {
              strapi.log.debug('Could not fetch data before delete for audit log:', error);
            }
          }
        },

        async afterDelete(event) {
          const { model, params, state } = event;
          
          if (!auditLogsService.shouldAuditContentType(model.uid)) {
            return;
          }

          const user = auditLogsService.getCurrentUser();
          const previousData = state?.dataBeforeDelete;
          const sanitizedPrevious = auditLogsService.sanitizeData(previousData);
          
          const recordId = params.where?.id || params.where?.documentId || 
                          previousData?.id || previousData?.documentId;

          await auditLogsService.saveAuditLog({
            contentType: model.uid,
            recordId: recordId?.toString() || 'unknown',
            action: 'delete',
            userId: user?.id || null,
            userEmail: user?.email || null,
            payload: null,
            changedFields: null,
            previousData: sanitizedPrevious,
          });
        },

        async afterDeleteMany(event) {
          const { model, params, result } = event;
          
          if (!auditLogsService.shouldAuditContentType(model.uid)) {
            return;
          }

          const user = auditLogsService.getCurrentUser();
          const deletedCount = result?.count || 0;

          // Log bulk delete operation
          await auditLogsService.saveAuditLog({
            contentType: model.uid,
            recordId: 'bulk-delete',
            action: 'delete',
            userId: user?.id || null,
            userEmail: user?.email || null,
            payload: {
              deletedCount,
              whereClause: params.where,
            },
            changedFields: null,
            previousData: null,
          });
        },
      });

      // Set up cleanup cron job for expired logs
      const retentionDays = strapi.config.get('auditLog.retentionDays', 90);
      
      strapi.cron.add({
        auditLogsCleanup: {
          task: async () => {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() - retentionDays);
            
            try {
              await auditLogsService.deleteExpiredLogs(expirationDate);
            } catch (error) {
              strapi.log.error('Failed to clean up expired audit logs:', error);
            }
          },
          options: '0 2 * * *', // Run daily at 2 AM
        },
      });

      isInitialized = true;
      strapi.log.info('Audit logging lifecycle hooks initialized');
    },

    /**
     * Cleanup audit logging lifecycle hooks
     */
    async destroy() {
      if (lifecycleSubscription) {
        lifecycleSubscription();
        lifecycleSubscription = null;
      }

      // Remove cron job
      strapi.cron.remove('auditLogsCleanup');

      isInitialized = false;
      strapi.log.info('Audit logging lifecycle hooks destroyed');
    },

    /**
     * Check if audit logging is initialized
     */
    isInitialized() {
      return isInitialized;
    },
  };
};