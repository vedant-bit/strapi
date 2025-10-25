import type { Struct } from '@strapi/types';

/**
 * Audit Log content type schema
 * Stores audit trail for all content operations
 */
export const auditLog: Struct.ContentTypeSchema = {
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
    },
    recordId: {
      type: 'string',
      required: true,
    },
    action: {
      type: 'enumeration',
      enum: ['create', 'update', 'delete'],
      required: true,
    },
    timestamp: {
      type: 'datetime',
      required: true,
    },
    userId: {
      type: 'integer',
    },
    userEmail: {
      type: 'string',
    },
    changedFields: {
      type: 'json',
    },
    payload: {
      type: 'json',
    },
    previousData: {
      type: 'json',
    },
  },
};

export default auditLog;