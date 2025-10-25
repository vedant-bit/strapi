'use strict';

/**
 * Audit Log content type schema
 * Stores audit trail for all content operations
 */
module.exports = {
  schema: {
    kind: 'collectionType',
    collectionName: 'strapi_audit_logs',
    info: {
      singularName: 'audit-log',
      pluralName: 'audit-logs',
      displayName: 'Audit Log',
      description: 'Audit trail for content operations',
    },
    options: {
      timestamps: false,
      draftAndPublish: false,
    },
    pluginOptions: {
      'content-manager': {
        visible: false,
      },
      'content-type-builder': {
        visible: false,
      },
    },
    attributes: {
      contentType: {
        type: 'string',
        required: true,
        description: 'Content type name (UID)',
      },
      recordId: {
        type: 'string',
        required: true,
        description: 'ID of the affected record',
      },
      action: {
        type: 'enumeration',
        enum: ['create', 'update', 'delete'],
        required: true,
        description: 'Type of operation performed',
      },
      timestamp: {
        type: 'datetime',
        required: true,
        description: 'When the operation occurred',
      },
      userId: {
        type: 'integer',
        description: 'ID of the user who performed the action',
      },
      userEmail: {
        type: 'string',
        description: 'Email of the user who performed the action',
      },
      changedFields: {
        type: 'json',
        description: 'Fields that were changed (for updates)',
      },
      payload: {
        type: 'json',
        description: 'Full payload for creates, or changed data for updates',
      },
      previousData: {
        type: 'json',
        description: 'Previous data before the change (for updates and deletes)',
      },
    },
  },
};