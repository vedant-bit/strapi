'use strict';

/**
 * Audit Log content type schema
 * Stores audit trail for all content operations
 */
module.exports = {
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
      configurable: false,
    },
    recordId: {
      type: 'string',
      required: true,
      configurable: false,
    },
    action: {
      type: 'enumeration',
      enum: ['create', 'update', 'delete'],
      required: true,
      configurable: false,
    },
    timestamp: {
      type: 'datetime',
      required: true,
      configurable: false,
    },
    userId: {
      type: 'integer',
      configurable: false,
    },
    userEmail: {
      type: 'string',
      configurable: false,
    },
    changedFields: {
      type: 'json',
      configurable: false,
    },
    payload: {
      type: 'json',
      configurable: false,
    },
    previousData: {
      type: 'json',
      configurable: false,
    },
  },
};